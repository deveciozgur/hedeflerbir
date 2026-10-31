/**
 * Upcoming agenda - a read model unifying live sessions, assignment deadlines
 * and mentor appointments into one chronological timeline.
 */

export type AgendaKind = "session" | "assignment" | "appointment";

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  title: string;
  context: string;
  date: Date;
  /** End of a session/appointment; deadlines are instants. */
  endsAt: Date | null;
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

/** Status pill for a timeline entry. Each value maps to exactly one semantic color. */
export type AgendaStatus = "live" | "scheduled" | "dueSoon" | "due" | "confirmed";

export const AGENDA_STATUS_LABELS: Record<AgendaStatus, string> = {
  live: "Şu an canlı",
  scheduled: "Planlandı",
  dueSoon: "Teslim yaklaşıyor",
  due: "Teslim bekliyor",
  confirmed: "Onaylandı",
};

export function agendaStatus(item: AgendaItem, now: Date = new Date()): AgendaStatus {
  switch (item.kind) {
    case "session":
      return item.date <= now && (item.endsAt ?? item.date) > now ? "live" : "scheduled";
    case "assignment":
      return isUrgent(item, now) ? "dueSoon" : "due";
    case "appointment":
      return "confirmed";
  }
}

export interface AgendaDay {
  key: string;
  date: Date;
  items: AgendaItem[];
}

/** Groups an already sorted agenda by calendar day; `keyOf` supplies the platform time zone. */
export function groupAgendaByDay(items: readonly AgendaItem[], keyOf: (date: Date) => string): AgendaDay[] {
  const days = new Map<string, AgendaDay>();
  for (const item of items) {
    const key = keyOf(item.date);
    const day = days.get(key) ?? { key, date: item.date, items: [] };
    day.items.push(item);
    days.set(key, day);
  }
  return [...days.values()];
}
