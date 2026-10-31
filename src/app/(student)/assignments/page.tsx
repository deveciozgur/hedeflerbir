import type { Metadata } from "next";
import { ClipboardCheck, Columns3, List } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getStudentAssignments } from "@/modules/assignments/application/student-assignments.queries";
import type { BoardColumn } from "@/modules/assignments/domain/submission-status";
import { AssignmentBoard } from "@/modules/assignments/ui/assignment-board";
import { AssignmentList } from "@/modules/assignments/ui/assignment-list";

export const metadata: Metadata = { title: "Ödevler" };

/** Status filters map 1:1 onto the board's columns; "all" shows everything. */
const FILTERS: ReadonlyArray<{ value: "all" | BoardColumn; label: string; empty: string }> = [
  { value: "all", label: "Tümü", empty: "Henüz ödevin yok." },
  { value: "pending", label: "Teslim edilecek", empty: "Teslim bekleyen ödevin yok." },
  { value: "submitted", label: "Teslim edildi", empty: "Değerlendirme bekleyen teslimin yok." },
  { value: "graded", label: "Değerlendirildi", empty: "Henüz değerlendirilen ödevin yok." },
];

const hrefFor = (status: string, view: string) => {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (view !== "list") params.set("view", view);
  const query = params.toString();
  return query ? `/assignments?${query}` : "/assignments";
};

interface PageProps {
  searchParams: Promise<{ status?: string; view?: string }>;
}

export default async function AssignmentsPage({ searchParams }: PageProps) {
  const [params, viewer] = await Promise.all([searchParams, getViewer("STUDENT")]);
  const items = await getStudentAssignments(viewer.id);

  const view = params.view === "board" ? "board" : "list";
  const filter = FILTERS.find((f) => f.value === params.status) ?? FILTERS[0]!;
  const visible = filter.value === "all" ? items : items.filter((item) => item.column === filter.value);
  const countOf = (value: string) => (value === "all" ? items.length : items.filter((i) => i.column === value).length);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Ödevler" description="Yapılacaklar listen: hangi eğitimden hangi ödevin beklediği, son tarihi ve durumu. Dosyanı eğitimin sayfasından teslim edersin." />

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Henüz ödevin yok"
          description="Eğitmenlerin kayıtlı olduğun eğitimlere ödev tanımladığında burada göreceksin."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {view === "list" ? (
              <SegmentedLinks
                label="Ödev durumu"
                layoutId="assignment-status"
                value={filter.value}
                options={FILTERS.map((f) => ({ value: f.value, label: f.label, href: hrefFor(f.value, view), count: countOf(f.value) }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Durumuna göre tüm ödevler</p>
            )}
            <SegmentedLinks
              label="Görünüm"
              layoutId="assignment-view"
              value={view}
              options={[
                { value: "list", label: "Liste", href: hrefFor(filter.value, "list"), icon: <List /> },
                { value: "board", label: "Pano", href: hrefFor("all", "board"), icon: <Columns3 /> },
              ]}
            />
          </div>

          {view === "board" ? (
            <AssignmentBoard items={items} />
          ) : visible.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title={filter.empty} description="Diğer sekmelerde başka ödevlerin olabilir." />
          ) : (
            <AssignmentList items={visible} />
          )}
        </div>
      )}
    </div>
  );
}
