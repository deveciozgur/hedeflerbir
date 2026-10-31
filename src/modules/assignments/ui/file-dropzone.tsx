"use client";

import { useId, useState, type DragEvent } from "react";
import { FileUp, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPT_ATTRIBUTE, formatBytes, validateSubmissionFile } from "../domain/file-policy";

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

/** Drag-and-drop + click/keyboard file picker. Validates with the same domain policy as the server. */
export function FileDropzone({ file, onFileChange, disabled }: FileDropzoneProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = validateSubmissionFile(candidate);
    setError(problem);
    onFileChange(problem ? null : candidate);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) accept(event.dataTransfer.files[0]);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-background" aria-hidden>
          <Paperclip className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onFileChange(null)} disabled={disabled} aria-label="Dosyayı kaldır">
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
          dragging ? "border-brand bg-brand/5" : "hover:bg-muted/50",
          error && "border-destructive/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <FileUp className={cn("size-6", dragging ? "text-brand" : "text-muted-foreground")} aria-hidden />
        <span className="text-sm font-medium">Dosyayı sürükle bırak veya seç</span>
        <span className="text-xs text-muted-foreground">PDF, ZIP, Office veya görsel · en fazla 20 MB</span>
        <input
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            accept(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
