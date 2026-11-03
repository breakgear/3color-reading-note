"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { chapterForPage, isPenColor, pageFromLocation, text, type Chapter } from "@/lib/domain";

// 確認画面で「登録する」を押したとき
export async function confirmItem(itemId: string, form: FormData) {
  const { supabase } = await requireUser();
  const bookId = text(form, "book_id", 100);
  if (!bookId) throw new Error("どの本の記録か選んでください");

  const [{ data: pending }, { data: chaptersData }] = await Promise.all([
    supabase.from("highlights").select("id, chapter_id, book_id").eq("inbox_item_id", itemId).eq("status", "pending"),
    supabase.from("chapters").select("*").eq("book_id", bookId),
  ]);
  const chapters = (chaptersData ?? []) as Chapter[];

  for (const h of pending ?? []) {
    if (form.get(`include_${h.id}`) !== "on") {
      await supabase.from("highlights").delete().eq("id", h.id);
      continue;
    }
    const color = form.get(`color_${h.id}`);
    const body = text(form, `text_${h.id}`, 5000);
    if (!body) {
      await supabase.from("highlights").delete().eq("id", h.id);
      continue;
    }
    const location = text(form, `location_${h.id}`, 50);
    const page = pageFromLocation(location);
    // 本が変わっていなければAIの章をそのまま、変わったらページから決め直す
    const chapterId =
      h.book_id === bookId && h.chapter_id ? h.chapter_id : (chapterForPage(chapters, page)?.id ?? null);

    await supabase
      .from("highlights")
      .update({
        book_id: bookId,
        chapter_id: chapterId,
        color: isPenColor(color) ? color : "red",
        text: body,
        location,
        page,
        status: "confirmed",
      })
      .eq("id", h.id);
  }

  await supabase.from("inbox_items").update({ status: "done", book_id: bookId }).eq("id", itemId);
  revalidatePath("/", "layout");
}

// 取り込みをやめる（ファイルも消す）
export async function deleteItem(itemId: string) {
  const { supabase } = await requireUser();
  const { data: item } = await supabase.from("inbox_items").select("storage_path").eq("id", itemId).maybeSingle();
  await supabase.from("highlights").delete().eq("inbox_item_id", itemId).eq("status", "pending");
  if (item?.storage_path) {
    await supabase.storage.from("inbox").remove([item.storage_path]);
  }
  await supabase.from("inbox_items").delete().eq("id", itemId);
  revalidatePath("/", "layout");
}
