import { setNewPassword } from "@/app/login/actions";
import { requireUser } from "@/lib/supabase/server";

export default async function NewPasswordPage({ searchParams }: PageProps<"/auth/new-password">) {
  const { email } = await requireUser();
  const sp = await searchParams;

  return (
    <main className="flex min-h-screen flex-col justify-center px-5 py-10">
      <h1 className="mb-2 text-2xl font-bold">新しいパスワード</h1>
      <p className="mb-6 text-sm text-sub">{email}</p>
      {sp.error && (
        <p role="alert" className="mb-4 rounded-xl bg-pen-red-tint px-4 py-3 text-sm font-semibold text-pen-red">
          パスワードは8文字以上にしてください
        </p>
      )}
      <form action={setNewPassword} className="card flex flex-col gap-4 p-5">
        <div>
          <label htmlFor="password" className="label">パスワード（8文字以上）</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="field"
          />
        </div>
        <button type="submit" className="btn btn-primary">決定して始める</button>
      </form>
    </main>
  );
}
