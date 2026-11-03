"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ANSWER_LABEL, type AnswerStatus, type Book } from "@/lib/domain";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "保存中…" : "まとめを保存（読了にする）"}
    </button>
  );
}

export function FinishForm({
  action,
  book,
  reds,
}: {
  action: (form: FormData) => Promise<void>;
  book: Book;
  reds: { id: string; text: string }[];
}) {
  const [status, setStatus] = useState<AnswerStatus | "">(book.answer_status ?? "");

  return (
    <form action={action} className="flex flex-col gap-5 px-4 pt-2">
      <section className="card flex flex-col gap-3 p-4">
        <p className="text-xs text-sub">読む前の問い</p>
        <p className="text-[15px] leading-relaxed font-bold">
          {book.question ?? "（問いは書かれていません）"}
        </p>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">答えは見つかった？</legend>
          <input type="hidden" name="answer_status" value={status} />
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ANSWER_LABEL) as AnswerStatus[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={status === k}
                onClick={() => setStatus(k)}
                className={`min-h-11 rounded-xl border-[1.5px] text-sm font-bold ${status === k ? "border-ink bg-ink text-white" : "border-line bg-white"}`}
              >
                {ANSWER_LABEL[k]}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="answer" className="label">今の自分の答え</label>
          <textarea id="answer" name="answer" rows={3} maxLength={2000} defaultValue={book.answer ?? ""} placeholder="自分の言葉で、短く" className="field resize-none !bg-paper" />
        </div>
        {(status === "partial" || status === "not_yet") && (
          <div>
            <label htmlFor="new_question" className="label">新しく生まれた問い（次の本で探す）</label>
            <input id="new_question" name="new_question" maxLength={500} defaultValue={book.new_question ?? ""} className="field !bg-paper" />
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-4 border-[1.5px] border-ink p-4">
        <div>
          <label htmlFor="one_line" className="text-[15px] font-bold">この本を一言でいうと？</label>
          <textarea id="one_line" name="one_line" rows={2} maxLength={500} defaultValue={book.one_line ?? ""} placeholder="自分の言葉で、短く" className="field mt-1 resize-none !bg-paper" />
        </div>
        <div>
          <label htmlFor="change_plan" className="text-[15px] font-bold">自分は何を変える？</label>
          <input id="change_plan" name="change_plan" maxLength={500} defaultValue={book.change_plan ?? ""} placeholder="明日からできることを1つ" className="field mt-1 !bg-paper" />
        </div>

        <details className="rounded-xl border border-dashed border-mute p-3">
          <summary className="min-h-8 cursor-pointer content-center text-[13px] font-medium text-sub">
            書けないときのヒント
          </summary>
          <div className="mt-2 flex flex-col gap-2 text-[13px] leading-relaxed">
            {reds.length > 0 ? (
              <>
                <p className="text-xs text-sub">あなたが引いた赤：</p>
                {reds.slice(0, 5).map((r) => (
                  <p key={r.id} className="pen-line pen-red">
                    {r.text}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-xs text-sub">この本にはまだ赤の記録がありません。</p>
            )}
            <p className="mt-1 text-sub">
              問いかけ：赤に共通することは？ 読む前の自分と、考えが変わったところは？
            </p>
          </div>
        </details>
      </section>

      <Submit />
    </form>
  );
}
