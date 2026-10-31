"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, type NavItem, type ShellVariant } from "@/config/navigation";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

export function SidebarNav({ variant, onNavigate }: { variant: ShellVariant; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana menü" className="flex flex-col gap-6">
      {NAVIGATION[variant].map((section, index) => (
        <div key={section.label ?? index} className="flex flex-col gap-0.5">
          {section.label ? (
            <p className="px-2 pb-2 text-xs font-medium text-subtle">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-8 items-center gap-3 rounded-md px-2 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-foreground shadow-[inset_0_0_0_1px_var(--border)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon
                  className={cn("size-4 shrink-0", active ? "text-brand-soft" : "text-subtle group-hover:text-sidebar-foreground")}
                  aria-hidden
                />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
