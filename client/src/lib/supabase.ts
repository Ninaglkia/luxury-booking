import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\s+/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/\s+/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

// On the OAuth callback page, clear any stale session from localStorage BEFORE
// createClient() initializes. SupabaseClient injects `Authorization: Bearer {session.access_token}`
// into every fetch call — if the stored token has invalid characters it causes
// `Headers.append: invalid header value` and breaks the PKCE code exchange.
if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
  Object.keys(localStorage).forEach(key => {
    if (/^sb-.*-auth-token$/.test(key)) {
      localStorage.removeItem(key);
    }
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
