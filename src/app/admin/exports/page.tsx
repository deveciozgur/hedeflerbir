import { redirect } from "next/navigation";

/** "Veri Dışa Aktarma" became part of Raporlar; old links keep working. */
export default function ExportsPage() {
  redirect("/admin/reports");
}
