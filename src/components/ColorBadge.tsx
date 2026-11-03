import { COLOR_INFO, type PenColor } from "@/lib/domain";

export function ColorBadge({ color, full = true }: { color: PenColor; full?: boolean }) {
  const c = COLOR_INFO[color];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${c.tint} ${c.text}`}>
      {full ? c.label : c.short}
    </span>
  );
}

export function ColorCounts({ counts }: { counts: Record<PenColor, number> }) {
  return (
    <span className="flex gap-3 text-[13px] font-bold">
      {(["red", "blue", "green"] as PenColor[]).map((k) => (
        <span key={k} className={`flex items-center gap-1 ${COLOR_INFO[k].text}`}>
          <span aria-hidden="true" className={`h-[3px] w-3.5 rounded ${COLOR_INFO[k].bg}`} />
          {COLOR_INFO[k].short} {counts[k]}
        </span>
      ))}
    </span>
  );
}
