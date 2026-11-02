import { CommandCenterSkeleton } from "@/components/layout/dashboard-skeleton";

export default function AdminHomeLoading() {
  return <CommandCenterSkeleton label="Operasyon merkezi yükleniyor" actions={5} wide />;
}
