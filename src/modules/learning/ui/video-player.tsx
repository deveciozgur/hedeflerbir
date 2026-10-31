"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PROGRESS_SAVE_INTERVAL_MS, type RecordingSource } from "../domain/recording";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const SPEED_KEY = "hedeflerbir-playback-rate";

function readStoredSpeed(): number {
  try {
    const value = Number(localStorage.getItem(SPEED_KEY));
    return (SPEEDS as readonly number[]).includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

export function EmbeddedVideo({ source, title }: { source: Exclude<RecordingSource, { kind: "file" }>; title: string }) {
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

interface TrackedVideoProps {
  src: string;
  title: string;
  startAt: number;
  /** Called every PROGRESS_SAVE_INTERVAL_MS while playing, and on pause / end / tab hide. */
  onProgress: (positionSeconds: number, durationSeconds: number) => void;
  /** Rendered over the video once it ends (e.g. "next lesson" suggestion). */
  endedOverlay?: (dismiss: () => void) => ReactNode;
}

/** Native player with resume, periodic progress saving and a remembered playback speed. */
export function TrackedVideo({ src, title, startAt, onProgress, endedOverlay }: TrackedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(-1);
  const [speed, setSpeed] = useState(1);
  const [ended, setEnded] = useState(false);

  useEffect(() => setSpeed(readStoredSpeed()), []);
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const save = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const position = Math.floor(video.currentTime);
    if (position === lastSaved.current) return;
    lastSaved.current = position;
    onProgress(position, video.duration);
  }, [onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const startTimer = () => {
      setEnded(false);
      clearInterval(timer);
      timer = setInterval(save, PROGRESS_SAVE_INTERVAL_MS);
    };
    const stopAndSave = () => {
      clearInterval(timer);
      save();
    };
    const onEnded = () => {
      stopAndSave();
      setEnded(true);
    };
    const onVisibility = () => document.visibilityState === "hidden" && save();

    video.addEventListener("play", startTimer);
    video.addEventListener("pause", stopAndSave);
    video.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopAndSave();
      video.removeEventListener("play", startTimer);
      video.removeEventListener("pause", stopAndSave);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [save]);

  const changeSpeed = (value: number) => {
    setSpeed(value);
    try {
      localStorage.setItem(SPEED_KEY, String(value));
    } catch {
      // Private mode: the speed simply isn't remembered.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-black">
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
            video.playbackRate = speed;
            // Resume, unless the student had basically reached the end.
            if (startAt > 0 && startAt < video.duration - 10) video.currentTime = startAt;
          }}
        />
        {ended && endedOverlay ? (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 backdrop-blur-sm animate-enter">
            {endedOverlay(() => setEnded(false))}
          </div>
        ) : null}
      </div>
      <div role="group" aria-label="Oynatma hızı" className="flex items-center gap-1 self-end">
        <span className="mr-1 text-xs text-muted-foreground">Hız</span>
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={speed === value}
            onClick={() => changeSpeed(value)}
            className={cn(
              "h-7 rounded-md px-2 font-mono text-xs tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              speed === value ? "bg-chip-active text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {value}x
          </button>
        ))}
      </div>
    </div>
  );
}
