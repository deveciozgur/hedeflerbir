"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One-click light/dark switch. Both icons and labels are rendered and the `dark:` variant
 * picks the visible pair, so server and client markup are identical (no hydration mismatch,
 * no "mounted" flicker) - the theme class itself is applied before paint by next-themes.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="dark:hidden" aria-hidden />
      <Sun className="hidden dark:block" aria-hidden />
      <span className="sr-only dark:hidden">Koyu temaya geç</span>
      <span className="sr-only hidden dark:inline">Açık temaya geç</span>
    </Button>
  );
}
