import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type { Book, Chapter, Highlight } from "@/lib/domain";

export async function getBook(bookId: string) {
  const { supabase } = await requireUser();
  const [{ data: book }, { data: chapters }] = await Promise.all([
    supabase.from("books").select("*").eq("id", bookId).maybeSingle(),
    supabase.from("chapters").select("*").eq("book_id", bookId).order("sort_order"),
  ]);
  if (!book) notFound();
  return { supabase, book: book as Book, chapters: (chapters ?? []) as Chapter[] };
}

export async function getConfirmedHighlights(bookId: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("highlights")
    .select("*")
    .eq("book_id", bookId)
    .eq("status", "confirmed")
    .order("page", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as Highlight[];
}
