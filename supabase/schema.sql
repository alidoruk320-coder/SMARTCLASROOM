create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 20),
  avatar text not null default '🧑‍💻',
  total_study_seconds bigint not null default 0 check (total_study_seconds >= 0),
  record_study_seconds bigint not null default 0 check (record_study_seconds >= 0),
  total_questions bigint not null default 0 check (total_questions >= 0),
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
revoke insert, delete on public.profiles from authenticated;
grant update (username, avatar) on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := left(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')), 20);
  if char_length(requested_username) < 3 then
    requested_username := 'Student-' || left(new.id::text, 6);
  end if;

  insert into public.profiles (id, username, avatar)
  values (
    new.id,
    requested_username,
    left(coalesce(new.raw_user_meta_data ->> 'avatar', '🧑‍💻'), 32)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_after_auth_user on auth.users;
create trigger create_profile_after_auth_user
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

create table if not exists public.room_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  room_code text not null default 'STUDY' check (room_code = 'STUDY'),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.room_members enable row level security;
revoke all on public.room_members from anon, authenticated;
grant select on public.room_members to authenticated;

drop policy if exists "Users can read their own room membership" on public.room_members;
create policy "Users can read their own room membership"
  on public.room_members for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.join_study_room()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtext('studyverse-study-room')::bigint);
  delete from public.room_members where last_seen_at < now() - interval '45 seconds';

  if not exists (select 1 from public.room_members where user_id = current_user_id)
     and (select count(*) from public.room_members) >= 10 then
    raise exception using errcode = 'P0001', message = 'CLASSROOM_FULL';
  end if;

  insert into public.room_members (user_id)
  values (current_user_id)
  on conflict (user_id) do update set last_seen_at = now();

  return (select count(*)::integer from public.room_members);
end;
$$;

create or replace function public.leave_study_room()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.room_members where user_id = auth.uid();
end;
$$;

revoke all on function public.join_study_room() from public;
revoke all on function public.leave_study_room() from public;
grant execute on function public.join_study_room() to authenticated;
grant execute on function public.leave_study_room() to authenticated;

drop policy if exists "Authenticated users can receive classroom events" on realtime.messages;
create policy "Authenticated users can receive classroom events"
  on realtime.messages for select to authenticated
  using (
    realtime.topic() = 'classroom:STUDY'
    and realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.room_members
      where user_id = (select auth.uid())
        and room_code = 'STUDY'
        and last_seen_at > now() - interval '45 seconds'
    )
  );

drop policy if exists "Authenticated users can send classroom events" on realtime.messages;
create policy "Authenticated users can send classroom events"
  on realtime.messages for insert to authenticated
  with check (
    realtime.topic() = 'classroom:STUDY'
    and realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.room_members
      where user_id = (select auth.uid())
        and room_code = 'STUDY'
        and last_seen_at > now() - interval '45 seconds'
    )
  );