"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Shared body for every segment-level `error.tsx` boundary. */
export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Bir şeyler ters gitti"
      description={
        error.digest
          ? `Beklenmeyen bir hata oluştu. Sorun devam ederse destek ekibine şu kodu iletin: ${error.digest}`
          : "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
      }
      action={<Button onClick={reset}>Tekrar dene</Button>}
    />
  );
}
