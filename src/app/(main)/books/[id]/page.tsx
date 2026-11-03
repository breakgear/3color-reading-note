import Link from "next/link";
import { HighlightCard } from "@/components/HighlightCard";
import { PageHeader } from "@/components/PageHeader";
import { IconCheck, IconChevron, IconPlus, IconQuestion } from "@/components/icons";
import {
  ANSWER_LABEL,
  COLOR_INFO,
  FORMAT_LABEL,
  formatLocation,
  isPenColor,
  PEN_COLORS,
  volumeLabel,
  type Highlight,
  type PenColor,
} from "@/lib/domain";
import { getBook, getConfirmedHighlights } from "@/lib/queries";

export default async function BookPage({ params, searchParams }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const filter: PenColor | "all" = isPenColor(sp.color) ? sp.color : "all";

  const { book, chapters } = await getBook(id);
  const all = await getConfirmedHighlights(id);
  const shown = filter === "all" ? all : all.filter((h) => h.color === filter);
  const latest = [...all].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const groups = [
    ...chapters.map((c) => ({ key: c.id, label: c.label, items: shown.filter((h) => h.chapter_id === c.id), mine: all.filter((h) => h.chapter_id === c.id) })),
    {
      key: "none",
      label: chapters.length ? "章なし" : "記録",
      items: shown.filter((h) => !h.chapter_id || !chapters.some((c) => c.id === h.chapter_id)),
      mine: all.filter((h) => !h.chapter_id || !chapters.some((c) => c.id === h.chapter_id)),
    },
  ].filter((g) => g.key !== "none" || g.mine.length > 0 || chapters.length === 0);

  const count = (k: PenColor | "all", list: Highlight[] = all) =>
    k === "all" ? list.length : list.filter((h) => h.color === k).length;

  return (
    <main>
      <PageHeader
        title=""
        backHref="/"
        backLabel="本棚"
        right={
          <Link href={`/books/${id}/edit`} className="min-h-11 px-2 text-sm font-medium text-sub underline">
            本の情報を編集
          </Link>
        }
      />

      <div className="flex flex-col gap-4 px-4">
        <div>
          <h1 className="text-xl leading-snug font-bold">
            {book.title}
            {book.volume && <span className="ml-2 text-base">{volumeLabel(book.volume)}</span>}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sub">
            {book.author && <span>{book.author}</span>}
            <span className="rounded-full border border-line px-2 leading-5">{FORMAT_LABEL[book.format]}</span>
            {book.status === "finished" && <span className="font-bold text-ink">読了</span>}
            <span className="flex-1" />
            <Link href={`/books/new?from=${id}`} className="flex min-h-9 items-center gap-1 font-bold text-ink underline">
              <IconPlus className="size-4" />
              次の巻を登録
            </Link>
          </p>
        </div>

        <section aria-label="この本で知りたいこと" className="card border-[1.5px] border-ink p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-sub">
            <IconQuestion />
            この本で知りたいこと
          </p>
          {book.question ? (
            <p className="mt-1 text-[15px] leading-relaxed font-bold">{book.question}</p>
          ) : (
            <Link href={`/books/${id}/edit`} className="mt-1 block text-sm text-sub underline">
              問いを書く
            </Link>
          )}
          {book.status === "reading" && latest && (
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-sub">
              前回の記録：{formatLocation(latest) ? `${formatLocation(latest)}　` : ""}
              <span className="text-ink">{latest.text.slice(0, 40)}{latest.text.length > 40 ? "…" : ""}</span>
            </p>
          )}
        </section>

        {book.status === "finished" ? (
          <section className="card flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold">読み終わりのまとめ</h2>
              <Link href={`/books/${id}/finish`} className="min-h-11 content-center px-2 text-sm text-sub underline">
                編集
              </Link>
            </div>
            {book.answer_status && (
              <p className="text-sm">
                <span className="text-sub">問いの答え：</span>
                <span className="font-bold">{ANSWER_LABEL[book.answer_status]}</span>
              </p>
            )}
            {book.answer && <Summary label="今の自分の答え" text={book.answer} />}
            {book.one_line && <Summary label="この本を一言で" text={book.one_line} />}
            {book.change_plan && <Summary label="自分は何を変える" text={book.change_plan} />}
            {book.new_question && <Summary label="新しい問い" text={book.new_question} />}
          </section>
        ) : (
          <Link href={`/books/${id}/finish`} className="btn btn-ghost w-full">
            <IconCheck />
            読み終わった・ひと言まとめへ
          </Link>
        )}

        <div role="group" aria-label="色で絞り込み" className="flex gap-2 overflow-x-auto pb-1">
          {(["all", ...PEN_COLORS] as const).map((k) => {
            const on = filter === k;
            const label = k === "all" ? "すべて" : COLOR_INFO[k].short;
            const activeCls = k === "all" ? "bg-ink border-ink text-white" : `${COLOR_INFO[k].bg} border-transparent text-white`;
            return (
              <Link
                key={k}
                href={k === "all" ? `/books/${id}` : `/books/${id}?color=${k}`}
                aria-current={on ? "true" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm font-bold ${on ? activeCls : "border-line bg-white"}`}
              >
                {k !== "all" && (
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${on ? "bg-white" : COLOR_INFO[k].bg}`} />
                )}
                {label}
                <span className="font-medium">{count(k)}</span>
              </Link>
            );
          })}
        </div>

        {all.length === 0 && (
          <p className="card p-6 text-center text-sm leading-relaxed text-sub">
            まだ記録がありません。<br />
            文章を貼り付けるか、「取り込み」からスクショを送ってください。
          </p>
        )}

        <div className="flex flex-col">
          {all.length > 0 &&
            groups.map((g) => (
              <details key={g.key} open className="group border-t border-line py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <IconChevron className="size-4 shrink-0 text-sub transition-transform group-open:rotate-90" />
                  <span className="flex-1 truncate text-sm font-bold">{g.label}</span>
                  <span className="flex shrink-0 gap-2">
                    {PEN_COLORS.filter((k) => count(k, g.mine) > 0).map((k) => (
                      <span key={k} className={`flex items-center gap-1 text-xs font-bold ${COLOR_INFO[k].text}`}>
                        <span aria-hidden="true" className={`size-2 rounded-full ${COLOR_INFO[k].bg}`} />
                        {COLOR_INFO[k].short}
                        {count(k, g.mine)}
                      </span>
                    ))}
                  </span>
                </summary>
                <div className="flex flex-col gap-3 pb-3">
                  {g.items.length === 0 ? (
                    <p className="pl-6 text-[13px] text-sub">
                      {g.mine.length === 0 ? "まだ記録なし" : "この色の記録なし"}
                    </p>
                  ) : (
                    g.items.map((h) => (
                      <HighlightCard key={h.id} h={h} editHref={`/books/${id}/highlights/${h.id}`} />
                    ))
                  )}
                </div>
              </details>
            ))}
        </div>
      </div>

      <Link
        href={`/books/${id}/add`}
        className="fixed right-5 bottom-24 z-10 flex h-13 items-center gap-2 rounded-full bg-ink px-5 font-bold text-white shadow-lg"
      >
        <IconPlus />
        記録する
      </Link>
    </main>
  );
}

function Summary({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs text-sub">{label}</p>
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
