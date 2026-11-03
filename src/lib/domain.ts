// アプリ全体で使う「データの形」と小さな便利関数

export type PenColor = "red" | "blue" | "green";
export const PEN_COLORS: PenColor[] = ["red", "blue", "green"];

export const COLOR_INFO: Record<
  PenColor,
  { short: string; label: string; desc: string; text: string; bg: string; tint: string; line: string }
> = {
  red: {
    short: "赤",
    label: "赤・最重要",
    desc: "著者が一番言いたいこと",
    text: "text-pen-red",
    bg: "bg-pen-red",
    tint: "bg-pen-red-tint",
    line: "pen-red",
  },
  blue: {
    short: "青",
    label: "青・重要",
    desc: "客観的に大事なこと",
    text: "text-pen-blue",
    bg: "bg-pen-blue",
    tint: "bg-pen-blue-tint",
    line: "pen-blue",
  },
  green: {
    short: "緑",
    label: "緑・面白い",
    desc: "自分が反応したところ",
    text: "text-pen-green",
    bg: "bg-pen-green",
    tint: "bg-pen-green-tint",
    line: "pen-green",
  },
};

export function isPenColor(v: unknown): v is PenColor {
  return v === "red" || v === "blue" || v === "green";
}

export type BookFormat = "paper" | "kindle" | "other";
export const FORMAT_LABEL: Record<BookFormat, string> = {
  paper: "紙",
  kindle: "Kindle",
  other: "その他",
};

export type AnswerStatus = "found" | "partial" | "not_yet";
export const ANSWER_LABEL: Record<AnswerStatus, string> = {
  found: "見つかった",
  partial: "少し",
  not_yet: "まだ",
};

export type Book = {
  id: string;
  title: string;
  author: string | null;
  format: BookFormat;
  question: string | null;
  status: "reading" | "finished";
  answer_status: AnswerStatus | null;
  answer: string | null;
  one_line: string | null;
  change_plan: string | null;
  new_question: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  book_id: string;
  label: string;
  start_page: number | null;
  sort_order: number;
};

export type Highlight = {
  id: string;
  book_id: string | null;
  chapter_id: string | null;
  inbox_item_id: string | null;
  color: PenColor;
  text: string;
  location: string | null;
  page: number | null;
  memo: string | null;
  action: string | null;
  action_done: boolean;
  action_result: string | null;
  status: "confirmed" | "pending";
  source: "manual" | "screenshot";
  created_at: string;
  updated_at: string;
};

export type InboxItem = {
  id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string;
  file_hash: string;
  status: "uploaded" | "processing" | "review" | "done" | "error";
  book_id: string | null;
  book_confidence: string | null;
  error: string | null;
  created_at: string;
};

// 「12」「p.12」「P12」「12ページ」→ 12。「No.1520」など数字のページでなければ null
export function pageFromLocation(location: string | null | undefined): number | null {
  if (!location) return null;
  const m = location.trim().match(/^(?:p\.?\s*|P\.?\s*)?(\d{1,5})\s*(?:ページ|頁)?$/);
  return m ? Number(m[1]) : null;
}

// ページ番号から章を決める（開始ページが入っている章だけで判定）
export function chapterForPage(chapters: Chapter[], page: number | null): Chapter | null {
  if (page == null) return null;
  const withPage = chapters
    .filter((c) => c.start_page != null)
    .sort((a, b) => (a.start_page ?? 0) - (b.start_page ?? 0));
  let hit: Chapter | null = null;
  for (const c of withPage) {
    if ((c.start_page ?? 0) <= page) hit = c;
  }
  return hit;
}

export function formatLocation(h: Pick<Highlight, "location" | "page">): string | null {
  if (h.page != null) return `p.${h.page}`;
  return h.location || null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// フォームの値を「空なら null」のテキストに
export function text(form: FormData, key: string, max = 2000): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export const QUESTION_TEMPLATES = [
  "〇〇のやり方を知りたい",
  "なぜ〇〇なのか知りたい",
  "自分の〇〇に活かせるか知りたい",
];
