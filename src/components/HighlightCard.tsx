import Link from "next/link";
import { COLOR_INFO, formatLocation, type Highlight } from "@/lib/domain";
import { ColorBadge } from "./ColorBadge";
import { IconPencil, IconTask } from "./icons";

export function HighlightCard({ h, editHref }: { h: Highlight; editHref?: string }) {
  const loc = formatLocation(h);
  return (
    <article className="card flex flex-col gap-2.5 p-4">
      <div className="flex items-center gap-2">
        <ColorBadge color={h.color} />
        {loc && <span className="text-xs text-sub">{loc}</span>}
        {h.source === "screenshot" && <span className="text-xs text-sub">・取り込み</span>}
        <span className="flex-1" />
        {editHref && (
          <Link
            href={editHref}
            aria-label="この記録を編集"
            className="-mr-2 flex size-11 items-center justify-center rounded-xl text-sub"
          >
            <IconPencil />
          </Link>
        )}
      </div>
      <p className={`pen-line ${COLOR_INFO[h.color].line} text-[15px] leading-[1.95] whitespace-pre-wrap`}>
        {h.text}
      </p>
      {h.memo && (
        <p className="rounded-xl bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink">
          <span className="mr-2 font-bold">メモ</span>
          {h.memo}
        </p>
      )}
      {h.action && (
        <p className="flex items-start gap-1.5 text-[13px] leading-relaxed">
          <IconTask className="mt-0.5 size-4 shrink-0" />
          <span className="font-bold">やってみること</span>
          <span className={h.action_done ? "text-sub line-through" : ""}>{h.action}</span>
        </p>
      )}
    </article>
  );
}
