import { FinishForm } from "@/components/FinishForm";
import { PageHeader } from "@/components/PageHeader";
import { finishBook } from "@/lib/actions/books";
import { getBook, getConfirmedHighlights } from "@/lib/queries";

export default async function FinishPage({ params }: PageProps<"/books/[id]/finish">) {
  const { id } = await params;
  const { book } = await getBook(id);
  const highlights = await getConfirmedHighlights(id);
  const reds = highlights.filter((h) => h.color === "red").map((h) => ({ id: h.id, text: h.text }));

  return (
    <main>
      <PageHeader title="読み終わり" backHref={`/books/${id}`} backLabel="本へ" />
      <p className="truncate px-4 text-xs text-sub">『{book.title}』</p>
      <FinishForm action={finishBook.bind(null, id)} book={book} reds={reds} />
    </main>
  );
}
