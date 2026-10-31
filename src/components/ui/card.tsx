import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Elevated surface: translucent card over a blur, hairline border; soft drop shadow in light, top highlight in dark. */
export const surfaceClass =
  "rounded-xl border border-border bg-card backdrop-blur-md shadow-[0_1px_2px_var(--shadow)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col gap-6 py-6 text-card-foreground", surfaceClass, className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex items-start justify-between gap-4 px-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-sm font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("mt-2 text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...props} />;
}
