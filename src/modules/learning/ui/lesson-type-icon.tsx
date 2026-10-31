import { ClipboardCheck, FileText, ListChecks, PlayCircle, Radio, type LucideIcon } from "lucide-react";
import type { LessonType } from "../domain/lessons";

export const LESSON_TYPE_ICON: Record<LessonType, LucideIcon> = {
  VIDEO: PlayCircle,
  ARTICLE: FileText,
  QUIZ: ListChecks,
  ASSIGNMENT: ClipboardCheck,
  LIVE_SESSION: Radio,
};
