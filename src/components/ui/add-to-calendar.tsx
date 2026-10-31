"use client";

import { CalendarPlus, Download, ExternalLink } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";

interface AddToCalendarProps {
  event: CalendarEvent;
  /** Route that serves the .ics file for this event. */
  icsHref: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}

export function AddToCalendar({ event, icsHref, size = "sm", variant = "outline" }: AddToCalendarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <CalendarPlus aria-hidden /> Takvime ekle
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden /> Google Takvim
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={icsHref} download>
            <Download aria-hidden /> Takvim dosyası (.ics)
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
