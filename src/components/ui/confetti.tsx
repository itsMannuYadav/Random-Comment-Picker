"use client";

import { useState, useSyncExternalStore } from "react";

const COLORS = ["var(--primary)", "var(--accent)", "#33b980", "#4f7cff"];
const PIECES = 40;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  drift: number;
}

function createPieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 2.2 + Math.random() * 1.4,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
    drift: Math.random() > 0.5 ? 40 : -40,
  }));
}

function subscribeNoop() {
  return () => {};
}

/** SSR-safe read of prefers-reduced-motion via useSyncExternalStore (no effect + setState needed). */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  );
}

export function Confetti() {
  const reduced = useReducedMotion();
  const [pieces] = useState(createPieces);

  if (reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-5%",
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 0.4,
            background: piece.color,
            animation: `mycp-confetti-fall-${i % 2} ${piece.duration}s ${piece.delay}s ease-in forwards`,
            transform: `rotate(${piece.rotate}deg)`,
            borderRadius: 2,
          }}
        />
      ))}
      <style>{`
        @keyframes mycp-confetti-fall-0 {
          to { top: 105%; transform: translateX(40px) rotate(720deg); opacity: 0.9; }
        }
        @keyframes mycp-confetti-fall-1 {
          to { top: 105%; transform: translateX(-40px) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
