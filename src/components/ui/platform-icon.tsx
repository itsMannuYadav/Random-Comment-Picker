import type { IconType } from "react-icons";
import { SiYoutube, SiReddit, SiInstagram, SiThreads, SiFacebook, SiTiktok, SiX } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";
import type { Platform } from "@/types/platform";
import { cn } from "@/lib/cn";

// Real brand marks (Simple Icons / Font Awesome, both MIT-style licensed icon
// sets whose SVGs are the same ones nearly every "integrates with X" badge
// on the web uses) on the platform's own brand color — nominative use to
// identify an integration, not a claim of affiliation or endorsement.
const PLATFORM_STYLE: Record<Platform, { Icon: IconType; bg: string; fg: string }> = {
  youtube: { Icon: SiYoutube, bg: "#FF0000", fg: "#FFFFFF" },
  reddit: { Icon: SiReddit, bg: "#FF4500", fg: "#FFFFFF" },
  instagram: { Icon: SiInstagram, bg: "#C13584", fg: "#FFFFFF" },
  threads: { Icon: SiThreads, bg: "#000000", fg: "#FFFFFF" },
  facebook: { Icon: SiFacebook, bg: "#1877F2", fg: "#FFFFFF" },
  linkedin: { Icon: FaLinkedinIn, bg: "#0A66C2", fg: "#FFFFFF" },
  tiktok: { Icon: SiTiktok, bg: "#000000", fg: "#FFFFFF" },
  x: { Icon: SiX, bg: "#000000", fg: "#FFFFFF" },
};

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const { Icon, bg, fg } = PLATFORM_STYLE[platform];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg", className)}
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      <Icon className="h-[55%] w-[55%]" />
    </span>
  );
}
