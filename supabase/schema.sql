-- =========================================================
-- 3色読書ノート：データベースの設計
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」を押す
-- （何度実行しても壊れないように書いてあります）
-- =========================================================

-- ---------- 本 ----------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  author text,
  format text not null default 'paper' check (format in ('paper', 'kindle', 'other')),
  question text,                 -- 読む前の問い（この本で知りたいこと）
  status text not null default 'reading' check (status in ('reading', 'finished')),
  answer_status text check (answer_status in ('found', 'partial', 'not_yet')),
  answer text,                   -- 問いへの今の自分の答え
  one_line text,                 -- この本を一言でいうと
  change_plan text,              -- 自分は何を変えるか
  new_question text,             -- 新しく生まれた問い
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 章（目次） ----------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 200),
  start_page int,                -- 章が始まるページ（わかれば。ページから章を自動判定する）
  sort_order int not null default 0
);

-- ---------- 受け取り箱（スクショ・写真・PDF） ----------
create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text not null,
  file_hash text not null,       -- 同じファイルを2回取り込まないための印
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'review', 'done', 'error')),
  book_id uuid references public.books (id) on delete set null,  -- AIが推測した本
  book_confidence text,
  error text,
  created_at timestamptz not null default now(),
  unique (user_id, file_hash)
);

-- ---------- 記録（3色の線を引いた文章） ----------
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid references public.books (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  inbox_item_id uuid references public.inbox_items (id) on delete set null,
  color text not null check (color in ('red', 'blue', 'green')),
  text text not null check (char_length(text) between 1 and 5000),
  location text,                 -- 「12」や「No.1520」など
  page int,                      -- 数字のページ（章の自動判定に使う）
  memo text,
  action text,                   -- やってみること
  action_done boolean not null default false,
  action_result text,            -- やってみた結果
  status text not null default 'confirmed' check (status in ('confirmed', 'pending')),
  source text not null default 'manual' check (source in ('manual', 'screenshot')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 確認済みの記録は必ずどれかの本に入っている
  constraint confirmed_needs_book check (status = 'pending' or book_id is not null)
);

create index if not exists books_user_status_idx on public.books (user_id, status);
create index if not exists chapters_book_idx on public.chapters (book_id, sort_order);
create index if not exists highlights_book_idx on public.highlights (book_id, status);
create index if not exists highlights_user_status_idx on public.highlights (user_id, status);
create index if not exists highlights_inbox_idx on public.highlights (inbox_item_id);
create index if not exists inbox_user_status_idx on public.inbox_items (user_id, status);

-- ---------- 更新日時を自動で入れる ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists highlights_updated_at on public.highlights;
create trigger highlights_updated_at before update on public.highlights
  for each row execute function public.set_updated_at();

-- ---------- 本人のデータだけ読み書きできる設定（RLS） ----------
alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.inbox_items enable row level security;
alter table public.highlights enable row level security;

grant select, insert, update, delete on public.books, public.chapters,
  public.inbox_items, public.highlights to authenticated;

drop policy if exists "own books" on public.books;
create policy "own books" on public.books
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own chapters" on public.chapters;
create policy "own chapters" on public.chapters
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.books b where b.id = book_id and b.user_id = (select auth.uid()))
  );

drop policy if exists "own inbox" on public.inbox_items;
create policy "own inbox" on public.inbox_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (book_id is null or exists (
      select 1 from public.books b where b.id = book_id and b.user_id = (select auth.uid())))
  );

drop policy if exists "own highlights" on public.highlights;
create policy "own highlights" on public.highlights
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (book_id is null or exists (
      select 1 from public.books b where b.id = book_id and b.user_id = (select auth.uid())))
    and (chapter_id is null or exists (
      select 1 from public.chapters c where c.id = chapter_id and c.user_id = (select auth.uid())))
    and (inbox_item_id is null or exists (
      select 1 from public.inbox_items i where i.id = inbox_item_id and i.user_id = (select auth.uid())))
  );

-- ---------- 画像の置き場（Storage） ----------
-- 非公開。1ファイル20MBまで。画像とPDFだけ
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inbox', 'inbox', false, 20971520,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 自分のフォルダ（ユーザーIDの名前のフォルダ）だけ読み書きできる
drop policy if exists "inbox read own" on storage.objects;
create policy "inbox read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'inbox' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "inbox upload own" on storage.objects;
create policy "inbox upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'inbox' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "inbox delete own" on storage.objects;
create policy "inbox delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'inbox' and (storage.foldername(name))[1] = (select auth.uid())::text);
