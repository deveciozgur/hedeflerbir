import type { ReactNode } from "react";
import { PROFILE_HREF, SHELL_LABEL, type ShellVariant } from "@/config/navigation";
import type { Viewer } from "@/modules/identity/application/viewer.queries";
import { getRecentNotifications } from "@/modules/notifications/application/notifications.queries";
import { NotificationBell } from "@/modules/notifications/ui/notification-bell";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

interface AppShellProps {
  variant: ShellVariant;
  viewer: Viewer;
  children: ReactNode;
}

export async function AppShell({ variant, viewer, children }: AppShellProps) {
  const notifications = await getRecentNotifications(viewer.id);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        İçeriğe geç
      </a>

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Brand subtitle={SHELL_LABEL[variant]} className="px-2" />
        <SidebarNav variant={variant} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/75 px-4 backdrop-blur-md sm:px-6 lg:px-12">
          <MobileNav variant={variant} />
          <Brand subtitle={SHELL_LABEL[variant]} className="lg:hidden" />
          <div className="ml-auto flex items-center gap-1">
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
      </div>
    </div>
  );
}
