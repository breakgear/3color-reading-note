"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconInbox, IconReview, IconShelf } from "./icons";

const ITEMS = [
  { href: "/", label: "本棚", Icon: IconShelf, match: (p: string) => p === "/" || p.startsWith("/books") },
  { href: "/inbox", label: "取り込み", Icon: IconInbox, match: (p: string) => p.startsWith("/inbox") },
  { href: "/review", label: "振り返り", Icon: IconReview, match: (p: string) => p.startsWith("/review") },
];

export function BottomNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const path = usePathname();
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-xl justify-around pt-1.5 pb-1">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-12 min-w-20 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "font-bold text-ink" : "text-sub"}`}
            >
              <Icon />
              <span>{label}</span>
              {href === "/inbox" && inboxCount > 0 && (
                <span className="absolute top-0 right-4 min-w-5 rounded-full bg-pen-red px-1.5 text-center text-[11px] leading-5 font-bold text-white">
                  {inboxCount}
                  <span className="sr-only">件の確認待ち</span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
