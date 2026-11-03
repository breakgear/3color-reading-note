"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconCamera } from "./icons";

type Job = { key: string; name: string; state: string; tone: "run" | "ok" | "warn" | "err" };

const MAX_EDGE = 1568; // AIが読む画像の最大サイズ（これより大きいと料金だけ増える）

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 大きい写真は縮めてJPEGにする（文字は読める大きさのまま）
async function prepareImage(file: File): Promise<{ blob: Blob; type: string; ext: string }> {
  const okTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("この画像の形式は読めません。スクショ（PNG/JPEG）で送ってください");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && okTypes.includes(file.type) && file.size < 4_000_000) {
    bitmap.close();
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    return { blob: file, type: file.type, ext };
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を変換できませんでした"))), "image/jpeg", 0.9),
  );
  return { blob, type: "image/jpeg", ext: "jpg" };
}

export function InboxUploader({
  userId,
  books,
}: {
  userId: string;
  books: { id: string; title: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [bookId, setBookId] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);

  const update = (key: string, state: string, tone: Job["tone"]) =>
    setJobs((js) => js.map((j) => (j.key === key ? { ...j, state, tone } : j)));

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const supabase = createClient();
    const list = Array.from(files);
    const stamp = Date.now();
    setJobs(list.map((f, i) => ({ key: `${stamp}-${i}`, name: f.name, state: "待機中", tone: "run" })));
    setBusy(true);

    for (const [i, file] of list.entries()) {
      const key = `${stamp}-${i}`;
      try {
        const isPdf = file.type === "application/pdf";
        if (!isPdf && !file.type.startsWith("image/")) throw new Error("画像かPDFを選んでください");
        if (file.size > 20_000_000) throw new Error("20MBより大きいファイルは取り込めません");

        update(key, "準備中…", "run");
        const hash = await sha256(await file.arrayBuffer());
        const { data: dup } = await supabase.from("rn_inbox_items").select("id").eq("file_hash", hash).maybeSingle();
        if (dup) {
          update(key, "取り込み済みのファイルです", "warn");
          continue;
        }

        const prepared = isPdf ? { blob: file, type: "application/pdf", ext: "pdf" } : await prepareImage(file);
        const path = `${userId}/${hash}.${prepared.ext}`;
        update(key, "送信中…", "run");
        const { error: upErr } = await supabase.storage
          .from("rn-inbox")
          .upload(path, prepared.blob, { contentType: prepared.type, upsert: false });
        if (upErr && !/exists|Duplicate/i.test(upErr.message)) throw new Error(`送信できませんでした：${upErr.message}`);

        const { data: item, error: insErr } = await supabase
          .from("rn_inbox_items")
          .insert({
            storage_path: path,
            file_name: file.name.slice(0, 200),
            mime_type: prepared.type,
            file_hash: hash,
            book_id: bookId || null,
            book_confidence: bookId ? "user" : null,
          })
          .select("id")
          .single();
        if (insErr || !item) throw new Error(`登録できませんでした：${insErr?.message}`);

        update(key, "AIが読み取り中…", "run");
        const res = await fetch("/api/inbox/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "読み取りに失敗しました");
        update(key, json.count ? `${json.count}件見つかりました` : "印が見つかりませんでした", json.count ? "ok" : "warn");
      } catch (e) {
        update(key, e instanceof Error ? e.message : "失敗しました", "err");
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  const toneCls: Record<Job["tone"], string> = {
    run: "text-sub",
    ok: "text-pen-green font-bold",
    warn: "text-ink",
    err: "text-pen-red font-bold",
  };

  return (
    <section className="card flex flex-col gap-3 p-4">
      <div>
        <label htmlFor="inbox-book" className="label">どの本？</label>
        <select id="inbox-book" value={bookId} onChange={(e) => setBookId(e.target.value)} className="field">
          <option value="">AIにおまかせ（自動で振り分け）</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={inputRef}
        id="inbox-files"
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="sr-only"
        disabled={busy}
        onChange={(e) => handle(e.target.files)}
      />
      <label
        htmlFor="inbox-files"
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-mute bg-white px-4 text-center ${busy ? "opacity-50" : ""}`}
      >
        <IconCamera />
        <span className="text-[15px] font-bold">スクショ・写真・PDFを選ぶ</span>
        <span className="text-xs leading-relaxed text-sub">
          3色で印を付けた画像を、まとめて選べます
        </span>
      </label>

      {jobs.length > 0 && (
        <ul className="flex flex-col gap-1.5" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.key} className="flex items-center gap-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate text-sub">{j.name}</span>
              <span className={`shrink-0 ${toneCls[j.tone]}`}>{j.state}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
