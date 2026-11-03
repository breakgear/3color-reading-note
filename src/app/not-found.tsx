import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-16 text-center">
      <h1 className="text-xl font-bold">ページが見つかりません</h1>
      <Link href="/" className="btn btn-primary mx-auto">
        本棚へ戻る
      </Link>
    </main>
  );
}
