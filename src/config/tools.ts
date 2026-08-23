import type { LucideIcon } from "lucide-react";
import {
  Dices,
  MessageSquareText,
  Eraser,
  ImageDown,
  ScanEye,
  ImageMinus,
  RefreshCcw,
  Crop,
  LayoutTemplate,
  Film,
  Scissors,
  Clapperboard,
  FileVideo,
  Smartphone,
  AudioLines,
  Waves,
  FileAudio,
  Link2,
  Eraser as BroomIcon,
  FileSearch,
  UserRoundPlus,
  Captions,
  Type,
  Hash,
  Anchor,
  AlignLeft,
  Reply,
  Bot,
  QrCode,
  Info,
} from "lucide-react";
import { type ToolCategoryId, CATEGORY_BY_ID } from "@/config/categories";

export type ToolStatus = "available" | "beta" | "coming-soon";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategoryId;
  icon: LucideIcon;
  href: string;
  status: ToolStatus;
  popular?: boolean;
  keywords?: string[];
}

/**
 * Central tool registry — the single source of truth the homepage, `/tools`,
 * category pages, search and the command palette all consume. Only flip a
 * tool's `status` to `"available"` once its route actually works end to end
 * (see planning doc §91/§92 — no fake features, no fake success states).
 */
export const TOOL_REGISTRY: ToolDefinition[] = [
  // Engage
  {
    id: "comment-picker",
    name: "Comment Picker",
    description: "Pick random giveaway winners from YouTube, Reddit and Instagram comments.",
    category: "engage",
    icon: Dices,
    href: "/tools/comment-picker",
    status: "available",
    popular: true,
    keywords: ["giveaway", "winner", "random", "draw", "youtube", "reddit", "instagram"],
  },
  {
    id: "comment-counter",
    name: "Comment Counter",
    description: "Count comments on a post using the platform's official API.",
    category: "engage",
    icon: MessageSquareText,
    href: "/tools/comment-counter",
    status: "coming-soon",
    keywords: ["comments", "count", "stats"],
  },
  {
    id: "comment-cleaner",
    name: "Comment Cleaner",
    description: "Normalize and export comments for use outside MySocial.",
    category: "engage",
    icon: Eraser,
    href: "/tools/comment-cleaner",
    status: "coming-soon",
    keywords: ["comments", "export", "clean"],
  },

  // Images
  {
    id: "thumbnail-downloader",
    name: "Thumbnail Downloader",
    description: "Download the highest available thumbnail from a YouTube video.",
    category: "images",
    icon: ImageDown,
    href: "/tools/thumbnail-downloader",
    status: "available",
    popular: true,
    keywords: ["thumbnail", "youtube", "download", "image"],
  },
  {
    id: "thumbnail-checker",
    name: "Thumbnail Checker",
    description: "Check an image's dimensions, format and quality against thumbnail specs.",
    category: "images",
    icon: ScanEye,
    href: "/tools/thumbnail-checker",
    status: "coming-soon",
    keywords: ["thumbnail", "quality", "dimensions"],
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Shrink JPG, PNG and WebP images without leaving your browser.",
    category: "images",
    icon: ImageMinus,
    href: "/tools/image-compressor",
    status: "available",
    popular: true,
    keywords: ["compress", "image", "optimize", "size"],
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert between PNG, JPG and WebP.",
    category: "images",
    icon: RefreshCcw,
    href: "/tools/image-converter",
    status: "available",
    keywords: ["convert", "image", "format"],
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize and crop images to exact dimensions or social presets.",
    category: "images",
    icon: Crop,
    href: "/tools/image-resizer",
    status: "available",
    keywords: ["resize", "crop", "image"],
  },
  {
    id: "social-image-resizer",
    name: "Social Image Resizer",
    description: "Presets for Instagram, YouTube, LinkedIn, X and Facebook image sizes.",
    category: "images",
    icon: LayoutTemplate,
    href: "/tools/social-image-resizer",
    status: "coming-soon",
    keywords: ["resize", "social", "instagram", "preset"],
  },

  // Video
  {
    id: "video-to-thumbnail",
    name: "Video → Thumbnail",
    description: "Grab a still frame from any point in a video you upload.",
    category: "video",
    icon: Film,
    href: "/tools/video-to-thumbnail",
    status: "available",
    keywords: ["video", "thumbnail", "frame"],
  },
  {
    id: "frame-extractor",
    name: "Frame Extractor",
    description: "Export frames from an uploaded video at a chosen interval.",
    category: "video",
    icon: Scissors,
    href: "/tools/frame-extractor",
    status: "coming-soon",
    keywords: ["video", "frames", "extract"],
  },
  {
    id: "video-compressor",
    name: "Video Compressor",
    description: "Reduce the file size of a video you upload.",
    category: "video",
    icon: Clapperboard,
    href: "/tools/video-compressor",
    status: "coming-soon",
    keywords: ["compress", "video", "size"],
  },
  {
    id: "video-converter",
    name: "Video Converter",
    description: "Convert between MP4, WebM and GIF.",
    category: "video",
    icon: FileVideo,
    href: "/tools/video-converter",
    status: "coming-soon",
    keywords: ["convert", "video", "format"],
  },
  {
    id: "video-to-gif",
    name: "Video → GIF",
    description: "Turn a clip into a GIF with a custom time range and frame rate.",
    category: "video",
    icon: Film,
    href: "/tools/video-to-gif",
    status: "available",
    popular: true,
    keywords: ["gif", "video", "convert"],
  },
  {
    id: "social-video-resizer",
    name: "Social Video Resizer",
    description: "Reframe one video for YouTube Shorts, Reels, TikTok and more.",
    category: "video",
    icon: Smartphone,
    href: "/tools/social-video-resizer",
    status: "coming-soon",
    keywords: ["video", "resize", "reels", "shorts", "tiktok"],
  },

  // Audio
  {
    id: "audio-converter",
    name: "Audio Converter",
    description: "Convert between MP3, WAV and OGG.",
    category: "audio",
    icon: AudioLines,
    href: "/tools/audio-converter",
    status: "available",
    keywords: ["audio", "convert", "format"],
  },
  {
    id: "audio-compressor",
    name: "Audio Compressor",
    description: "Reduce the file size of an audio file you upload.",
    category: "audio",
    icon: Waves,
    href: "/tools/audio-compressor",
    status: "available",
    keywords: ["audio", "compress", "size"],
  },
  {
    id: "audio-metadata",
    name: "Audio Metadata",
    description: "Inspect the duration, sample rate and channel count of an audio file.",
    category: "audio",
    icon: FileAudio,
    href: "/tools/audio-metadata",
    status: "available",
    keywords: ["audio", "metadata", "tags"],
  },

  // Social
  {
    id: "url-analyzer",
    name: "Social URL Analyzer",
    description: "Paste any supported social URL and see its metadata and available tools.",
    category: "social",
    icon: FileSearch,
    href: "/tools/url-analyzer",
    status: "available",
    popular: true,
    keywords: ["url", "analyze", "metadata"],
  },
  {
    id: "url-cleaner",
    name: "URL Cleaner",
    description: "Strip tracking parameters from a social or video URL.",
    category: "social",
    icon: Link2,
    href: "/tools/url-cleaner",
    status: "available",
    keywords: ["url", "clean", "tracking", "utm"],
  },
  {
    id: "social-metadata",
    name: "Social Metadata",
    description: "View title, author, thumbnail and stats for a supported URL.",
    category: "social",
    icon: BroomIcon,
    href: "/tools/social-metadata",
    status: "coming-soon",
    keywords: ["metadata", "social", "info"],
  },
  {
    id: "social-links",
    name: "Social Link Generator",
    description: "Generate profile links for a username across supported platforms.",
    category: "social",
    icon: UserRoundPlus,
    href: "/tools/social-links",
    status: "available",
    keywords: ["profile", "links", "username"],
  },

  // Creator
  {
    id: "caption-generator",
    name: "Caption Generator",
    description: "Generate a caption, hashtags and a call-to-action for your post.",
    category: "creator",
    icon: Captions,
    href: "/tools/caption-generator",
    status: "coming-soon",
    keywords: ["caption", "ai", "social"],
  },
  {
    id: "title-generator",
    name: "Title Generator",
    description: "Generate YouTube title concepts for a topic.",
    category: "creator",
    icon: Type,
    href: "/tools/title-generator",
    status: "coming-soon",
    keywords: ["title", "youtube", "ai"],
  },
  {
    id: "hashtag-generator",
    name: "Hashtag Generator",
    description: "Get relevant hashtag suggestions for your content.",
    category: "creator",
    icon: Hash,
    href: "/tools/hashtag-generator",
    status: "coming-soon",
    keywords: ["hashtag", "social", "ai"],
  },
  {
    id: "hook-generator",
    name: "Hook Generator",
    description: "Generate opening hooks for a video or post.",
    category: "creator",
    icon: Anchor,
    href: "/tools/hook-generator",
    status: "coming-soon",
    keywords: ["hook", "script", "ai"],
  },
  {
    id: "description-generator",
    name: "Description Generator",
    description: "Generate a YouTube or social post description.",
    category: "creator",
    icon: AlignLeft,
    href: "/tools/description-generator",
    status: "coming-soon",
    keywords: ["description", "youtube", "ai"],
  },
  {
    id: "comment-reply-generator",
    name: "Comment Reply Generator",
    description: "Get suggested replies to a comment.",
    category: "creator",
    icon: Reply,
    href: "/tools/comment-reply-generator",
    status: "coming-soon",
    keywords: ["reply", "comment", "ai"],
  },

  // AI
  {
    id: "ai-tools",
    name: "AI Creator Tools",
    description: "Provider-agnostic AI tools for captions, titles and more.",
    category: "ai",
    icon: Bot,
    href: "/tools/ai",
    status: "coming-soon",
    keywords: ["ai", "generate"],
  },

  // Utilities
  {
    id: "qr-generator",
    name: "QR Generator",
    description: "Generate a QR code for a link, video or MySocial tool.",
    category: "utilities",
    icon: QrCode,
    href: "/tools/qr-generator",
    status: "available",
    popular: true,
    keywords: ["qr", "code", "generate"],
  },
  {
    id: "file-info",
    name: "File Information",
    description: "Inspect a file's format, size and basic metadata.",
    category: "utilities",
    icon: Info,
    href: "/tools/file-info",
    status: "coming-soon",
    keywords: ["file", "metadata", "info"],
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: ToolCategoryId): ToolDefinition[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category);
}

export function getPopularTools(): ToolDefinition[] {
  return TOOL_REGISTRY.filter((tool) => tool.popular);
}

/**
 * Related tools for a tool detail page: fills from the same category first,
 * then tops up with popular tools from elsewhere so every page has content.
 */
export function getRelatedTools(id: string, limit = 3): ToolDefinition[] {
  const tool = getToolById(id);
  if (!tool) return [];

  const sameCategory = TOOL_REGISTRY.filter((t) => t.id !== id && t.category === tool.category);
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const others = TOOL_REGISTRY.filter((t) => t.id !== id && t.category !== tool.category && t.popular);
  return [...sameCategory, ...others].slice(0, limit);
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return TOOL_REGISTRY.filter((tool) => {
    const category = CATEGORY_BY_ID[tool.category];
    const haystack = [
      tool.name,
      tool.description,
      category.label,
      ...(tool.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
