import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton Supabase client. Only constructed when VITE_DATA_SOURCE=supabase,
// so the localStorage prototype never touches the network.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
    );
  }
  client = createClient(url, anonKey, {
    // PKCE instead of the library's default implicit flow. The implicit flow
    // embeds access tokens in the redirect URL fragment and, while parsing
    // them, warns "Session as retrieved from URL was issued in the future?
    // Check the device clock for skew" whenever the visitor's clock is even a
    // couple of seconds behind Supabase's servers (zero-tolerance comparison
    // of issuedAt against local time). PKCE redirects carry a one-time ?code=
    // that is exchanged with the token endpoint instead, so that comparison
    // never runs — and no tokens leak into browser history. Google sign-in
    // (signInWithOAuth), recovery emails, and the ?code= handling in
    // Login.tsx (exchangeCodeForSession) all support PKCE as-is.
    auth: {
      flowType: "pkce",
    },
    // Every PostgREST/RPC call inherits a 10s ceiling so a hung backend
    // surfaces as an error instead of an infinite spinner. Callers may
    // still pass their own signal (e.g. abort on unmount).
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10_000) }),
    },
  });
  return client;
}
