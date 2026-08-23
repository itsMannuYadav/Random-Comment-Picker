"use client";

import { useEffect, useRef, useState } from "react";
import { displayNameFor } from "@/lib/display-name";
import type { NormalizedComment } from "@/types/comment";

interface WinnerAnimationProps {
  candidates: NormalizedComment[];
  onDone: () => void;
}

const CYCLE_TOTAL_MS = 1800;

export function WinnerAnimation({ candidates, onDone }: WinnerAnimationProps) {
  const [name, setName] = useState(() => (candidates[0] ? displayNameFor(candidates[0]) : ""));
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || candidates.length === 0) {
      const t = setTimeout(() => doneRef.current(), 500);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    const start = performance.now();

    function tick(now: number) {
      if (cancelled) return;
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / CYCLE_TOTAL_MS);
      // Ease-out: intervals get longer as we approach the end, like a slowing slot reel.
      const intervalAt = 40 + progress * progress * 260;

      setName(displayNameFor(candidates[Math.floor(Math.random() * candidates.length)]));

      if (progress >= 1) {
        doneRef.current();
        return;
      }
      setTimeout(() => requestAnimationFrame(tick), intervalAt);
    }

    const raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [candidates]);

  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Selecting a winner</p>
      <p className="text-4xl font-bold tracking-tight sm:text-5xl">{name}</p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
