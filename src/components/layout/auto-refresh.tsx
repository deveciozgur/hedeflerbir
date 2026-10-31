"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight near-real-time updates: re-fetches the RSC payload on an interval while the tab is visible,
 * and immediately when the user returns to the tab.
 */
export function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refreshIfVisible = () => document.visibilityState === "visible" && router.refresh();
    const timer = setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [router, intervalMs]);

  return null;
}
