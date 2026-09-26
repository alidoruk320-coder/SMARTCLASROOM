import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const isSupabaseServerConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export async function createSupabaseServerClient() {
  if (!isSupabaseServerConfigured) {
    throw new Error("Supabase server configuration is missing.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore in server components.
          }
        },
      },
    },
  );
}

export async function getSupabaseAuthContext() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  return { client, user, error };
}
