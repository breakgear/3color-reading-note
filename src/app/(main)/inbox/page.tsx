import { InboxUploader } from "@/components/InboxUploader";
import { PageHeader } from "@/components/PageHeader";
import { RetryButton } from "@/components/RetryButton";
import { confirmItem, deleteItem } from "@/lib/actions/inbox";
import { COLOR_INFO, PEN_COLORS, type Highlight, type InboxItem } from "@/lib/domain";
import { requireUser } from "@/lib/supabase/server";

export default async function InboxPage() {
  const { supabase, userId } = await requireUser();

  const [{ data: itemsData }, { data: booksData }] = await Promise.all([
    supabase
      .from("inbox_items")
      .select("*")
      .in("status", ["uploaded", "processing", "review", "error"])
      .order("created_at", { ascending: true }),
    supabase.from("books").select("id, title, status").order("updated_at", { ascending: false }),
  ]);
  const items = (itemsData ?? []) as InboxItem[];
  const books = (booksData ?? []) as { id: string; title: string; status: string }[];
  const reading = books.filter((b) => b.status === "reading");

  const ids = items.map((i) => i.id);
  const { data: hData } = ids.length
    ? await supabase
        .from("highlights")
        .select("*")
        .in("inbox_item_id", ids)
        .eq("status", "pending")
        .order("created_at")
    : { data: [] };
  const pending = (hData ?? []) as Highlight[];

  const imagePaths = items.filter((i) => i.mime_type.startsWith("image/")).map((i) => i.storage_path);
  const { data: signed } = imagePaths.length
    ? await supabase.storage.from("inbox").createSignedUrls(imagePaths, 60 * 60)
    : { data: [] };
  const urlOf = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <main>
      <PageHeader title="取り込み" />
      <div className="flex flex-col gap-5 px-4 pt-2">
        <p className="text-sm leading-relaxed text-sub">
          3色で印を付けたスクショ・写真・PDFを送ると、AIが文章と色を読み取ります。確認してから登録されます。
        </p>

        <InboxUploader userId={userId} books={reading.map(({ id, title }) => ({ id, title }))} />

        {items.length > 0 && (
          <h2 className="text-base font-bold">確認待ち（{items.length}件）</h2>
        )}

        {items.map((item) => {
          const hs = pending.filter((h) => h.inbox_item_id === item.id);
          const img = urlOf.get(item.storage_path);
          const lowConfidence = item.book_confidence === "low" || (!item.book_id && item.status === "review");
          return (
            <article key={item.id} className="card flex flex-col gap-4 p-4">
              <div className="flex gap-3">
                {img ? (
                  <a href={img} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="取り込んだ画像" className="h-24 w-16 rounded-lg border border-line object-cover" />
                  </a>
                ) : (
                  <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-xs font-bold text-sub">
                    PDF
                  </div>
                )}
                <div className="min-w-0 flex-1 text-[13px]">
                  <p className="truncate text-sub">{item.file_name}</p>
                  {item.status === "processing" || item.status === "uploaded" ? (
                    <p className="mt-1 font-bold">読み取り中です…（終わらないときは「読み直す」）</p>
                  ) : item.status === "error" ? (
                    <p className="mt-1 font-bold text-pen-red">{item.error ?? "読み取りに失敗しました"}</p>
                  ) : (
                    <p className="mt-1 font-bold">{hs.length}件見つかりました</p>
                  )}
                </div>
              </div>

              {item.status === "review" && hs.length > 0 && (
                <form action={confirmItem.bind(null, item.id)} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor={`book-${item.id}`} className="label">どの本の記録？</label>
                    <select
                      id={`book-${item.id}`}
                      name="book_id"
                      required
                      defaultValue={item.book_id ?? ""}
                      className={`field ${lowConfidence ? "!border-pen-red" : ""}`}
                    >
                      <option value="" disabled>
                        本を選んでください
                      </option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                          {b.status === "finished" ? "（読了）" : ""}
                        </option>
                      ))}
                    </select>
                    {lowConfidence && (
                      <p className="mt-1 text-xs font-semibold text-pen-red">
                        {item.book_id ? "AIの自信が低めです。本が合っているか確認してください" : "AIが本を判断できませんでした。選んでください"}
                      </p>
                    )}
                  </div>

                  <ul className="flex flex-col gap-3">
                    {hs.map((h, i) => (
                      <li key={h.id} className="flex flex-col gap-2 rounded-xl border border-line p-3">
                        <div className="flex items-center gap-2">
                          <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
                            <input type="checkbox" name={`include_${h.id}`} defaultChecked className="size-5 accent-ink" />
                            登録する
                          </label>
                          <span className="flex-1" />
                          <fieldset className="flex gap-1">
                            <legend className="sr-only">{i + 1}件目の色</legend>
                            {PEN_COLORS.map((k) => (
                              <label key={k} className="relative">
                                <input
                                  type="radio"
                                  name={`color_${h.id}`}
                                  value={k}
                                  defaultChecked={h.color === k}
                                  className="peer sr-only"
                                />
                                <span
                                  className={`flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 border-transparent text-sm font-bold ${COLOR_INFO[k].tint} ${COLOR_INFO[k].text} peer-checked:border-current peer-focus-visible:outline-2`}
                                >
                                  {COLOR_INFO[k].short}
                                </span>
                              </label>
                            ))}
                          </fieldset>
                        </div>
                        <label className="sr-only" htmlFor={`text-${h.id}`}>{i + 1}件目の文章</label>
                        <textarea
                          id={`text-${h.id}`}
                          name={`text_${h.id}`}
                          defaultValue={h.text}
                          rows={3}
                          maxLength={5000}
                          className="field resize-y text-[15px]"
                        />
                        <div className="flex items-center gap-2">
                          <label htmlFor={`loc-${h.id}`} className="text-xs text-sub">ページ／位置</label>
                          <input
                            id={`loc-${h.id}`}
                            name={`location_${h.id}`}
                            defaultValue={h.location ?? ""}
                            maxLength={50}
                            className="field !min-h-10 !w-28 !py-1.5 text-sm"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button type="submit" className="btn btn-primary w-full">
                    チェックした記録を登録する
                  </button>
                </form>
              )}

              <div className="grid grid-cols-2 gap-2">
                <RetryButton itemId={item.id} />
                <form action={deleteItem.bind(null, item.id)}>
                  <button type="submit" className="btn btn-ghost w-full text-pen-red">
                    取り込みをやめる
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
