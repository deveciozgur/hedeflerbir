import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CalendarClock, CalendarPlus, CheckCircle2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMentorOverview } from "@/modules/mentoring/application/mentor-portal.queries";
import { MentorAppointmentCard } from "@/modules/mentoring/ui/mentor-appointment-card";

export const metadata: Metadata = { title: "Genel Bakış" };

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md border bg-muted/50" aria-hidden>
          <Icon className="size-4 text-muted-foreground" />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function MentorOverviewPage() {
  const viewer = await getViewer("MENTOR");
  const overview = await getMentorOverview(viewer.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Merhaba, ${viewer.name}`}
        description="Yaklaşan seansların ve müsaitlik durumun."
        actions={
          <Button asChild variant="outline">
            <Link href="/mentor/availability">
              <CalendarPlus aria-hidden /> Müsaitlik ekle
            </Link>
          </Button>
        }
      />

      <section aria-label="Özet" className="grid gap-4 sm:grid-cols-3">
        <Stat icon={CalendarClock} label="Yaklaşan seans" value={overview.upcomingCount} />
        <Stat icon={CalendarCheck2} label="Açık slot" value={overview.openSlotCount} />
        <Stat icon={CheckCircle2} label="Bu ay tamamlanan" value={overview.completedThisMonth} />
      </section>

      <section aria-labelledby="next-sessions" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="next-sessions" className="text-sm font-semibold">
            Sıradaki seanslar
          </h2>
          {overview.upcomingCount > overview.next.length ? (
            <Button asChild variant="link" size="sm">
              <Link href="/mentor/appointments">
                Tümü <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
        {overview.next.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Yaklaşan seans yok"
            description={
              overview.openSlotCount === 0
                ? "Katılımcıların randevu alabilmesi için önce müsaitlik ekle."
                : "Bir katılımcı randevu aldığında burada ve e-postanda göreceksin."
            }
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {overview.next.map((appointment) => (
              <li key={appointment.id}>
                <MentorAppointmentCard appointment={appointment} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
