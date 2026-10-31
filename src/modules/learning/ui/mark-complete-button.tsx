"use client";

import { useTransition } from "react";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markLessonCompleteAction } from "../application/learning.actions";
import { announceCertificate } from "./lesson-video";

export function MarkCompleteButton({ lessonId, isCompleted }: { lessonId: string; isCompleted: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isCompleted) {
    return (
      <Badge variant="success" className="h-8 px-3 text-sm">
        <CheckCircle2 aria-hidden /> Tamamlandı
      </Badge>
    );
  }

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markLessonCompleteAction(lessonId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Ders tamamlandı");
          announceCertificate(result.data.certificateCode);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
      Tamamlandı olarak işaretle
    </Button>
  );
}
