"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// 削除など取り消せない操作は、2回押して確定する
export function ConfirmSubmit({ label, confirmLabel }: { label: string; confirmLabel: string }) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="btn w-full border-[1.5px] border-pen-red bg-white text-pen-red"
      >
        {label}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setArmed(false)} className="btn btn-ghost flex-1">
        やめる
      </button>
      <button type="submit" disabled={pending} className="btn flex-1 bg-pen-red text-white">
        {pending ? "削除中…" : confirmLabel}
      </button>
    </div>
  );
}
