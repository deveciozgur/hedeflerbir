import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { getMentorDetail } from "@/modules/mentoring/application/mentor-directory.queries";
import { BOOKING_HORIZON_DAYS } from "@/modules/mentoring/domain/availability";
import { AvailabilityPicker } from "@/modules/mentoring/ui/availability-picker";

export const metadata: Metadata = { title: "Mentor" };

export default async function MentorDetailPage({ params }: { params: Promise<{ mentorId: string }> }) {
  const [{ mentorId }] = await Promise.all([params, getViewer("STUDENT")]);
  const mentor = await getMentorDetail(mentorId);
  const name = fullName(mentor);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/mentors"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Mentorlar
      </Link>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2 lg:self-start">
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <UserAvatar user={mentor} className="size-16" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight">{name}</h1>
                {mentor.title ? <p className="text-sm text-muted-foreground">{mentor.title}</p> : null}
              </div>
            </div>
            {mentor.expertiseArea ? <Badge variant="brand">{mentor.expertiseArea}</Badge> : null}
            {mentor.bio ? <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{mentor.bio}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${mentor.email}`}>
                  <Mail aria-hidden /> E-posta
                </a>
              </Button>
              {mentor.socialLinks.map((link) => (
                <Button key={link.network} asChild variant="outline" size="sm">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden /> {link.label}
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Müsaitlik takvimi</CardTitle>
              <CardDescription>
                Önümüzdeki {BOOKING_HORIZON_DAYS} gün · Saatler Türkiye saatiyle gösterilir.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AvailabilityPicker mentorName={name} slots={mentor.slots} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
