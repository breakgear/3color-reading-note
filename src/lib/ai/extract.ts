import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { PenColor } from "@/lib/domain";

// 普段は安いHaikuを使う。Vercelの環境変数 ANTHROPIC_MODEL で変更できる
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

export type CandidateBook = {
  id: string;
  title: string;
  author: string | null;
  chapters: string[];
};

export type Extracted = {
  book_id: string;
  book_confidence: "high" | "low";
  highlights: { color: PenColor; text: string; page: string; chapter_hint: string }[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["book_id", "book_confidence", "highlights"],
  properties: {
    book_id: {
      type: "string",
      description: "候補の本のid。判断できなければ unknown",
    },
    book_confidence: { type: "string", enum: ["high", "low"] },
    highlights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["color", "text", "page", "chapter_hint"],
        properties: {
          color: { type: "string", enum: ["red", "blue", "green"] },
          text: { type: "string" },
          page: { type: "string", description: "ページ番号や位置No.。なければ空文字" },
          chapter_hint: { type: "string", description: "見えている章名。なければ空文字" },
        },
      },
    },
  },
} as const;

const INSTRUCTIONS = `あなたは読書記録アプリの読み取り係です。
渡される画像（またはPDF）は、本のページの写真・電子書籍やマンガのスクリーンショットです。
読者が「赤・青・緑」の3色で、文章に印を付けています（マーカーで塗る、下線を引く、囲む、など）。

やること：
1. 印が付いている文章だけを、印刷されている通りに書き起こす。印のない文章は書かない。
   - 縦書きは上から下・右から左に読む。行の折り返しはつなげる（空白を入れない）。句読点はそのまま。言葉を直したり要約したりしない。
   - マンガは、印の付いた吹き出し・ナレーションの文字を書き起こす。
   - ひとつながりの印は1件にまとめる。離れている印は別々の件にする。
2. 色を決める：赤・ピンク・マゼンタ系＝red、青・水色・紺・紫系＝blue、緑・黄緑系＝green。
   - 黄色・オレンジ・灰色など、ほかの色の印は無視する。
   - 絵やイラストそのものの色（野菜の緑、空の青など）は印ではないので無視する。読者が後から重ねた半透明の塗りや線だけを印とする。
3. page：ページに印刷されたページ番号、またはKindleの「位置No.」（例「No.1520」）が見えれば入れる。なければ空文字。
4. chapter_hint：ページの上や下に章名が印刷されていれば入れる。なければ空文字。
5. book_id：下の「読書中の本」の中から、どの本のページかを選ぶ。ページ上部の書名・章名、内容、文体、マンガかどうかなどで判断する。
   確信があれば book_confidence を high、迷うなら low。どれとも判断できなければ book_id を "unknown" にする。
6. 印が1つもなければ highlights は空の配列にする。`;

function booksText(books: CandidateBook[]) {
  if (!books.length) return "（読書中の本はありません）";
  return books
    .map(
      (b) =>
        `- id: ${b.id}\n  書名: ${b.title}${b.author ? `\n  著者: ${b.author}` : ""}${
          b.chapters.length ? `\n  目次: ${b.chapters.slice(0, 30).join(" / ")}` : ""
        }`,
    )
    .join("\n");
}

function parseJson(raw: string): Extracted {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const obj = JSON.parse(start >= 0 && end > start ? raw.slice(start, end + 1) : raw);
  const highlights = Array.isArray(obj.highlights) ? obj.highlights : [];
  return {
    book_id: typeof obj.book_id === "string" ? obj.book_id : "unknown",
    book_confidence: obj.book_confidence === "high" ? "high" : "low",
    highlights: highlights
      .filter(
        (h: { color?: string; text?: string }) =>
          (h.color === "red" || h.color === "blue" || h.color === "green") &&
          typeof h.text === "string" &&
          h.text.trim(),
      )
      .map((h: { color: PenColor; text: string; page?: string; chapter_hint?: string }) => ({
        color: h.color,
        text: h.text.trim().slice(0, 5000),
        page: typeof h.page === "string" ? h.page.trim().slice(0, 50) : "",
        chapter_hint: typeof h.chapter_hint === "string" ? h.chapter_hint.trim().slice(0, 200) : "",
      })),
  };
}

export async function extractHighlights(input: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";
  books: CandidateBook[];
  fixedBook?: CandidateBook | null;
}): Promise<Extracted> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("AIの設定（ANTHROPIC_API_KEY）がありません");
  }
  const client = new Anthropic();

  const fileBlock =
    input.mediaType === "application/pdf"
      ? ({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: input.base64 },
        } as const)
      : ({
          type: "image",
          source: { type: "base64", media_type: input.mediaType, data: input.base64 },
        } as const);

  const bookNote = input.fixedBook
    ? `この画像は次の本のページです（利用者が指定済み）。book_id は ${input.fixedBook.id}、book_confidence は high にしてください。\n${booksText([input.fixedBook])}`
    : `読書中の本：\n${booksText(input.books)}`;

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    system: INSTRUCTIONS,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: `${bookNote}\n\n印の付いた文章を書き起こしてください。` }],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    throw new Error("AIがこの画像を読み取れませんでした");
  }
  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  try {
    return parseJson(raw);
  } catch {
    throw new Error("AIの返事を読み取れませんでした。もう一度試してください");
  }
}
