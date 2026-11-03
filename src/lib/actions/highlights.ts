"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import {
  chapterForPage,
  isPenColor,
  pageFromLocation,
  text,
  type Chapter,
} from "@/lib/domain";

type Supa = Awaited<ReturnType<typeof requireUser>>["supabase"];

// 章の決め方：「自動」ならページから、「章なし」なら空、それ以外は選んだ章
async function resolveChapter(
  supabase: Supa,
  bookId: string,
  choice: FormDataEntryValue | null,
  page: number | null,
): Promise<string | null> {
  if (choice && choice !== "auto" && choice !== "none") return String(choice);
  if (choice === "none") return null;
  const { data } = await supabase.from("chapters").select("*").eq("book_id", bookId);
  return chapterForPage((data ?? []) as Chapter[], page)?.id ?? null;
}

function fields(form: FormData) {
  const color = form.get("color");
  if (!isPenColor(color)) throw new Error("色を選んでください");
  const body = text(form, "text", 5000);
  if (!body) throw new Error("文章を入れてください");
  const location = text(form, "location", 50);
  return {
    color,
    text: body,
    location,
    page: pageFromLocation(location),
    memo: text(form, "memo", 2000),
    action: text(form, "action", 500),
  };
}

export async function createHighlight(bookId: string, form: FormData) {
  const { supabase } = await requireUser();
  const f = fields(form);
  const chapterId = await resolveChapter(supabase, bookId, form.get("chapter_id"), f.page);

  const { error } = await supabase
    .from("highlights")
    .insert({ ...f, book_id: bookId, chapter_id: chapterId, status: "confirmed", source: "manual" });
  if (error) throw new Error(`保存できませんでした：${error.message}`);

  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  if (form.get("next") === "more") {
    redirect(`/books/${bookId}/add?saved=1&color=${f.color}`);
  }
  redirect(`/books/${bookId}`);
}

export async function updateHighlight(id: string, bookId: string, form: FormData) {
  const { supabase } = await requireUser();
  const f = fields(form);
  const chapterId = await resolveChapter(supabase, bookId, form.get("chapter_id"), f.page);

  const { error } = await supabase
    .from("highlights")
    .update({ ...f, chapter_id: chapterId })
    .eq("id", id);
  if (error) throw new Error(`保存できませんでした：${error.message}`);

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/review");
  redirect(`/books/${bookId}`);
}

export async function deleteHighlight(id: string, bookId: string) {
  const { supabase } = await requireUser();
  await supabase.from("highlights").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/review");
  redirect(`/books/${bookId}`);
}

// 振り返り：「やってみること」の完了と結果
export async function saveActionResult(id: string, form: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("highlights")
    .update({
      action_done: form.get("action_done") === "on",
      action_result: text(form, "action_result", 1000),
    })
    .eq("id", id);
  revalidatePath("/review");
}
