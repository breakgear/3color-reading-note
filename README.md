# 3色読書ノート

紙の本もKindleも、3色（赤＝最重要・青＝重要・緑＝面白い）で記録して、考えと行動につなげる読書ノートです。

## できること

- **本棚**：読書中／読了の切り替え。本ごとに「読む前の問い」と色ごとの記録数
- **本を登録**：書名・著者・種類、読む前の問い（型から選べる）、目次（まとめて貼り付けOK）
- **記録**：文章の貼り付け＋3色、ページ／位置No.、章（ページから自動判定）、メモ、やってみること。編集・削除
- **本の記録**：章ごとに表示、色で絞り込み、前回の記録を表示
- **取り込み**：3色で印を付けたスクショ・写真・PDFを送ると、AIが文章と色を読み取り、読書中の本に自動で振り分け → 確認して登録。同じファイルの二重取り込みを防止
- **読み終わり**：問いの答え、今の自分の答え、一言まとめ、何を変えるか、新しい問い。書けないときは自分の赤をヒント表示
- **振り返り**：今日の問いかけ（赤を1日1枚）、やってみることのチェックと結果、読了した本の一覧

## 使っているもの

- Next.js 16（画面）／Vercel（公開）
- Supabase（ログイン・データ・画像の保存）
- Claude API（スクショの読み取り。標準は Claude Haiku 5.5、1枚あたり約0.05円）

## 公開までの手順

### 1. Supabase（既存の Investment Dashboard プロジェクトに同居）

このアプリが作るものは、すべて名前が `rn_`（画像置き場は `rn-inbox`）で始まります。ほかのアプリのテーブルや設定には触れません。

1. Investment Dashboard のプロジェクトを開く
2. **SQL Editor** を開き、`supabase/schema.sql` の中身を全部貼り付けて **Run**
3. **Authentication → URL Configuration**
   - Site URL は**変えない**（Investment Dashboard が使っているため）
   - Redirect URLs に `https://（VercelのURL）/**` を**追加**する
4. **Project Settings → API Keys** で「Project URL」と「Publishable key」を確認

ログインのアカウントは Investment Dashboard と共通です。パスワードがない・忘れた場合は、ログイン画面の「パスワードを忘れた・まだ決めていない」から設定できます。

### 2. Vercel

1. GitHubのこのリポジトリを Import
2. Environment Variables に `.env.example` の項目を入れる
3. Deploy

### 3. ログインと、他人を入れない設定

1. 公開したURLを開き、Investment Dashboard と同じメールアドレスでログインする
2. 環境変数 `ALLOWED_EMAILS` に自分のメールアドレスだけを入れておく（登録とAIの読み取りを本人に限定）
3. 「新規登録を止める」設定（Allow new users to sign up）はプロジェクト全体に効くので、Investment Dashboard に影響がないか確かめてから変える

## 手元で動かす（開発する人向け）

```bash
cp .env.example .env.local   # 中身を自分の値に書き換える
npm install
npm run dev
```
