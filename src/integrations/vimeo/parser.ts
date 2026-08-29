const VIMEO_PATTERNS = [
  /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)(?:[/?#]|$)/,
  /^https?:\/\/(?:www\.)?vimeo\.com\/channels\/[^/]+\/(\d+)(?:[/?#]|$)/,
  /^https?:\/\/(?:www\.)?vimeo\.com\/groups\/[^/]+\/videos\/(\d+)(?:[/?#]|$)/,
  /^https?:\/\/(?:www\.)?vimeo\.com\/album\/\d+\/video\/(\d+)(?:[/?#]|$)/,
  /^https?:\/\/(?:www\.)?vimeo\.com\/video\/(\d+)(?:[/?#]|$)/,
  /^https?:\/\/player\.vimeo\.com\/video\/(\d+)(?:[/?#]|$)/,
];

export function parseVimeoUrl(url: string): { videoId: string } | null {
  for (const pattern of VIMEO_PATTERNS) {
    const match = pattern.exec(url);
    if (match) return { videoId: match[1] };
  }
  return null;
}

export function isVimeoUrl(url: string): boolean {
  return parseVimeoUrl(url) !== null;
}
