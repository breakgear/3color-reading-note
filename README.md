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

### 1. Supabase

1. 新しいプロジェクトを作る（Region は Singapore がおすすめ）
2. **SQL Editor** を開き、`supabase/schema.sql` の中身を全部貼り付けて **Run**
3. **Authentication → URL Configuration**
   - Site URL：VercelのURL（例 `https://3color-reading-note.vercel.app`）
   - Redirect URLs：`https://3color-reading-note.vercel.app/**` を追加
4. **Project Settings → API Keys** で「Project URL」と「Publishable key」を確認

### 2. Vercel

1. GitHubのこのリポジトリを Import
2. Environment Variables に `.env.example` の項目を入れる
3. Deploy

### 3. 最初の登録と、他人を入れない設定

1. 公開したURLを開き「はじめての登録」で自分のアカウントを作る（確認メールのリンクを押す）
2. Supabase の **Authentication → Sign In / Providers** で **Allow new users to sign up** をオフにする

## 手元で動かす（開発する人向け）

```bash
cp .env.example .env.local   # 中身を自分の値に書き換える
npm install
npm run dev
```
