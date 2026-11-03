import { BookForm } from "@/components/BookForm";
import { PageHeader } from "@/components/PageHeader";
import { createBook } from "@/lib/actions/books";

export default function NewBookPage() {
  return (
    <main>
      <PageHeader title="本を登録" backHref="/" backLabel="本棚" />
      <BookForm action={createBook} submitLabel="登録して読み始める" />
    </main>
  );
}
