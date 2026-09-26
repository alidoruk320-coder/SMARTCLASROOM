# StudyVerse

StudyVerse is a single-room focus platform for small study groups. The experience is intentionally simplified to one shared classroom that supports up to 10 people, with a system-controlled room and no multi-room creation flow.

## Stack

- Next.js 16 + TypeScript + Tailwind CSS
- Supabase Auth, Postgres, Presence, and Broadcast
- Zod validation

## Current behavior

- One room only: `STUDY`
- Maximum capacity: 10 people
- Supabase Auth login and registration with database-backed profiles
- New profiles start with zero study time, questions, and XP
- Database RPC enforces room capacity; stale seats expire after disconnect
- Private authenticated Realtime channel shows only connected students
- Teacher opens with a solved-question check-in, then asks for each student's goal
- The teacher calls a random online student every five minutes
- Students can answer in the classroom; connected students see prompts and answers live

## Supabase setup

Create a `.env.local` file using the URL and anon/public key from your Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor, then restart `npm run dev`. It creates zero-initialized profiles on Auth signup, protects profile fields with Row Level Security, atomically enforces the 10-person room capacity, and authorizes the private `classroom:STUDY` channel. In Supabase Realtime settings, disable public channel access so the private-channel policies are enforced.

The app uses the public/anon project key in the browser; never put a Supabase service-role key in `NEXT_PUBLIC_*` variables. Configure email confirmation in Supabase Auth according to the deployment's needs.

## Current limitations

- Teacher prompts and answers use Realtime Broadcast and are not persisted; students who join later or refresh do not see the earlier transcript.
- Study counters are initialized to zero and displayed from profiles, but timer-based updates to lifetime stats are not implemented yet.
- Without `.env.local` and the SQL setup, Auth and cross-device Realtime remain unavailable; forms report the missing configuration instead of creating fake users.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes

The app intentionally keeps a single-room model: one shared classroom, with no multi-room creation flow.
