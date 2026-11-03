import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// ブラウザ側（画像のアップロードなど）で使うSupabase
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
