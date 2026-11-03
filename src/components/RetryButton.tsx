"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ itemId, label = "読み直す" }: { itemId: string; label?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "run" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function run() {
    setState("run");
    const res = await fetch("/api/inbox/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("err");
      setMsg(json.error ?? "失敗しました");
    } else {
      setState("idle");
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={run} disabled={state === "run"} className="btn btn-ghost w-full">
        {state === "run" ? "AIが読み取り中…" : label}
      </button>
      {state === "err" && <p className="text-xs text-pen-red">{msg}</p>}
    </div>
  );
}
