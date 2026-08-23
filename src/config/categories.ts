import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Music,
  Share2,
  Wand2,
  Bot,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ToolCategoryId =
  | "engage"
  | "images"
  | "video"
  | "audio"
  | "social"
  | "creator"
  | "ai"
  | "utilities";

export interface ToolCategoryDefinition {
  id: ToolCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

/** Central category taxonomy — every tool in the registry must reference one of these. */
export const TOOL_CATEGORIES: ToolCategoryDefinition[] = [
  {
    id: "engage",
    label: "Engage",
    description: "Run fair giveaways and manage comments from your audience.",
    icon: Sparkles,
    href: "/tools/engage",
  },
  {
    id: "images",
    label: "Images",
    description: "Download, compress, convert and resize images for every platform.",
    icon: ImageIcon,
    href: "/tools/images",
  },
  {
    id: "video",
    label: "Video",
    description: "Compress, convert and extract from video — thumbnails, GIFs and more.",
    icon: Video,
    href: "/tools/video",
  },
  {
    id: "audio",
    label: "Audio",
    description: "Convert, compress and inspect audio for your uploads.",
    icon: Music,
    href: "/tools/audio",
  },
  {
    id: "social",
    label: "Social",
    description: "Analyze URLs, clean tracking params and generate profile links.",
    icon: Share2,
    href: "/tools/social",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Captions, titles, hashtags and hooks for your next post.",
    icon: Wand2,
    href: "/tools/creator",
  },
  {
    id: "ai",
    label: "AI",
    description: "AI-assisted creator workflows, provider-agnostic under the hood.",
    icon: Bot,
    href: "/tools/ai",
  },
  {
    id: "utilities",
    label: "Utilities",
    description: "QR codes, file info and other everyday creator utilities.",
    icon: Wrench,
    href: "/tools/utilities",
  },
];

export const CATEGORY_BY_ID: Record<ToolCategoryId, ToolCategoryDefinition> = Object.fromEntries(
  TOOL_CATEGORIES.map((category) => [category.id, category])
) as Record<ToolCategoryId, ToolCategoryDefinition>;
