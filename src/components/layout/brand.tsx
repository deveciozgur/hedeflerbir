import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ href = "/", subtitle, className }: { href?: string; subtitle?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}>
      <span className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground" aria-hidden>
        H1
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">HedeflerBir</span>
        {subtitle ? <span className="mt-1 text-xs text-subtle">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
