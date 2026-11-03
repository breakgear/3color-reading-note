import Link from "next/link";
import { login, requestPasswordReset, signup } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const mode = sp.mode === "signup" ? "signup" : sp.mode === "reset" ? "reset" : "login";
  const error = typeof sp.error === "string" ? sp.error : null;
  const message = typeof sp.message === "string" ? sp.message : null;

  return (
    <main className="flex min-h-screen flex-col justify-center px-5 py-10">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-8 rounded-full bg-pen-red" />
          <span className="h-1.5 w-8 rounded-full bg-pen-blue" />
          <span className="h-1.5 w-8 rounded-full bg-pen-green" />
        </div>
        <h1 className="text-3xl font-bold">3色読書ノート</h1>
        <p className="text-sm leading-relaxed text-sub">
          紙の本もKindleも、3色で記録して、考えと行動につなげる。
        </p>
      </div>

      {mode !== "reset" && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-line p-1" role="tablist">
          <Link
            href="/login?mode=login"
            role="tab"
            aria-selected={mode === "login"}
            className={`flex min-h-10 items-center justify-center rounded-lg text-sm font-bold ${mode === "login" ? "bg-white" : ""}`}
          >
            ログイン
          </Link>
          <Link
            href="/login?mode=signup"
            role="tab"
            aria-selected={mode === "signup"}
            className={`flex min-h-10 items-center justify-center rounded-lg text-sm font-bold ${mode === "signup" ? "bg-white" : ""}`}
          >
            はじめての登録
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-pen-red-tint px-4 py-3 text-sm font-semibold text-pen-red">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-xl bg-pen-blue-tint px-4 py-3 text-sm font-semibold text-pen-blue">
          {message}
        </p>
      )}

      {mode === "reset" ? (
        <form action={requestPasswordReset} className="card flex flex-col gap-4 p-5">
          <h2 className="text-base font-bold">パスワードの設定・再設定</h2>
          <p className="text-[13px] leading-relaxed text-sub">
            登録したメールアドレスに、パスワードを決めるためのリンクを送ります。
            ほかのアプリ（Investment Dashboardなど）と同じアカウントでも使えます。
          </p>
          <div>
            <label htmlFor="email" className="label">メールアドレス</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="field" />
          </div>
          <button type="submit" className="btn btn-primary">リンクを送る</button>
          <Link href="/login" className="min-h-11 content-center text-center text-sm text-sub underline">
            ログインに戻る
          </Link>
        </form>
      ) : (
        <>
          <form action={mode === "signup" ? signup : login} className="card flex flex-col gap-4 p-5">
            <div>
              <label htmlFor="email" className="label">メールアドレス</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="field" />
            </div>
            <div>
              <label htmlFor="password" className="label">
                パスワード{mode === "signup" && "（8文字以上）"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : undefined}
                required
                className="field"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {mode === "signup" ? "登録する" : "ログイン"}
            </button>
          </form>
          <Link href="/login?mode=reset" className="mt-4 min-h-11 content-center text-center text-sm text-sub underline">
            パスワードを忘れた・まだ決めていない
          </Link>
        </>
      )}
    </main>
  );
}
