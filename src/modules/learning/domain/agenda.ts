/**
 * Upcoming agenda — a read model unifying live sessions, assignment deadlines
 * and mentor appointments into one chronological timeline.
 */

export type AgendaKind = "session" | "assignment" | "appointment";

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  title: string;
  context: string;
  date: Date;
  href: string;
}

export const AGENDA_KIND_LABELS: Record<AgendaKind, string> = {
  session: "Canlı ders",
  assignment: "Teslim",
  appointment: "Mentor seansı",
};

export function buildAgenda(groups: ReadonlyArray<readonly AgendaItem[]>, limit = 6): AgendaItem[] {
  return groups
    .flat()
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

/** Deadlines inside this window are flagged as urgent in the UI. */
export const URGENT_WINDOW_MS = 48 * 60 * 60 * 1000;

export const isUrgent = (item: AgendaItem, now: Date = new Date()) =>
  item.kind === "assignment" && item.date.getTime() - now.getTime() <= URGENT_WINDOW_MS;
