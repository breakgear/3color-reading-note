"use client";

import { useEffect } from "react";

// 画面の一部でエラーが起きたときに出す（真っ白にしない）
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const err = error instanceof Error ? (error as Error & { digest?: string }) : null;
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col gap-4 px-4 pt-10">
      <h1 className="text-xl font-bold">うまくいきませんでした</h1>
      <div className="card flex flex-col gap-2 p-4 text-sm leading-relaxed">
        <p className="text-pen-red">{err?.message || "エラーが起きました"}</p>
        {err?.digest && <p className="text-xs text-sub">エラー番号：{err.digest}</p>}
      </div>
      <button type="button" onClick={() => retry()} className="btn btn-primary">
        もう一度試す
      </button>
      {/* エラーのあとは、ページ全体を読み込み直して戻る */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="btn btn-ghost">本棚へ戻る</a>
    </main>
  );
}
