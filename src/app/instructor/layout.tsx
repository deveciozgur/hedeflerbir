import { AppShell } from "@/components/layout/app-shell";
import { getViewer } from "@/modules/identity/application/viewer.queries";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer("INSTRUCTOR");
  return (
    <AppShell variant="instructor" viewer={viewer}>
      {children}
    </AppShell>
  );
}
