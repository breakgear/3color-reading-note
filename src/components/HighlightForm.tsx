"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  chapterForPage,
  COLOR_INFO,
  pageFromLocation,
  PEN_COLORS,
  type Chapter,
  type Highlight,
  type PenColor,
} from "@/lib/domain";

function Buttons({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-2">
      <button type="submit" name="next" value="done" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "保存中…" : "保存"}
      </button>
      {isNew && (
        <button type="submit" name="next" value="more" className="btn btn-ghost w-full" disabled={pending}>
          保存して、続けて記録する
        </button>
      )}
    </div>
  );
}

export function HighlightForm({
  action,
  chapters,
  defaults,
  defaultColor = "red",
  format,
}: {
  action: (form: FormData) => Promise<void>;
  chapters: Chapter[];
  defaults?: Highlight;
  defaultColor?: PenColor;
  format: "paper" | "kindle" | "other";
}) {
  const [color, setColor] = useState<PenColor>(defaults?.color ?? defaultColor);
  const [location, setLocation] = useState(defaults?.location ?? "");
  const [chapterChoice, setChapterChoice] = useState<string>(defaults ? defaults.chapter_id ?? "none" : "auto");

  const autoChapter = chapterForPage(chapters, pageFromLocation(location));
  const hasPages = chapters.some((c) => c.start_page != null);

  return (
    <form action={action} className="flex flex-col gap-5 px-4 pt-2">
      <div>
        <label htmlFor="text" className="label">文章（必須）</label>
        <textarea
          id="text"
          name="text"
          required
          rows={5}
          maxLength={5000}
          defaultValue={defaults?.text}
          placeholder="スマホの文字読み取りやKindleでコピーした文章を、ここに貼り付け"
          className="field resize-y"
        />
      </div>

      <fieldset>
        <legend className="label">色</legend>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-col gap-2">
          {PEN_COLORS.map((k) => {
            const on = color === k;
            const c = COLOR_INFO[k];
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setColor(k)}
                className={`flex min-h-13 items-center gap-3 rounded-xl border-2 px-4 text-left ${on ? `${c.tint} border-current ${c.text}` : "border-line bg-white"}`}
              >
                <span aria-hidden="true" className={`size-5 shrink-0 rounded-full ${c.bg}`} />
                <span className={`w-5 font-bold ${c.text}`}>{c.short}</span>
                <span className="flex-1 text-[13px] text-ink">{c.desc}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <div className="w-32">
          <label htmlFor="location" className="label">{format === "kindle" ? "ページ／位置No." : "ページ"}</label>
          <input
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={format === "kindle" ? "No.1520" : "12"}
            maxLength={50}
            className="field"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="chapter_id" className="label">章</label>
          <select
            id="chapter_id"
            name="chapter_id"
            value={chapterChoice}
            onChange={(e) => setChapterChoice(e.target.value)}
            className="field"
          >
            {hasPages && <option value="auto">ページから自動</option>}
            <option value="none">章なし</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {hasPages && chapterChoice === "auto" && (
        <p className="-mt-3 text-xs text-sub">
          {autoChapter ? `→ ${autoChapter.label}` : "ページを入れると、章が自動で決まります"}
        </p>
      )}

      <div>
        <label htmlFor="memo" className="label">メモ（任意）</label>
        <input id="memo" name="memo" maxLength={2000} defaultValue={defaults?.memo ?? ""} placeholder="思ったことを一言" className="field" />
      </div>
      <div>
        <label htmlFor="action" className="label">やってみること（任意）</label>
        <input id="action" name="action" maxLength={500} defaultValue={defaults?.action ?? ""} placeholder="例：スマホを寝室の外に置く" className="field" />
      </div>

      <Buttons isNew={!defaults} />
    </form>
  );
}
