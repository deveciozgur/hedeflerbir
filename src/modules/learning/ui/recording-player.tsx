"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { saveWatchProgressAction } from "../application/learning.actions";
import type { RecordingSource } from "../domain/recording";
import { EmbeddedVideo, TrackedVideo } from "./video-player";

interface RecordingPlayerProps {
  sessionId: string;
  title: string;
  source: RecordingSource;
  startAt: number;
  alreadyWatched: boolean;
}

/** Live-session recording: native player with resume + progress tracking, or an embed for YouTube/Vimeo. */
export function RecordingPlayer({ sessionId, title, source, startAt, alreadyWatched }: RecordingPlayerProps) {
  const completed = useRef(alreadyWatched);

  const onProgress = useCallback(
    (positionSeconds: number, durationSeconds: number) => {
      void saveWatchProgressAction({ sessionId, positionSeconds, durationSeconds }).then((result) => {
        if (result.ok && result.data.completed && !completed.current) {
          completed.current = true;
          toast.success("Ders kaydını tamamladın", { description: title });
        }
      });
    },
    [sessionId, title],
  );

  if (source.kind !== "file") return <EmbeddedVideo source={source} title={title} />;
  return <TrackedVideo src={source.src} title={title} startAt={startAt} onProgress={onProgress} />;
}
