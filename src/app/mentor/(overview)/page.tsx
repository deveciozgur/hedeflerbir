import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarPlus } from "lucide-react";
import { BENTO_SPAN, BentoGrid } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMentorOverview } from "@/modules/mentoring/application/mentor-portal.queries";
import { MentorAppointmentCard } from "@/modules/mentoring/ui/mentor-appointment-card";

export const metadata: Metadata = { title: "Genel Bakış" };

export default async function MentorOverviewPage() {
  const viewer = await getViewer("MENTOR");
  const o = await getMentorOverview(viewer.id);
  const all = o.completedTotal + o.upcomingCount;
  const completedPct = all === 0 ? 0 : (o.completedTotal / all) * 100;
  const legend = [
    { label: "Tamamlanan seans", value: o.completedTotal, dot: "bg-brand" },
    { label: "Bekleyen (onaylı) seans", value: o.upcomingCount, dot: "bg-amber" },
    { label: "Bu ay tamamlanan", value: o.completedThisMonth, dot: "bg-cyan" },
    { label: "Açık müsaitlik slotu", value: o.openSlotCount, dot: "bg-border-hover" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Merhaba, ${viewer.name}`}
        description="Program yönetiminin onayladığı mentorluk seansların ve tanışman gereken ekipler."
        actions={
          <Button asChild variant="outline">
            <Link href="/mentor/availability">
              <CalendarPlus aria-hidden /> Müsaitliğini düzenle
            </Link>
          </Button>
        }
      />

      <BentoGrid>
        <section aria-labelledby="next-sessions" className={cn(BENTO_SPAN.main, "flex flex-col gap-4")}>
          <div className="flex items-center justify-between">
            <h2 id="next-sessions" className="text-sm font-semibold">
              Yaklaşan mentorluk seansları <span className="font-mono text-xs font-normal text-subtle tabular-nums">{o.upcomingCount}</span>
            </h2>
            {o.upcomingCount > o.next.length ? (
              <Button asChild variant="link" size="sm">
                <Link href="/mentor/appointments">
                  Tümü <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
          {o.next.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Onaylı seans yok"
              description="Program yönetimi bir ekiple seansını onayladığında ekibin tanıtım kartıyla birlikte burada göreceksin."
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {o.next.map((appointment) => (
                <li key={appointment.id}>
                  <MentorAppointmentCard appointment={appointment} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Seans raporu" className={BENTO_SPAN.side}>
          <Card className="gap-5 lg:sticky lg:top-20">
            <CardHeader>
              <div>
                <CardTitle>Seans raporu</CardTitle>
                <CardDescription>Tamamlanan ve bekleyen seanslar</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <ProgressRing value={completedPct} size={136} strokeWidth={10} label="Tamamlanan seans oranı" />
              <dl className="flex w-full flex-col gap-2.5">
                {legend.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <span className={cn("size-2 rounded-full", row.dot)} aria-hidden />
                      {row.label}
                    </dt>
                    <dd className="font-mono font-semibold tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </section>
      </BentoGrid>
    </div>
  );
}
