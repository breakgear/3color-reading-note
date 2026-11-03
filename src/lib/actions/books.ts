"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { text, type AnswerStatus, type BookFormat } from "@/lib/domain";

type ChapterInput = { id?: string; label: string; start_page: number | null };

function parseChapters(form: FormData): ChapterInput[] {
  try {
    const raw = JSON.parse(String(form.get("chapters") ?? "[]"));
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c) => ({
        id: typeof c.id === "string" && c.id ? c.id : undefined,
        label: String(c.label ?? "").trim().slice(0, 200),
        start_page:
          c.start_page === "" || c.start_page == null || Number.isNaN(Number(c.start_page))
            ? null
            : Math.max(0, Math.floor(Number(c.start_page))),
      }))
      .filter((c) => c.label);
  } catch {
    return [];
  }
}

function parseFormat(v: FormDataEntryValue | null): BookFormat {
  return v === "kindle" || v === "other" ? v : "paper";
}

export async function createBook(form: FormData) {
  const { supabase } = await requireUser();
  const title = text(form, "title", 200);
  if (!title) throw new Error("書名を入れてください");

  const { data: book, error } = await supabase
    .from("rn_books")
    .insert({
      title,
      author: text(form, "author", 200),
      format: parseFormat(form.get("format")),
      question: text(form, "question", 500),
    })
    .select("id")
    .single();
  if (error || !book) throw new Error(`本を登録できませんでした：${error?.message}`);

  const chapters = parseChapters(form);
  if (chapters.length) {
    const { error: chErr } = await supabase.from("rn_chapters").insert(
      chapters.map((c, i) => ({
        book_id: book.id,
        label: c.label,
        start_page: c.start_page,
        sort_order: i,
      })),
    );
    if (chErr) throw new Error(`目次を保存できませんでした：${chErr.message}`);
  }

  revalidatePath("/");
  redirect(`/books/${book.id}`);
}

export async function updateBook(bookId: string, form: FormData) {
  const { supabase } = await requireUser();
  const title = text(form, "title", 200);
  if (!title) throw new Error("書名を入れてください");

  const { error } = await supabase
    .from("rn_books")
    .update({
      title,
      author: text(form, "author", 200),
      format: parseFormat(form.get("format")),
      question: text(form, "question", 500),
    })
    .eq("id", bookId);
  if (error) throw new Error(`保存できませんでした：${error.message}`);

  // 目次：残った章は更新、新しい章は追加、消した章は削除（記録は「章なし」に戻る）
  const chapters = parseChapters(form);
  const { data: existing } = await supabase.from("rn_chapters").select("id").eq("book_id", bookId);
  const keepIds = new Set(chapters.map((c) => c.id).filter(Boolean) as string[]);
  const removeIds = (existing ?? []).map((c) => c.id).filter((id) => !keepIds.has(id));
  if (removeIds.length) {
    await supabase.from("rn_chapters").delete().in("id", removeIds);
  }
  for (const [i, c] of chapters.entries()) {
    if (c.id) {
      await supabase
        .from("rn_chapters")
        .update({ label: c.label, start_page: c.start_page, sort_order: i })
        .eq("id", c.id)
        .eq("book_id", bookId);
    } else {
      await supabase
        .from("rn_chapters")
        .insert({ book_id: bookId, label: c.label, start_page: c.start_page, sort_order: i });
    }
  }

  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function deleteBook(bookId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("rn_books").delete().eq("id", bookId);
  if (error) throw new Error(`削除できませんでした：${error.message}`);
  revalidatePath("/");
  redirect("/");
}

export async function finishBook(bookId: string, form: FormData) {
  const { supabase } = await requireUser();
  const a = form.get("answer_status");
  const answerStatus: AnswerStatus | null =
    a === "found" || a === "partial" || a === "not_yet" ? a : null;

  const { data: current } = await supabase
    .from("rn_books")
    .select("finished_at")
    .eq("id", bookId)
    .single();

  const { error } = await supabase
    .from("rn_books")
    .update({
      status: "finished",
      finished_at: current?.finished_at ?? new Date().toISOString(),
      answer_status: answerStatus,
      answer: text(form, "answer", 2000),
      one_line: text(form, "one_line", 500),
      change_plan: text(form, "change_plan", 500),
      new_question: text(form, "new_question", 500),
    })
    .eq("id", bookId);
  if (error) throw new Error(`保存できませんでした：${error.message}`);

  revalidatePath("/");
  revalidatePath("/review");
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function reopenBook(bookId: string) {
  const { supabase } = await requireUser();
  await supabase.from("rn_books").update({ status: "reading" }).eq("id", bookId);
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}
