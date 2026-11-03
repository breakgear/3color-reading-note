"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function back(mode: "login" | "signup", params: Record<string, string>): never {
  const q = new URLSearchParams({ mode, ...params });
  redirect(`/login?${q.toString()}`);
}

function isAllowed(email: string) {
  const list = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length === 0 || list.includes(email.toLowerCase());
}

export async function login(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) back("login", { error: "メールアドレスとパスワードを入れてください" });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.includes("Email not confirmed")
      ? "メールの確認がまだです。届いたメールのリンクを押してください"
      : "メールアドレスかパスワードが違います";
    back("login", { error: msg });
  }
  redirect("/");
}

export async function signup(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || password.length < 8) {
    back("signup", { error: "パスワードは8文字以上にしてください" });
  }
  if (!isAllowed(email)) {
    back("signup", { error: "このメールアドレスでは登録できません" });
  }

  const h = await headers();
  const origin =
    h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) back("signup", { error: `登録できませんでした：${error.message}` });

  // メール確認が不要な設定なら、そのままログイン済みになる
  if (data.session) redirect("/");
  back("login", { message: "確認メールを送りました。メールのリンクを押してからログインしてください" });
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
