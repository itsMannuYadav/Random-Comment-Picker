import type { Platform } from "@/types/platform";
import { cn } from "@/lib/cn";

// Simple monogram badges rather than reproductions of each platform's
// trademarked logo — brand-associated color, initial, done.
const PLATFORM_STYLE: Record<Platform, { label: string; bg: string; fg: string }> = {
  youtube: { label: "YT", bg: "#FF0000", fg: "#FFFFFF" },
  reddit: { label: "R", bg: "#FF4500", fg: "#FFFFFF" },
  instagram: { label: "IG", bg: "#C13584", fg: "#FFFFFF" },
  threads: { label: "@", bg: "#000000", fg: "#FFFFFF" },
  facebook: { label: "f", bg: "#1877F2", fg: "#FFFFFF" },
  linkedin: { label: "in", bg: "#0A66C2", fg: "#FFFFFF" },
  tiktok: { label: "TT", bg: "#000000", fg: "#FFFFFF" },
  x: { label: "X", bg: "#000000", fg: "#FFFFFF" },
};

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const style = PLATFORM_STYLE[platform];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-bold", className)}
      style={{ background: style.bg, color: style.fg }}
      aria-hidden="true"
    >
      <span className="text-[0.55em] tracking-tight">{style.label}</span>
    </span>
  );
}
