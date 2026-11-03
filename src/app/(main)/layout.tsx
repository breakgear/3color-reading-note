import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/lib/supabase/server";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("rn_inbox_items")
    .select("id", { count: "exact", head: true })
    .in("status", ["review", "error"]);

  return (
    <>
      <div className="pb-28">{children}</div>
      <BottomNav inboxCount={count ?? 0} />
    </>
  );
}
