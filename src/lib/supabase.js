import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabaseConfigError = '';

let validSupabaseUrl = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseConfigError = 'Add both Supabase values to the root .env.local file.';
} else {
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      supabaseConfigError = 'VITE_SUPABASE_URL must start with https://.';
    } else {
      validSupabaseUrl = parsedUrl.toString().replace(/\/$/, '');
    }
  } catch {
    supabaseConfigError = 'VITE_SUPABASE_URL must be the full URL copied from Supabase, starting with https://.';
  }
}

export const isSupabaseConfigured = Boolean(validSupabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(validSupabaseUrl, supabaseAnonKey)
  : null;
