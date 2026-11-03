import { HighlightForm } from "@/components/HighlightForm";
import { PageHeader } from "@/components/PageHeader";
import { createHighlight } from "@/lib/actions/highlights";
import { isPenColor } from "@/lib/domain";
import { getBook } from "@/lib/queries";

export default async function AddHighlightPage({ params, searchParams }: PageProps<"/books/[id]/add">) {
  const { id } = await params;
  const sp = await searchParams;
  const { book, chapters } = await getBook(id);

  return (
    <main>
      <PageHeader title="記録を追加" backHref={`/books/${id}`} backLabel="本へ" />
      <p className="truncate px-4 text-xs text-sub">『{book.title}』</p>
      {sp.saved && (
        <p role="status" className="mx-4 mt-3 rounded-xl bg-pen-green-tint px-4 py-2 text-sm font-semibold text-pen-green">
          保存しました。続けてどうぞ
        </p>
      )}
      <HighlightForm
        key={String(sp.saved ?? "")}
        action={createHighlight.bind(null, id)}
        chapters={chapters}
        defaultColor={isPenColor(sp.color) ? sp.color : "red"}
        format={book.format}
      />
    </main>
  );
}
