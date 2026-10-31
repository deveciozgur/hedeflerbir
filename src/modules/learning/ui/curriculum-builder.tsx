"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Check, GripVertical, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { QuizEditorDialog } from "@/modules/assessment/ui/quiz-editor-dialog";
import { QuizResultsDialog } from "@/modules/assessment/ui/quiz-results-dialog";
import {
  createModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  renameModuleAction,
  saveCurriculumOrderAction,
} from "../application/curriculum-admin.actions";
import type { CurriculumEditor, EditableLesson, EditableModule } from "../application/instructor-curriculum.queries";
import { LESSON_TYPE_LABELS } from "../domain/lessons";
import { LessonFormDialog } from "./lesson-form-dialog";
import { LESSON_TYPE_ICON } from "./lesson-type-icon";

const moduleDndId = (id: string) => `module:${id}`;
const dropZoneId = (id: string) => `drop:${id}`;
const lessonDndId = (id: string) => `lesson:${id}`;
const rawId = (dndId: string) => dndId.slice(dndId.indexOf(":") + 1);

const orderOf = (modules: EditableModule[]) => modules.map((m) => ({ moduleId: m.id, lessonIds: m.lessons.map((l) => l.id) }));
const sameOrder = (a: EditableModule[], b: EditableModule[]) => JSON.stringify(orderOf(a)) === JSON.stringify(orderOf(b));

function lessonWarning(lesson: EditableLesson): string | null {
  if (lesson.type === "QUIZ" && !lesson.quiz?.questions.length) return "Soru yok";
  if (lesson.type === "VIDEO" && !lesson.videoUrl) return "Video yok";
  return null;
}

function DragHandle({ label, listeners, attributes }: { label: string; listeners: ReturnType<typeof useSortable>["listeners"]; attributes: ReturnType<typeof useSortable>["attributes"] }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-subtle outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}

type DragType = "module" | "lesson" | null;

function SortableLesson({
  lesson,
  editor,
  moduleId,
  enrolledCount,
  dragType,
}: {
  lesson: EditableLesson;
  editor: CurriculumEditor;
  moduleId: string;
  enrolledCount: number;
  dragType: DragType;
}) {
  // While a module is dragged, lessons are not drop targets (and vice versa), so keyboard moves land on a sibling.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lessonDndId(lesson.id),
    data: { type: "lesson" },
    disabled: { droppable: dragType === "module" },
  });
  const TypeIcon = LESSON_TYPE_ICON[lesson.type];
  const warning = lessonWarning(lesson);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex items-center gap-2 rounded-lg border border-transparent px-2 py-2", isDragging ? "z-10 border-border bg-popover shadow-lg" : "hover:bg-accent/50")}
    >
      <DragHandle label={`${lesson.title} dersini taşı`} listeners={listeners} attributes={attributes} />
      <TypeIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{lesson.title}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {LESSON_TYPE_LABELS[lesson.type]}
          {lesson.durationMinutes ? <span className="font-mono tabular-nums">{lesson.durationMinutes} dk</span> : null}
          <span className="font-mono tabular-nums">
            {lesson.completedCount}/{enrolledCount} tamamladı
          </span>
          {lesson.type === "QUIZ" && lesson.quiz ? <span className="font-mono tabular-nums">{lesson.quiz.questions.length} soru</span> : null}
        </span>
      </div>
      {warning ? (
        <Badge variant="warning" className="hidden sm:inline-flex">
          <AlertTriangle aria-hidden /> {warning}
        </Badge>
      ) : null}
      <div className="flex shrink-0 items-center">
        {lesson.type === "QUIZ" ? (
          <>
            <QuizResultsDialog lessonId={lesson.id} lessonTitle={lesson.title} attemptCount={lesson.quiz?.attemptCount ?? 0} />
            <QuizEditorDialog
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              quiz={lesson.quiz}
              trigger={
                <Button variant="ghost" size="sm">
                  <ListChecks aria-hidden /> Sorular
                </Button>
              }
            />
          </>
        ) : null}
        <LessonFormDialog
          moduleId={moduleId}
          lesson={lesson}
          editor={editor}
          trigger={
            <Button variant="ghost" size="icon" className="size-8" aria-label={`${lesson.title} dersini düzenle`}>
              <Pencil />
            </Button>
          }
        />
        <ConfirmActionButton
          variant="ghost"
          label={
            <>
              <Trash2 aria-hidden />
              <span className="sr-only">{`${lesson.title} dersini sil`}</span>
            </>
          }
          title="Ders silinsin mi?"
          description={`"${lesson.title}" ve katılımcıların bu dersteki ilerlemesi silinecek. Bağlı canlı ders veya ödev silinmez.`}
          confirmLabel="Dersi sil"
          successMessage="Ders silindi"
          destructive
          action={() => deleteLessonAction(lesson.id)}
        />
      </div>
    </li>
  );
}

function EmptyDropZone({ moduleId, dragType }: { moduleId: string; dragType: DragType }) {
  const { setNodeRef, isOver } = useDroppable({ id: dropZoneId(moduleId), disabled: dragType === "module" });
  return (
    <div ref={setNodeRef} className={cn("rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground", isOver ? "border-brand/60 bg-brand/5" : "border-border")}>
      Ders ekle veya buraya sürükle
    </div>
  );
}

function ModuleTitle({ module }: { module: EditableModule }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setTitle(module.title);
          setEditing(true);
        }}
        className="group flex min-w-0 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${module.title} bölümünü yeniden adlandır`}
      >
        <span className="truncate text-sm font-semibold">{module.title}</span>
        <Pencil className="size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
      </button>
    );
  }

  const save = () =>
    startTransition(async () => {
      const result = await renameModuleAction(module.id, { title });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditing(false);
    });

  return (
    <form
      className="flex min-w-0 flex-1 items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Bölüm adı" className="h-8" onKeyDown={(e) => e.key === "Escape" && setEditing(false)} />
      <Button type="submit" variant="ghost" size="icon" className="size-8" disabled={pending} aria-label="Kaydet">
        <Check />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setEditing(false)} aria-label="Vazgeç">
        <X />
      </Button>
    </form>
  );
}

function SortableModule({
  module,
  index,
  editor,
  dragType,
  children,
}: {
  module: EditableModule;
  index: number;
  editor: CurriculumEditor;
  dragType: DragType;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: moduleDndId(module.id),
    data: { type: "module" },
    disabled: { droppable: dragType === "lesson" },
  });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={`Bölüm ${index + 1}: ${module.title}`}
      className={cn(surfaceClass, "flex flex-col gap-2 p-3", isDragging && "z-20 shadow-xl")}
    >
      <header className="flex items-center gap-2 px-1">
        <DragHandle label={`${module.title} bölümünü taşı`} listeners={listeners} attributes={attributes} />
        <span className="font-mono text-xs text-subtle tabular-nums">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <ModuleTitle module={module} />
        </div>
        <LessonFormDialog
          moduleId={module.id}
          editor={editor}
          trigger={
            <Button variant="ghost" size="sm">
              <Plus aria-hidden /> Ders
            </Button>
          }
        />
        <ConfirmActionButton
          variant="ghost"
          label={
            <>
              <Trash2 aria-hidden />
              <span className="sr-only">{`${module.title} bölümünü sil`}</span>
            </>
          }
          title="Bölüm silinsin mi?"
          description={`"${module.title}" bölümü ve içindeki ${module.lessons.length} ders silinecek.`}
          confirmLabel="Bölümü sil"
          successMessage="Bölüm silindi"
          destructive
          action={() => deleteModuleAction(module.id)}
        />
      </header>
      {children}
    </section>
  );
}

function AddModuleForm({ courseId }: { courseId: string }) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createModuleAction(courseId, { title });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          setTitle("");
          toast.success("Bölüm eklendi");
        });
      }}
    >
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Yeni bölüm adı" aria-label="Yeni bölüm adı" className="max-w-sm" />
      <Button type="submit" variant="outline" disabled={pending || title.trim().length < 2}>
        <Plus aria-hidden /> Bölüm ekle
      </Button>
    </form>
  );
}

const announcements: Announcements = {
  onDragStart: () => "Taşıma başladı. Ok tuşlarıyla konumu seçin, boşlukla bırakın, Escape ile vazgeçin.",
  onDragOver: ({ over }) => (over ? "Yeni konumun üzerinde." : "Bırakılacak alan dışında."),
  onDragEnd: ({ over }) => (over ? "Bırakıldı, yeni sıralama kaydediliyor." : "Taşıma iptal edildi."),
  onDragCancel: () => "Taşıma iptal edildi.",
};

/** Module/lesson outline editor: drag to reorder modules, reorder lessons and move them between modules. */
export function CurriculumBuilder({ editor }: { editor: CurriculumEditor }) {
  const [modules, setModules] = useState(editor.modules);
  const snapshot = useRef(editor.modules);
  const latest = useRef(modules);
  const [dragType, setDragType] = useState<DragType>(null);
  // dnd-kit numbers its aria-describedby ids with a module counter; a stable id keeps SSR and hydration in sync.
  const dndId = useId();
  const [, startTransition] = useTransition();

  // Server data wins whenever it changes (after a save, create, delete or revalidation).
  useEffect(() => {
    setModules(editor.modules);
    latest.current = editor.modules;
  }, [editor.modules]);

  const apply = (next: EditableModule[]) => {
    latest.current = next;
    setModules(next);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const containerOf = (dndId: string): string | null => {
    if (dndId.startsWith("module:") || dndId.startsWith("drop:")) return rawId(dndId);
    const lessonId = rawId(dndId);
    return latest.current.find((m) => m.lessons.some((l) => l.id === lessonId))?.id ?? null;
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    snapshot.current = latest.current;
    setDragType(active.data.current?.type === "module" ? "module" : "lesson");
  };

  // Moving a lesson into another module happens while hovering, so the list makes room for it.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.data.current?.type !== "lesson") return;
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    if (!from || !to || from === to) return;

    const lessonId = rawId(String(active.id));
    const current = latest.current;
    const lesson = current.find((m) => m.id === from)!.lessons.find((l) => l.id === lessonId)!;
    const target = current.find((m) => m.id === to)!;
    const overIndex = String(over.id).startsWith("lesson:") ? target.lessons.findIndex((l) => l.id === rawId(String(over.id))) : target.lessons.length;
    apply(
      current.map((m) => {
        if (m.id === from) return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
        if (m.id === to) {
          const lessons = [...m.lessons];
          lessons.splice(overIndex < 0 ? lessons.length : overIndex, 0, lesson);
          return { ...m, lessons };
        }
        return m;
      }),
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragType(null);
    let next = latest.current;
    if (over && active.id !== over.id) {
      if (active.data.current?.type === "module") {
        const from = next.findIndex((m) => moduleDndId(m.id) === active.id);
        const to = next.findIndex((m) => m.id === containerOf(String(over.id)));
        if (from >= 0 && to >= 0) next = arrayMove(next, from, to);
      } else if (String(over.id).startsWith("lesson:")) {
        const container = containerOf(String(active.id));
        next = next.map((m) => {
          if (m.id !== container) return m;
          const from = m.lessons.findIndex((l) => lessonDndId(l.id) === active.id);
          const to = m.lessons.findIndex((l) => lessonDndId(l.id) === over.id);
          return from >= 0 && to >= 0 ? { ...m, lessons: arrayMove(m.lessons, from, to) } : m;
        });
      }
    }
    apply(next);
    if (sameOrder(next, snapshot.current)) return;

    const previous = snapshot.current;
    startTransition(async () => {
      const result = await saveCurriculumOrderAction(editor.courseId, orderOf(next));
      if (!result.ok) {
        toast.error(result.error);
        apply(previous);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {modules.length === 0 ? (
        <EmptyState icon={ListChecks} title="Müfredat boş" description="Önce bir bölüm ekle, sonra içine video, okuma, quiz, ödev veya canlı ders ekle." />
      ) : (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setDragType(null);
            apply(snapshot.current);
          }}
          accessibility={{ announcements, screenReaderInstructions: { draggable: "Taşımak için boşluk tuşuna basın." } }}
        >
          <SortableContext items={modules.map((m) => moduleDndId(m.id))} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {modules.map((module, index) => (
                <SortableModule key={module.id} module={module} index={index} editor={editor} dragType={dragType}>
                  <SortableContext items={module.lessons.map((l) => lessonDndId(l.id))} strategy={verticalListSortingStrategy}>
                    {module.lessons.length === 0 ? (
                      <EmptyDropZone moduleId={module.id} dragType={dragType} />
                    ) : (
                      <ol className="flex flex-col">
                        {module.lessons.map((lesson) => (
                          <SortableLesson key={lesson.id} lesson={lesson} editor={editor} moduleId={module.id} enrolledCount={editor.enrolledCount} dragType={dragType} />
                        ))}
                      </ol>
                    )}
                  </SortableContext>
                </SortableModule>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <AddModuleForm courseId={editor.courseId} />
    </div>
  );
}
