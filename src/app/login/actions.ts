"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function back(mode: "login" | "signup" | "reset", params: Record<string, string>): never {
  const q = new URLSearchParams({ mode, ...params });
  redirect(`/login?${q.toString()}`);
}

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      back("login", { message: "このメールアドレスは登録済みです。ログインするか、下の「パスワードを忘れた」から設定してください" });
    }
    back("signup", { error: `登録できませんでした：${error.message}` });
  }

  // すでに登録済みのアドレスだと、エラーにならず空の結果が返る
  if (data.user && data.user.identities?.length === 0) {
    back("login", { message: "このメールアドレスは登録済みです。ログインするか、下の「パスワードを忘れた」から設定してください" });
  }

  // メール確認が不要な設定なら、そのままログイン済みになる
  if (data.session) redirect("/");
  back("login", { message: "確認メールを送りました。メールのリンクを押してからログインしてください" });
}

// パスワードを決める（忘れた・まだ決めていない）ためのメールを送る
export async function requestPasswordReset(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  if (!email) back("reset", { error: "メールアドレスを入れてください" });

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/auth/new-password`,
  });
  if (error) back("reset", { error: `送れませんでした：${error.message}` });
  back("login", {
    message: "メールを送りました。このブラウザでメールのリンクを開き、新しいパスワードを決めてください",
  });
}

export async function setNewPassword(form: FormData) {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) redirect("/auth/new-password?error=1");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    back("reset", { error: "パスワードを変更できませんでした。もう一度メールを送ってください" });
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
