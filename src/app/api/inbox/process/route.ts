import { NextResponse, type NextRequest } from "next/server";
import { extractHighlights, type CandidateBook } from "@/lib/ai/extract";
import { bookLabel, chapterForPage, pageFromLocation, type Chapter, type InboxItem } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

// AIの読み取りは数十秒かかることがある
export const maxDuration = 60;

function allowed(email: string) {
  const list = (process.env.ALLOWED_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((s) => s.replace(/["'<>]/g, "").trim().toLowerCase())
    .filter(Boolean);
  return list.length === 0 || list.includes(email.trim().toLowerCase());
}

function toBase64(buf: ArrayBuffer) {
  return Buffer.from(buf).toString("base64");
}

// 章名のヒントから章を探す（「第2章」などの一致）
function chapterFromHint(chapters: Chapter[], hint: string): Chapter | null {
  const h = hint.replace(/\s/g, "");
  if (!h) return null;
  return (
    chapters.find((c) => {
      const l = c.label.replace(/\s/g, "");
      return l.includes(h) || h.includes(l);
    }) ?? null
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  const email = (auth?.claims?.email as string | undefined) ?? "";
  if (!userId) return NextResponse.json({ error: "ログインしてください", setup: true }, { status: 401 });
  // 設定の問題は、ファイルごとではなく画面の上にまとめて表示する
  if (!allowed(email)) {
    return NextResponse.json(
      {
        error: `ログイン中のメールアドレス（${email || "不明"}）が、Vercelの ALLOWED_EMAILS に入っていません`,
        setup: true,
      },
      { status: 403 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AIのキー（ANTHROPIC_API_KEY）がVercelに設定されていません", setup: true },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const itemId = typeof body.id === "string" ? body.id : "";
  const { data: itemData } = await supabase.from("rn_inbox_items").select("*").eq("id", itemId).maybeSingle();
  if (!itemData) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  const item = itemData as InboxItem;

  await supabase.from("rn_inbox_items").update({ status: "processing", error: null }).eq("id", item.id);

  try {
    // 前回の読み取り結果（未確認のもの）は消してやり直す
    await supabase.from("rn_highlights").delete().eq("inbox_item_id", item.id).eq("status", "pending");

    const { data: file, error: dlErr } = await supabase.storage.from("rn-inbox").download(item.storage_path);
    if (dlErr || !file) throw new Error("ファイルを読み込めませんでした");

    const [{ data: booksData }, { data: chaptersData }] = await Promise.all([
      supabase.from("rn_books").select("id, title, volume, author").eq("status", "reading"),
      supabase.from("rn_chapters").select("*").order("sort_order"),
    ]);
    const chapters = (chaptersData ?? []) as Chapter[];
    const books: CandidateBook[] = (booksData ?? []).map((b) => ({
      id: b.id,
      title: bookLabel(b),
      author: b.author,
      chapters: chapters.filter((c) => c.book_id === b.id).map((c) => c.label),
    }));

    // 利用者が本を指定していれば、その本に固定する（読了した本でもよい）
    let fixedBook: CandidateBook | null = null;
    if (item.book_id && item.book_confidence === "user") {
      const known = books.find((b) => b.id === item.book_id);
      if (known) fixedBook = known;
      else {
        const { data: b } = await supabase.from("rn_books").select("id, title, volume, author").eq("id", item.book_id).maybeSingle();
        if (b) fixedBook = { id: b.id, title: bookLabel(b), author: b.author, chapters: chapters.filter((c) => c.book_id === b.id).map((c) => c.label) };
      }
    }

    const mediaType = (
      ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(item.mime_type)
        ? item.mime_type
        : "image/jpeg"
    ) as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";

    const result = await extractHighlights({
      base64: toBase64(await file.arrayBuffer()),
      mediaType,
      books,
      fixedBook,
    });

    const bookId = fixedBook
      ? fixedBook.id
      : books.some((b) => b.id === result.book_id)
        ? result.book_id
        : null;
    const bookChapters = chapters.filter((c) => c.book_id === bookId);

    if (result.highlights.length > 0) {
      const rows = result.highlights.map((h) => {
        const page = pageFromLocation(h.page);
        const chapter = bookId
          ? (chapterForPage(bookChapters, page) ?? chapterFromHint(bookChapters, h.chapter_hint))
          : null;
        return {
          book_id: bookId,
          chapter_id: chapter?.id ?? null,
          inbox_item_id: item.id,
          color: h.color,
          text: h.text,
          location: h.page || null,
          page,
          status: "pending" as const,
          source: "screenshot" as const,
        };
      });
      const { error: insErr } = await supabase.from("rn_highlights").insert(rows);
      if (insErr) throw new Error(`保存できませんでした：${insErr.message}`);
    }

    await supabase
      .from("rn_inbox_items")
      .update({
        status: result.highlights.length ? "review" : "error",
        book_id: bookId,
        book_confidence: fixedBook ? "user" : bookId ? result.book_confidence : null,
        error: result.highlights.length ? null : "3色の印が見つかりませんでした",
      })
      .eq("id", item.id);

    return NextResponse.json({ ok: true, count: result.highlights.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "読み取りに失敗しました";
    await supabase.from("rn_inbox_items").update({ status: "error", error: message.slice(0, 500) }).eq("id", item.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
