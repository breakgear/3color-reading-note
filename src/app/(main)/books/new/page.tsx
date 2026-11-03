import { BookForm } from "@/components/BookForm";
import { PageHeader } from "@/components/PageHeader";
import { createBook } from "@/lib/actions/books";
import { nextVolume, type Book } from "@/lib/domain";
import { requireUser } from "@/lib/supabase/server";

// ?from=本のID で開くと、その本の「次の巻」として書名などを引き継ぐ
export default async function NewBookPage({ searchParams }: PageProps<"/books/new">) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("rn_books").select("id, title, volume, author, format, question, status");
  const existing = (data ?? []) as Pick<Book, "id" | "title" | "volume" | "author" | "format" | "question" | "status">[];
  const from = typeof sp.from === "string" ? existing.find((b) => b.id === sp.from) : undefined;

  return (
    <main>
      <PageHeader title={from ? "次の巻を登録" : "本を登録"} backHref={from ? `/books/${from.id}` : "/"} backLabel={from ? "本へ" : "本棚"} />
      <BookForm
        action={createBook}
        submitLabel="登録して読み始める"
        existing={existing}
        defaults={
          from
            ? {
                title: from.title,
                volume: nextVolume(from.volume),
                author: from.author,
                format: from.format,
                question: from.question,
                chapters: [],
              }
            : undefined
        }
      />
    </main>
  );
}
