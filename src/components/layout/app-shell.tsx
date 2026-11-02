import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { CalendarRange } from "lucide-react";
import { PROFILE_HREF, SHELL_LABEL, SIDEBAR_COOKIE, type ShellVariant } from "@/config/navigation";
import type { Viewer } from "@/modules/identity/application/viewer.queries";
import { getRecentNotifications } from "@/modules/notifications/application/notifications.queries";
import { NotificationBell } from "@/modules/notifications/ui/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "./brand";
import { Breadcrumbs } from "./breadcrumbs";
import { CommandPalette } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { PasswordReminder } from "./password-reminder";
import { ShellSidebar } from "./shell-sidebar";
import { getProgramLabel } from "@/modules/learning/application/program.service";
import { UserMenu } from "./user-menu";

interface AppShellProps {
  variant: ShellVariant;
  viewer: Viewer;
  children: ReactNode;
}

export async function AppShell({ variant, viewer, children }: AppShellProps) {
  const [notifications, cookieStore, program] = await Promise.all([getRecentNotifications(viewer.id), cookies(), getProgramLabel()]);
  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        İçeriğe geç
      </a>

      <ShellSidebar variant={variant} initialCollapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/75 px-4 backdrop-blur-md sm:px-6 lg:px-12">
          <MobileNav variant={variant} />
          <Brand subtitle={SHELL_LABEL[variant]} className="lg:hidden" />
          <Breadcrumbs variant={variant} />
          {program ? (
            <span className="ml-2 hidden items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-muted-foreground xl:inline-flex" title="Aktif program">
              <CalendarRange className="size-3.5" aria-hidden /> {program}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <CommandPalette variant={variant} />
            <ThemeToggle />
            <NotificationBell items={notifications} unreadCount={viewer.unreadNotifications} />
            <UserMenu
              name={viewer.name}
              surname={viewer.surname}
              email={viewer.email}
              role={viewer.role}
              avatarUrl={viewer.avatarUrl}
              profileHref={PROFILE_HREF[variant]}
            />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
          {children}
        </main>
        {viewer.mustChangePassword ? <PasswordReminder userId={viewer.id} passwordHref={`${PROFILE_HREF[variant]}#sifre`} /> : null}
      </div>
    </div>
  );
}
