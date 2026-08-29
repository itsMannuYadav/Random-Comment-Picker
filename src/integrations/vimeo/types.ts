export interface VimeoOEmbedResponse {
  video_id: number;
  title: string;
  author_name: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface VimeoDownloadItem {
  quality: string;
  type: string;
  width?: number;
  height?: number;
  size?: number;
  link: string;
}

export interface VimeoApiVideoResponse {
  download?: VimeoDownloadItem[];
}

export class VimeoError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "not-found"
      | "not-a-video"
      | "not-configured"
      | "forbidden"
      | "requires-connection",
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "VimeoError";
  }
}
