import Link from "next/link";
import { ColorCounts } from "@/components/ColorBadge";
import { IconChevron, IconPlus, IconQuestion } from "@/components/icons";
import { logout } from "@/app/login/actions";
import { FORMAT_LABEL, formatDate, type Book, type PenColor } from "@/lib/domain";
import { requireUser } from "@/lib/supabase/server";

type Row = Book & { highlights: { color: PenColor; status: string }[] };

export default async function ShelfPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const tab = sp.tab === "finished" ? "finished" : "reading";
  const { supabase, email } = await requireUser();

  const { data } = await supabase
    .from("rn_books")
    .select("*, highlights:rn_highlights(color, status)")
    .eq("status", tab)
    .order(tab === "finished" ? "finished_at" : "updated_at", { ascending: false });
  const books = (data ?? []) as Row[];

  const { count: openActions } = await supabase
    .from("rn_highlights")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .not("action", "is", null)
    .eq("action_done", false);

  return (
    <main>
      <header className="flex min-h-14 items-center justify-between px-4 pt-3">
        <h1 className="text-[28px] font-bold">本棚</h1>
        <Link href="/books/new" className="btn btn-ghost !min-h-11 !rounded-full !px-4 text-sm">
          <IconPlus />
          本を登録
        </Link>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-2">
        {(openActions ?? 0) > 0 && (
          <Link href="/review" className="card flex items-center gap-3 p-4">
            <span className="flex-1 text-sm">
              <span className="font-bold">やってみること</span>が{" "}
              <span className="font-bold">{openActions}件</span> 残っています
            </span>
            <IconChevron className="size-4 text-mute" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-line p-1" role="tablist" aria-label="本の状態">
          {(["reading", "finished"] as const).map((t) => (
            <Link
              key={t}
              href={t === "reading" ? "/" : "/?tab=finished"}
              role="tab"
              aria-selected={tab === t}
              className={`flex min-h-10 items-center justify-center rounded-lg text-sm font-bold ${tab === t ? "bg-white" : "text-sub"}`}
            >
              {t === "reading" ? "読書中" : "読了"}
            </Link>
          ))}
        </div>

        {books.length === 0 && (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm leading-relaxed text-sub">
              {tab === "reading"
                ? "まだ本がありません。最初の1冊を登録しましょう。"
                : "読み終わった本はまだありません。"}
            </p>
            {tab === "reading" && (
              <Link href="/books/new" className="btn btn-primary">
                <IconPlus />
                本を登録
              </Link>
            )}
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {books.map((b) => {
            const confirmed = b.highlights.filter((h) => h.status === "confirmed");
            const counts = {
              red: confirmed.filter((h) => h.color === "red").length,
              blue: confirmed.filter((h) => h.color === "blue").length,
              green: confirmed.filter((h) => h.color === "green").length,
            };
            const sub = tab === "reading" ? b.question : b.one_line ?? b.question;
            return (
              <li key={b.id}>
                <Link href={`/books/${b.id}`} className="card flex flex-col gap-2 p-4">
                  <div className="flex items-start gap-2">
                    <span className="flex-1 text-base leading-snug font-bold">{b.title}</span>
                    <span className="shrink-0 rounded-full border border-line px-2 text-xs leading-5 text-sub">
                      {FORMAT_LABEL[b.format]}
                    </span>
                  </div>
                  {b.author && <span className="-mt-1 text-xs text-sub">{b.author}</span>}
                  {sub && (
                    <p className="flex gap-1.5 text-sm leading-relaxed text-ink">
                      {tab === "reading" && <IconQuestion className="mt-0.5 size-4 shrink-0 text-sub" />}
                      <span className="line-clamp-2">{sub}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <ColorCounts counts={counts} />
                    {tab === "finished" && (
                      <span className="text-xs text-sub">{formatDate(b.finished_at)} 読了</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <form action={logout} className="mt-6 flex items-center justify-between text-xs text-sub">
          <span className="truncate">{email}</span>
          <button type="submit" className="min-h-11 px-2 underline">
            ログアウト
          </button>
        </form>
      </div>
    </main>
  );
}
