"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LESSON_TYPE_LABELS, type OutlineModule } from "../domain/lessons";
import { LESSON_TYPE_ICON } from "./lesson-type-icon";

interface LessonOutlineProps {
  slug: string;
  modules: OutlineModule[];
  activeId: string | null;
  onNavigate?: () => void;
}

/** Collapsible module → lesson tree with completion checks. The active lesson's module starts open. */
export function LessonOutline({ slug, modules, activeId, onNavigate }: LessonOutlineProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(modules.filter((m) => !m.lessons.some((l) => l.id === activeId)).map((m) => m.id)),
  );
  // Navigating into a collapsed module (e.g. via "next lesson") opens it.
  const activeModuleId = modules.find((m) => m.lessons.some((l) => l.id === activeId))?.id;
  useEffect(() => {
    if (!activeModuleId) return;
    setCollapsed((prev) => {
      if (!prev.has(activeModuleId)) return prev;
      const next = new Set(prev);
      next.delete(activeModuleId);
      return next;
    });
  }, [activeModuleId]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav aria-label="Müfredat" className="flex flex-col gap-1">
      {modules.map((module, moduleIndex) => {
        const open = !collapsed.has(module.id);
        const done = module.lessons.filter((l) => l.isCompleted).length;
        const panelId = `module-${module.id}`;
        return (
          <section key={module.id} className="flex flex-col">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(module.id)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs text-subtle">Bölüm {moduleIndex + 1}</span>
                <span className="truncate text-sm font-semibold">{module.title}</span>
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {done}/{module.lessons.length}
              </span>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-180")} aria-hidden />
            </button>
            {open ? (
              <ol id={panelId} className="mt-0.5 flex flex-col gap-0.5">
                {module.lessons.map((lesson) => {
                  const active = lesson.id === activeId;
                  const TypeIcon = LESSON_TYPE_ICON[lesson.type];
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/courses/${slug}?lesson=${lesson.id}`}
                        scroll={false}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-3 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active ? "bg-accent" : "hover:bg-accent/50",
                        )}
                      >
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Tamamlandı" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-subtle" aria-label="Tamamlanmadı" />
                        )}
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className={cn("text-sm text-pretty", active ? "font-medium" : "text-foreground/90")}>{lesson.title}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TypeIcon className="size-3.5" aria-hidden />
                            {LESSON_TYPE_LABELS[lesson.type]}
                            {lesson.durationMinutes ? <span className="font-mono tabular-nums">· {lesson.durationMinutes} dk</span> : null}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
