"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NAVIGATION, SHELL_LABEL, type ShellVariant } from "@/config/navigation";

/**
 * Header breadcrumb: panel › section › (detail). Section titles come from the navigation config, so a
 * new nav item gets its crumb for free; deeper pages show a generic "Ayrıntı".
 */
export function Breadcrumbs({ variant }: { variant: ShellVariant }) {
  const pathname = usePathname();
  const items = NAVIGATION[variant].flatMap((section) => section.items);
  // Longest matching href wins (e.g. /admin/teams over /admin).
  const section = items
    .filter((item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const isDetail = section ? pathname !== section.href : false;

  return (
    <nav aria-label="Konum" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      <span className="text-subtle">{SHELL_LABEL[variant]}</span>
      {section ? (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden />
          {isDetail ? (
            <Link href={section.href} className="truncate rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              {section.title}
            </Link>
          ) : (
            <span className="truncate font-medium" aria-current="page">
              {section.title}
            </span>
          )}
        </>
      ) : null}
      {isDetail ? (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden />
          <span className="font-medium" aria-current="page">
            Ayrıntı
          </span>
        </>
      ) : null}
    </nav>
  );
}
