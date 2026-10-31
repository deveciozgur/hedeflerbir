import type { Metadata } from "next";
import { ClipboardCheck, Columns3, List } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentAssignments } from "@/modules/assignments/application/student-assignments.queries";
import { AssignmentBoard } from "@/modules/assignments/ui/assignment-board";
import { AssignmentList } from "@/modules/assignments/ui/assignment-list";

export const metadata: Metadata = { title: "Ödevler" };

const VIEW_OPTIONS = [
  { value: "board", label: "Pano", href: "/assignments", icon: Columns3 },
  { value: "list", label: "Liste", href: "/assignments?view=list", icon: List },
] as const;

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [{ view }, viewer] = await Promise.all([searchParams, getViewer("STUDENT")]);
  const items = await getStudentAssignments(viewer.id);
  const mode = view === "list" ? "list" : "board";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ödevler"
        description="Bekleyen, teslim edilen ve değerlendirilen ödevlerin."
        actions={items.length > 0 ? <SegmentedLinks label="Görünüm" value={mode} options={VIEW_OPTIONS} /> : null}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Henüz ödevin yok"
          description="Eğitmenlerin kayıtlı olduğun eğitimlere ödev tanımladığında burada göreceksin."
        />
      ) : mode === "board" ? (
        <AssignmentBoard items={items} />
      ) : (
        <AssignmentList items={items} />
      )}
    </div>
  );
}
