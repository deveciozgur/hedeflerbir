"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { clamp } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * SVG completion ring. The arc and the number animate together from 0 on mount (easeOut),
 * driven by one motion value outside React's render cycle. Static under reduced motion.
 */
export function ProgressRing({ value, size = 128, strokeWidth = 8, label }: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const pct = clamp(Math.round(value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(reduceMotion ? pct : 0);
  const dashOffset = useTransform(progress, (p) => circumference * (1 - p / 100));
  const display = useTransform(progress, (p) => Math.round(p).toString());

  useEffect(() => {
    if (reduceMotion) {
      progress.set(pct);
      return;
    }
    const controls = animate(progress, pct, { duration: 1.1, ease: EASE_OUT });
    return () => controls.stop();
  }, [pct, progress, reduceMotion]);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-track" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-brand"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <span className="absolute flex items-baseline font-semibold tracking-tight tabular-nums" aria-hidden>
        <motion.span className="text-3xl">{display}</motion.span>
        <span className="text-sm text-muted-foreground">%</span>
      </span>
    </div>
  );
}
