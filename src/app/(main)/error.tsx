"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-col gap-4 px-4 pt-10">
      <h1 className="text-xl font-bold">うまくいきませんでした</h1>
      <p className="card p-4 text-sm leading-relaxed text-pen-red">{error.message || "エラーが起きました"}</p>
      <button type="button" onClick={reset} className="btn btn-primary">
        もう一度試す
      </button>
    </main>
  );
}
