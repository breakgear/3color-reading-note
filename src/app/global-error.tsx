"use client";

import { useEffect } from "react";

// アプリ全体が止まるほどのエラーのときに出す（真っ白にしない）
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const err = error instanceof Error ? (error as Error & { digest?: string }) : null;
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#f6f6f3", color: "#1b1b1f", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>うまくいきませんでした</h1>
          <div style={{ background: "#fff", border: "1px solid #e9e9e4", borderRadius: 16, padding: 16, fontSize: 14, lineHeight: 1.7 }}>
            <p style={{ color: "#c8102e", margin: 0 }}>{err?.message || "エラーが起きました"}</p>
            {err?.digest && <p style={{ color: "#5c5c66", fontSize: 12, margin: "8px 0 0" }}>エラー番号：{err.digest}</p>}
          </div>
          <button
            type="button"
            onClick={() => retry()}
            style={{ minHeight: 44, borderRadius: 12, border: "none", background: "#1b1b1f", color: "#fff", fontWeight: 700, fontSize: 15 }}
          >
            もう一度試す
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ textAlign: "center", color: "#1b1b1f", fontSize: 14 }}>本棚へ戻る</a>
        </main>
      </body>
    </html>
  );
}
