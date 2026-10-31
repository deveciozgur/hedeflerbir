import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * public/logo.png is 1356x417 (trimmed, transparent, 3.25:1). width/height here are the rendered
 * size at h-6 (24px), so next/image emits a 1x/2x srcset around 78px instead of shipping 3840w.
 */
const LOGO = { src: "/logo.png", width: 78, height: 24 } as const;

export function Brand({ href = "/", subtitle, className }: { href?: string; subtitle?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Decorative next to the wordmark: the link's accessible name comes from the text, not repeated by alt. */}
      <Image src={LOGO.src} width={LOGO.width} height={LOGO.height} alt="" priority className="h-6 w-auto shrink-0 object-contain" />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">HedeflerBir</span>
        {subtitle ? <span className="mt-1 text-xs text-subtle">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
