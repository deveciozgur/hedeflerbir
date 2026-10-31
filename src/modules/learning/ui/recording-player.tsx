"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveWatchProgressAction } from "../application/learning.actions";
import { PROGRESS_SAVE_INTERVAL_MS, type RecordingSource } from "../domain/recording";

interface RecordingPlayerProps {
  sessionId: string;
  title: string;
  source: RecordingSource;
  startAt: number;
  alreadyWatched: boolean;
}

/** Native player for file recordings (with resume + progress tracking) or an embed for YouTube/Vimeo. */
export function RecordingPlayer({ sessionId, title, source, startAt, alreadyWatched }: RecordingPlayerProps) {
  if (source.kind !== "file") {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border bg-black">
        <iframe
          src={source.embedUrl}
          title={title}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  return <TrackedVideo sessionId={sessionId} title={title} src={source.src} startAt={startAt} alreadyWatched={alreadyWatched} />;
}

function TrackedVideo({ sessionId, title, src, startAt, alreadyWatched }: Omit<RecordingPlayerProps, "source"> & { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(-1);
  const completed = useRef(alreadyWatched);

  const save = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const position = Math.floor(video.currentTime);
    if (position === lastSaved.current) return;
    lastSaved.current = position;

    void saveWatchProgressAction({ sessionId, positionSeconds: position, durationSeconds: video.duration }).then((result) => {
      if (result.ok && result.data.completed && !completed.current) {
        completed.current = true;
        toast.success("Ders kaydını tamamladın", { description: title });
      }
    });
  }, [sessionId, title]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(save, PROGRESS_SAVE_INTERVAL_MS);
    };
    const stopAndSave = () => {
      clearInterval(timer);
      save();
    };
    const onVisibility = () => document.visibilityState === "hidden" && save();

    video.addEventListener("play", startTimer);
    video.addEventListener("pause", stopAndSave);
    video.addEventListener("ended", stopAndSave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopAndSave();
      video.removeEventListener("play", startTimer);
      video.removeEventListener("pause", stopAndSave);
      video.removeEventListener("ended", stopAndSave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [save]);

  return (
    <div className="aspect-video overflow-hidden rounded-xl border bg-black">
      <video
        ref={videoRef}
        src={src}
        controls
        preload="metadata"
        playsInline
        aria-label={title}
        className="size-full"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          // Resume, unless the student had basically reached the end.
          if (startAt > 0 && startAt < video.duration - 10) video.currentTime = startAt;
        }}
      />
    </div>
  );
}
