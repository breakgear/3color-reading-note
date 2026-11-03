-- 2026-11-03 追加：本に「巻」（上・下・12 など）を入れられるようにする
-- schema.sql を最初に実行したあとで、この1文だけを SQL Editor で実行する
alter table public.rn_books add column if not exists volume text
  check (volume is null or char_length(volume) <= 20);
