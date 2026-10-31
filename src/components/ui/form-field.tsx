import type { ReactNode } from "react";
import { Label } from "./label";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Label + control + hint/error wiring. Controls should set aria-describedby={`${id}-message`}. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {message ? (
        <p id={`${id}-message`} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
