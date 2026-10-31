import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonHeader } from "@/components/ui/person-header";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMentorDetail } from "@/modules/mentoring/application/mentor-directory.queries";
import { BOOKING_HORIZON_DAYS } from "@/modules/mentoring/domain/availability";
import { SlotPicker } from "@/modules/mentoring/ui/slot-picker";

export const metadata: Metadata = { title: "Mentor" };

export default async function MentorDetailPage({ params }: { params: Promise<{ mentorId: string }> }) {
  const [{ mentorId }] = await Promise.all([params, getViewer("STUDENT")]);
  const mentor = await getMentorDetail(mentorId);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/mentors"
        className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden /> Mentorlar
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="px-6 lg:self-start">
          <PersonHeader person={mentor} />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Müsaitlik</CardTitle>
              <CardDescription>Önümüzdeki {BOOKING_HORIZON_DAYS} gün, Türkiye saatiyle.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <SlotPicker mentorName={fullName(mentor)} slots={mentor.slots} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
