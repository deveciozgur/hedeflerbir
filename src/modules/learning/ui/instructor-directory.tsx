"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { surfaceClass } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PersonHeader } from "@/components/ui/person-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn, fullName, splitTags } from "@/lib/utils";
import type { InstructorDetail } from "../application/instructor-directory.queries";

const MAX_CARD_TAGS = 3;

/** Instructor grid; a card opens bio, expertise and taught courses in a modal. */
export function InstructorDirectory({ instructors }: { instructors: InstructorDetail[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = instructors.find((i) => i.id === openId) ?? null;

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {instructors.map((instructor) => {
          const tags = splitTags(instructor.expertiseArea);
          return (
            <li key={instructor.id}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpenId(instructor.id)}
                className={cn(
                  surfaceClass,
                  "flex h-full w-full flex-col gap-4 p-6 text-left outline-none transition-[border-color,background-color] duration-150 hover:border-border-strong hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
                )}
              >
                <span className="flex items-center gap-3">
                  <UserAvatar user={instructor} className="size-12" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{fullName(instructor)}</span>
                    {instructor.title ? <span className="block truncate text-sm text-muted-foreground">{instructor.title}</span> : null}
                  </span>
                </span>
                {tags.length > 0 ? (
                  <span className="flex flex-wrap gap-2">
                    {tags.slice(0, MAX_CARD_TAGS).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > MAX_CARD_TAGS ? <Badge variant="outline">+{tags.length - MAX_CARD_TAGS}</Badge> : null}
                  </span>
                ) : null}
                <span className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" aria-hidden />
                  <span className="font-mono tabular-nums">{instructor.courseCount}</span> eğitim
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        {active ? (
          <DialogContent className="max-w-2xl gap-8">
            <PersonHeader
              person={active}
              titleAs={(name) => <DialogTitle className="truncate text-lg">{name}</DialogTitle>}
              className="pr-8"
            />
            <DialogDescription className="sr-only">Eğitmen profili ve verdiği eğitimler</DialogDescription>
            <section aria-label="Verdiği eğitimler" className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold">Verdiği eğitimler</h3>
              {active.courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bu eğitmene atanmış bir eğitim bulunmuyor.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {active.courses.map((course) => (
                    <li key={course.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-sunken p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{course.title}</span>
                        {course.enrolled ? <Badge variant="success">Kayıtlısın</Badge> : null}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs text-subtle">
                          <Layers className="size-3.5" aria-hidden />
                          <span className="font-mono tabular-nums">{course.sessionCount}</span> oturum
                        </span>
                        {course.enrolled ? (
                          <Link
                            href={`/courses/${course.slug}`}
                            className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-brand-soft outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                          >
                            Eğitime git <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
