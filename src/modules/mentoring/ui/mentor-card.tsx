import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/utils";
import type { MentorCardModel } from "../application/mentor-directory.queries";

export function MentorCard({ mentor }: { mentor: MentorCardModel }) {
  return (
    <Link
      href={`/mentors/${mentor.id}`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] outline-none hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-center gap-3">
        <UserAvatar user={mentor} className="size-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{fullName(mentor)}</p>
          {mentor.title ? <p className="truncate text-sm text-muted-foreground">{mentor.title}</p> : null}
        </div>
      </div>
      {mentor.expertiseArea ? <Badge variant="secondary">{mentor.expertiseArea}</Badge> : null}
      <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarClock className="size-3.5" aria-hidden />
        {mentor.nextAvailable ? (
          <>
            İlk müsait: <time dateTime={mentor.nextAvailable.toISOString()}>{formatDateTime(mentor.nextAvailable)}</time>
            <span className="ml-auto text-brand">{mentor.openSlotCount} slot</span>
          </>
        ) : (
          "Şu an müsait saat yok"
        )}
      </p>
    </Link>
  );
}
