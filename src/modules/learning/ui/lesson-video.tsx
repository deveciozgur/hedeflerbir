"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveLessonProgressAction } from "../application/learning.actions";
import type { RecordingSource } from "../domain/recording";
import { EmbeddedVideo, TrackedVideo } from "./video-player";

interface LessonVideoProps {
  lessonId: string;
  title: string;
  source: RecordingSource;
  startAt: number;
  isCompleted: boolean;
  next: { href: string; title: string } | null;
}

export function announceCertificate(code: string | null) {
  if (!code) return;
  toast.success("Tebrikler, eğitimi tamamladın", {
    description: "Sertifikan hazır.",
    action: { label: "İndir", onClick: () => window.open(`/api/certificates/${code}`, "_blank", "noopener") },
  });
}

export function LessonVideo({ lessonId, title, source, startAt, isCompleted, next }: LessonVideoProps) {
  const completed = useRef(isCompleted);

  const onProgress = useCallback(
    (positionSeconds: number, durationSeconds: number) => {
      void saveLessonProgressAction({ lessonId, positionSeconds, durationSeconds }).then((result) => {
        if (!result.ok || !result.data.completed || completed.current) return;
        completed.current = true;
        toast.success("Dersi tamamladın", { description: title });
        announceCertificate(result.data.certificateCode);
      });
    },
    [lessonId, title],
  );

  if (source.kind !== "file") return <EmbeddedVideo source={source} title={title} />;

  return (
    <TrackedVideo
      key={lessonId}
      src={source.src}
      title={title}
      startAt={startAt}
      onProgress={onProgress}
      endedOverlay={(dismiss) => (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center text-white">
          {next ? (
            <>
              <p className="text-xs tracking-wide text-white/60 uppercase">Sıradaki ders</p>
              <p className="text-base font-semibold text-balance">{next.title}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={dismiss}>
                  <RotateCcw aria-hidden /> Tekrar izle
                </Button>
                <Button asChild size="sm">
                  <Link href={next.href} scroll={false}>
                    Devam et <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-semibold">Son dersi izledin</p>
              <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={dismiss}>
                <RotateCcw aria-hidden /> Tekrar izle
              </Button>
            </>
          )}
        </div>
      )}
    />
  );
}
