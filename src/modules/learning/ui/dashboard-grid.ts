/** Shared by the dashboard page and its loading.tsx, so the skeleton fills the exact same boxes (CLS 0). */
export const DASHBOARD_GRID = {
  bottom: "grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]",
} as const;
