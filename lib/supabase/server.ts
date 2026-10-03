import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { env } from "@/lib/env";

/**
 * Creates a server-side Supabase client that carries the signed-in Clerk JWT token.
 * 
 * - Identity is a token, and the token carries the organization.
 * - Sessions belong strictly to Clerk; Supabase session persistence and auto-refresh are disabled.
 * - If signed in, the token travels in the Authorization header with every database request,
 *   enabling Supabase RLS policies to inspect claims (e.g. auth.jwt() ->> 'org_id').
 */
export async function createServerSupabaseClient() {
  const { getToken } = await auth();
  
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch {
    token = null;
  }

  if (!token) {
    token = await getToken();
  }

  return createClient(env.supabase.url, env.supabase.anonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
