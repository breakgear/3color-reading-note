"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { bookLabel, QUESTION_TEMPLATES, sameBook, type BookFormat, type Chapter } from "@/lib/domain";

type Row = { key: number; id?: string; label: string; start_page: string };
type ExistingBook = { id: string; title: string; volume: string | null; status: "reading" | "finished" };

function Submit({ label, blocked }: { label: string; blocked?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending || blocked}>
      {pending ? "保存中…" : label}
    </button>
  );
}

export function BookForm({
  action,
  submitLabel,
  defaults,
  existing = [],
}: {
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  defaults?: {
    title: string;
    volume: string | null;
    author: string | null;
    format: BookFormat;
    question: string | null;
    chapters: Chapter[];
  };
  // 登録済みの本（新しく登録するときだけ渡す。同じ書名・同じ巻の重複チェック用）
  existing?: ExistingBook[];
}) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [volume, setVolume] = useState(defaults?.volume ?? "");
  const [allowDup, setAllowDup] = useState(false);
  const dup = title.trim() ? existing.find((b) => sameBook(b, { title, volume })) : undefined;
  // 同じ書名で巻が違うもの（シリーズ）があれば、巻を入れるよう促す
  const series = title.trim() && !volume.trim()
    ? existing.filter((b) => b.volume && sameBook({ title: b.title }, { title }))
    : [];
  const [question, setQuestion] = useState(defaults?.question ?? "");
  const [rows, setRows] = useState<Row[]>(
    (defaults?.chapters ?? []).map((c, i) => ({
      key: i,
      id: c.id,
      label: c.label,
      start_page: c.start_page == null ? "" : String(c.start_page),
    })),
  );
  const [nextKey, setNextKey] = useState(1000);
  const [bulk, setBulk] = useState("");

  const addRow = (label = "") => {
    setRows((r) => [...r, { key: nextKey, label, start_page: "" }]);
    setNextKey((k) => k + 1);
  };
  const addBulk = () => {
    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    setRows((r) => [
      ...r,
      ...lines.map((l, i) => {
        // 行の最後の数字を開始ページとして読む（例：「第1章 習慣とは 12」）
        const m = l.match(/^(.*?)[\s　…・.]*(\d{1,4})$/);
        return {
          key: nextKey + i,
          label: m ? m[1].trim() || l : l,
          start_page: m ? m[2] : "",
        };
      }),
    ]);
    setNextKey((k) => k + lines.length);
    setBulk("");
  };

  return (
    <form action={action} className="flex flex-col gap-5 px-4 pt-2">
      <div>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="title" className="label">書名（必須）</label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setAllowDup(false);
              }}
              className="field"
            />
          </div>
          <div className="w-24 shrink-0">
            <label htmlFor="volume" className="label">巻（任意）</label>
            <input
              id="volume"
              name="volume"
              maxLength={20}
              value={volume}
              onChange={(e) => {
                setVolume(e.target.value);
                setAllowDup(false);
              }}
              placeholder="上・12"
              className="field"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-sub">上巻・下巻は「上」「下」、マンガは「12」のように数字で入れます。</p>
        {series.length > 0 && !dup && (
          <p className="mt-2 rounded-xl bg-pen-blue-tint px-3 py-2 text-[13px] leading-relaxed text-pen-blue">
            この本は {series.map((b) => bookLabel(b).replace(b.title, "").trim()).join("・")} が登録済みです。巻を入れてください。
          </p>
        )}
        {dup && (
          <div role="alert" className="mt-2 flex flex-col gap-2 rounded-xl bg-pen-red-tint p-3 text-[13px] leading-relaxed">
            <p className="font-bold text-pen-red">
              『{bookLabel(dup)}』はすでに登録されています（{dup.status === "reading" ? "読書中" : "読了"}）
            </p>
            <Link href={`/books/${dup.id}`} className="btn btn-ghost !min-h-10 text-sm">
              登録済みの本を開く
            </Link>
            <label className="flex min-h-11 items-center gap-2 text-ink">
              <input
                type="checkbox"
                name="allow_duplicate"
                checked={allowDup}
                onChange={(e) => setAllowDup(e.target.checked)}
                className="size-5 accent-ink"
              />
              別の本として登録する（版違い・読み直しなど）
            </label>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="author" className="label">著者</label>
        <input id="author" name="author" maxLength={200} defaultValue={defaults?.author ?? ""} className="field" />
      </div>

      <fieldset>
        <legend className="label">本の種類</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-line p-1">
          {(
            [
              ["paper", "紙の本"],
              ["kindle", "Kindle"],
              ["other", "その他"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="relative">
              <input
                type="radio"
                name="format"
                value={v}
                defaultChecked={(defaults?.format ?? "paper") === v}
                className="peer sr-only"
              />
              <span className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-sub peer-checked:bg-white peer-checked:text-ink peer-focus-visible:outline-2">
                {l}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="card flex flex-col gap-3 border-[1.5px] border-ink p-4">
        <div>
          <label htmlFor="question" className="text-base font-bold">この本で知りたいことは？</label>
          <p className="mt-1 text-xs leading-relaxed text-sub">
            1つだけでOK。先に「はじめに」と目次を眺めると、問いを作りやすくなります。
          </p>
        </div>
        <textarea
          id="question"
          name="question"
          rows={3}
          maxLength={500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例：三日坊主にならない習慣は、どう作ればいい？"
          className="field resize-none !bg-paper"
        />
        <div className="flex flex-wrap gap-1.5">
          {QUESTION_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setQuestion(t)}
              className="min-h-11 rounded-full border border-line bg-white px-3 text-[13px]"
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <details className="card p-4" open={rows.length > 0}>
        <summary className="flex min-h-8 cursor-pointer items-center text-base font-bold">
          目次（任意）
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-sub">
          章を入れておくと、記録が章ごとに並びます。開始ページを入れると、記録のページから章を自動で決めます。
        </p>
        <input type="hidden" name="chapters" value={JSON.stringify(rows.map(({ id, label, start_page }) => ({ id, label, start_page })))} />

        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={r.key} className="flex items-center gap-2">
              <input
                aria-label={`${i + 1}番目の章の名前`}
                value={r.label}
                onChange={(e) =>
                  setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, label: e.target.value } : x)))
                }
                placeholder="第1章 〇〇"
                className="field flex-1"
              />
              <input
                aria-label={`${i + 1}番目の章の開始ページ`}
                inputMode="numeric"
                value={r.start_page}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((x) => (x.key === r.key ? { ...x, start_page: e.target.value.replace(/\D/g, "") } : x)),
                  )
                }
                placeholder="p."
                className="field !w-20"
              />
              <button
                type="button"
                aria-label={`${i + 1}番目の章を削除`}
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sub"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => addRow()} className="btn btn-ghost mt-2 w-full">
          ＋ 章を1つ追加
        </button>

        <div className="mt-4">
          <label htmlFor="bulk" className="label">まとめて貼り付け（1行に1章。行の最後の数字は開始ページ）</label>
          <textarea
            id="bulk"
            rows={3}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"はじめに 1\n第1章 習慣は環境で決まる 6\n第2章 小さく始める 31"}
            className="field resize-none"
          />
          <button type="button" onClick={addBulk} className="btn btn-ghost mt-2 w-full">
            目次に入れる
          </button>
        </div>
      </details>

      <Submit label={submitLabel} blocked={Boolean(dup) && !allowDup} />
    </form>
  );
}
