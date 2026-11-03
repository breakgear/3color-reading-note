import { BookForm } from "@/components/BookForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { PageHeader } from "@/components/PageHeader";
import { deleteBook, reopenBook, updateBook } from "@/lib/actions/books";
import { getBook } from "@/lib/queries";

export default async function EditBookPage({ params }: PageProps<"/books/[id]/edit">) {
  const { id } = await params;
  const { book, chapters } = await getBook(id);

  return (
    <main>
      <PageHeader title="本の情報を編集" backHref={`/books/${id}`} backLabel="本へ" />
      <BookForm
        action={updateBook.bind(null, id)}
        submitLabel="保存"
        defaults={{
          title: book.title,
          volume: book.volume,
          author: book.author,
          format: book.format,
          question: book.question,
          chapters,
        }}
      />

      <div className="mt-10 flex flex-col gap-3 px-4">
        {book.status === "finished" && (
          <form action={reopenBook.bind(null, id)}>
            <button type="submit" className="btn btn-ghost w-full">
              「読書中」に戻す
            </button>
          </form>
        )}
        <form action={deleteBook.bind(null, id)}>
          <ConfirmSubmit label="この本を削除" confirmLabel="記録ごと削除する" />
        </form>
        <p className="text-xs text-sub">本を削除すると、この本の記録もすべて消えます。</p>
      </div>
    </main>
  );
}
