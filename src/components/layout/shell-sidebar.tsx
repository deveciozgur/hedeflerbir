"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SHELL_LABEL, SIDEBAR_COOKIE, type ShellVariant } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";

/**
 * Desktop sidebar that collapses to an icon rail. The state lives in a cookie so the server renders
 * the right width on the next request (no hydration jump), and in local state for instant toggling.
 */
export function ShellSidebar({ variant, initialCollapsed }: { variant: ShellVariant; initialCollapsed: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-8 border-r border-sidebar-border bg-sidebar py-6 transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-16 px-2" : "w-60 px-4",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2 px-2")}>
        {collapsed ? null : <Brand subtitle={SHELL_LABEL[variant]} />}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          aria-expanded={!collapsed}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
        >
          {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
        </button>
      </div>
      <SidebarNav variant={variant} collapsed={collapsed} />
    </aside>
  );
}
