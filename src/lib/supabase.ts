import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Anonymous sign-in, only used when someone adds to an Ummah goal, so each
 * phone has a private id for the daily cap. No name, email or phone is collected.
 */
export async function ensureAnonymousSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    const { error } = await supabase.auth.signInAnonymously();
    return !error;
  } catch {
    return false;
  }
}
