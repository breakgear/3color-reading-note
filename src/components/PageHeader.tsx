import Link from "next/link";
import { IconBack } from "./icons";

export function PageHeader({
  title,
  backHref,
  backLabel = "戻る",
  right,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-14 items-center gap-2 px-4 pt-3">
      {backHref && (
        <Link
          href={backHref}
          className="-ml-2 flex min-h-11 items-center gap-0.5 pr-2 text-[15px] font-medium"
        >
          <IconBack />
          {backLabel}
        </Link>
      )}
      {title ? (
        <h1 className={`flex-1 font-bold ${backHref ? "text-[17px]" : "text-[28px]"} truncate`}>
          {title}
        </h1>
      ) : (
        <span className="flex-1" />
      )}
      {right}
    </header>
  );
}
