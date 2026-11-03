"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 読み取っていない・失敗した取り込みを、まとめてAIに読ませる
export function RetryAllButton({ itemIds }: { itemIds: string[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    for (const [i, id] of itemIds.entries()) {
      setProgress(`${i + 1} / ${itemIds.length} 件目を読み取り中…`);
      const res = await fetch("/api/inbox/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.setup) {
        setError(json.error ?? "設定に問題があります");
        break;
      }
    }
    setProgress(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={run} disabled={progress !== null} className="btn btn-primary w-full">
        {progress ?? `まとめて読み取る（${itemIds.length}件）`}
      </button>
      {error && <p role="alert" className="text-[13px] font-semibold text-pen-red">{error}</p>}
    </div>
  );
}
