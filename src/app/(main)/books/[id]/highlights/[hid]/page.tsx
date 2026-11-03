import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { HighlightForm } from "@/components/HighlightForm";
import { PageHeader } from "@/components/PageHeader";
import { deleteHighlight, updateHighlight } from "@/lib/actions/highlights";
import type { Highlight } from "@/lib/domain";
import { getBook } from "@/lib/queries";

export default async function EditHighlightPage({ params }: PageProps<"/books/[id]/highlights/[hid]">) {
  const { id, hid } = await params;
  const { supabase, book, chapters } = await getBook(id);
  const { data } = await supabase.from("rn_highlights").select("*").eq("id", hid).eq("book_id", id).maybeSingle();
  if (!data) notFound();
  const h = data as Highlight;

  return (
    <main>
      <PageHeader title="記録を編集" backHref={`/books/${id}`} backLabel="本へ" />
      <p className="truncate px-4 text-xs text-sub">『{book.title}』</p>
      <HighlightForm
        action={updateHighlight.bind(null, hid, id)}
        chapters={chapters}
        defaults={h}
        format={book.format}
      />
      <form action={deleteHighlight.bind(null, hid, id)} className="mt-8 px-4">
        <ConfirmSubmit label="この記録を削除" confirmLabel="本当に削除する" />
      </form>
    </main>
  );
}
