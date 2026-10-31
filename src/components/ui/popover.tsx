import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ className, align = "end", sideOffset = 8, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-[min(24rem,calc(100vw-2rem))] origin-(--radix-popover-content-transform-origin) rounded-xl border border-border-strong/60 bg-popover text-popover-foreground shadow-xl shadow-shadow outline-none",
          "data-[state=closed]:animate-exit data-[state=open]:animate-enter",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
