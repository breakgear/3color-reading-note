import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPABASE_KEY, SUPABASE_URL, assertSupabaseEnv } from "./env";

// サーバー側（ページ・サーバーアクション・API）で使うSupabase
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
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
          // ページの表示中はクッキーを書き換えられない。
          // ログイン状態の更新は proxy.ts が担当するので問題ない。
        }
      },
    },
  });
}

// ログインしていなければログイン画面へ。ログインしていれば本人の情報を返す
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) {
    redirect("/login");
  }
  return {
    supabase,
    userId: userId as string,
    email: (data?.claims?.email as string | undefined) ?? "",
  };
}
