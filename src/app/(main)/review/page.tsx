import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { IconChevron } from "@/components/icons";
import { saveActionResult } from "@/lib/actions/highlights";
import { ANSWER_LABEL, COLOR_INFO, formatDate, formatLocation, type Book, type Highlight } from "@/lib/domain";
import { requireUser } from "@/lib/supabase/server";

type H = Highlight & { books: { id: string; title: string } | null };

// 1日1枚、日付で選ぶ（同じ日は同じカード。日本・シンガポール時間で日付が変わる）
function pickToday<T>(list: T[]): T | null {
  if (!list.length) return null;
  const day = Math.floor((Date.now() + 8 * 3_600_000) / 86_400_000);
  return list[day % list.length];
}

export default async function ReviewPage() {
  const { supabase } = await requireUser();

  const [{ data: actionsData }, { data: redsData }, { data: finishedData }] = await Promise.all([
    supabase
      .from("highlights")
      .select("*, books(id, title)")
      .eq("status", "confirmed")
      .not("action", "is", null)
      .order("action_done", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("highlights")
      .select("*, books(id, title)")
      .eq("status", "confirmed")
      .eq("color", "red")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("books")
      .select("*")
      .eq("status", "finished")
      .order("finished_at", { ascending: false })
      .limit(30),
  ]);

  const actions = (actionsData ?? []) as H[];
  const open = actions.filter((a) => !a.action_done);
  const done = actions.filter((a) => a.action_done);
  const reds = (redsData ?? []) as H[];
  const card = pickToday(reds);
  const finished = (finishedData ?? []) as Book[];

  return (
    <main>
      <PageHeader title="振り返り" />
      <div className="flex flex-col gap-5 px-4 pt-2">
        <section aria-labelledby="today" className="card flex flex-col gap-3 p-4">
          <h2 id="today" className="text-[15px] font-bold">今日の問いかけ</h2>
          {card ? (
            <>
              <p className="text-sm font-bold">これについて、今どう考える？</p>
              <p className={`pen-line ${COLOR_INFO.red.line} text-[15px] leading-[1.9]`}>{card.text}</p>
              <p className="text-xs text-sub">
                {card.books?.title && `『${card.books.title}』`} {formatLocation(card) ?? ""}
              </p>
              {card.memo && (
                <p className="rounded-xl bg-paper px-3 py-2 text-[13px]">
                  <span className="mr-2 font-bold">前のメモ</span>
                  {card.memo}
                </p>
              )}
              {card.books && (
                <Link href={`/books/${card.books.id}/highlights/${card.id}`} className="btn btn-ghost">
                  今の考えをメモに書く
                </Link>
              )}
            </>
          ) : (
            <p className="text-sm text-sub">赤の記録がたまると、ここに1日1枚出てきます。</p>
          )}
        </section>

        <section aria-labelledby="actions" className="card flex flex-col p-4">
          <h2 id="actions" className="mb-1 text-[15px] font-bold">
            やってみること <span className="text-sm font-medium text-sub">残り{open.length}件</span>
          </h2>
          {open.length === 0 && (
            <p className="py-2 text-sm text-sub">記録に「やってみること」を書くと、ここに並びます。</p>
          )}
          {open.map((a) => (
            <ActionItem key={a.id} a={a} />
          ))}
          {done.length > 0 && (
            <details className="mt-2 border-t border-line pt-2">
              <summary className="min-h-11 cursor-pointer content-center text-sm text-sub">
                やったこと（{done.length}件）
              </summary>
              {done.map((a) => (
                <ActionItem key={a.id} a={a} />
              ))}
            </details>
          )}
        </section>

        <section aria-labelledby="finished" className="flex flex-col gap-3">
          <h2 id="finished" className="text-[15px] font-bold">読み終わった本</h2>
          {finished.length === 0 && (
            <p className="card p-4 text-sm text-sub">読み終わった本はまだありません。</p>
          )}
          {finished.map((b) => (
            <Link key={b.id} href={`/books/${b.id}`} className="card flex flex-col gap-1.5 p-4">
              <span className="flex items-center gap-2">
                <span className="flex-1 font-bold">{b.title}</span>
                <IconChevron className="size-4 text-mute" />
              </span>
              <span className="text-xs text-sub">
                {formatDate(b.finished_at)} 読了
                {b.answer_status && `・問いの答え：${ANSWER_LABEL[b.answer_status]}`}
              </span>
              {b.one_line && <span className="text-sm leading-relaxed">「{b.one_line}」</span>}
              {b.change_plan && <span className="text-[13px] text-sub">変えること：{b.change_plan}</span>}
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function ActionItem({ a }: { a: H }) {
  return (
    <form action={saveActionResult.bind(null, a.id)} className="flex flex-col gap-2 border-t border-line py-3 first-of-type:border-t-0">
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          name="action_done"
          defaultChecked={a.action_done}
          className="mt-1 size-5 shrink-0 accent-ink"
        />
        <span className="flex flex-col">
          <span className={`text-[15px] font-medium ${a.action_done ? "text-sub line-through" : ""}`}>{a.action}</span>
          <span className="text-xs text-sub">{a.books?.title && `『${a.books.title}』`}から</span>
        </span>
      </label>
      <div className="flex gap-2 pl-8">
        <input
          name="action_result"
          aria-label={`「${a.action}」をやってみた結果`}
          defaultValue={a.action_result ?? ""}
          placeholder="やってみた結果を一言"
          maxLength={1000}
          className="field flex-1 !min-h-10 !py-1.5 text-sm"
        />
        <button type="submit" className="btn btn-ghost !min-h-10 !px-3 text-sm">保存</button>
      </div>
    </form>
  );
}
