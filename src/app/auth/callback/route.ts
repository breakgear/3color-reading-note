import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// 確認メール・パスワード設定メールのリンクを押したときに来る場所
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next") ?? "/";
  // 自分のサイトの中だけに戻す
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, url.origin));

  const dest = new URL("/login", url.origin);
  if (next.startsWith("/auth/new-password")) {
    dest.searchParams.set("mode", "reset");
    dest.searchParams.set(
      "error",
      "リンクの期限が切れたか、別のブラウザで開かれました。もう一度メールを送ってください",
    );
  } else {
    // 別のブラウザで開いた場合も、メールの確認自体は済んでいる
    dest.searchParams.set("message", "メールの確認ができました。ログインしてください");
  }
  return NextResponse.redirect(dest);
}
