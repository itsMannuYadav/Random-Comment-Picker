import "server-only";
import { VimeoError, type VimeoApiVideoResponse, type VimeoOEmbedResponse } from "./types";

const OEMBED_BASE = "https://vimeo.com/api/oembed.json";
const API_BASE = "https://api.vimeo.com";

export async function fetchVimeoOEmbed(videoId: string): Promise<VimeoOEmbedResponse> {
  const url = `${OEMBED_BASE}?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}&width=1920`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (res.status === 404) {
    throw new VimeoError(
      "We couldn't find that Vimeo video. It may have been deleted or set to private.",
      "not-found",
      404,
    );
  }
  if (!res.ok) {
    throw new VimeoError("Something went wrong looking up that Vimeo video.", "not-found", res.status);
  }

  const data = await res.json();
  if (!data?.video_id) {
    throw new VimeoError("That URL doesn't appear to be a Vimeo video.", "not-a-video");
  }
  return data as VimeoOEmbedResponse;
}

export async function fetchVimeoDownloads(
  videoId: string,
  accessToken: string,
): Promise<VimeoApiVideoResponse["download"]> {
  const res = await fetch(`${API_BASE}/videos/${videoId}?fields=download`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    throw new VimeoError(
      "The creator hasn't enabled downloads for this video.",
      "forbidden",
      403,
    );
  }
  if (res.status === 404) {
    throw new VimeoError(
      "We couldn't find that Vimeo video. It may have been deleted or made private.",
      "not-found",
      404,
    );
  }
  if (!res.ok) {
    throw new VimeoError("Vimeo returned an unexpected error. Please try again.", "not-found", res.status);
  }

  const data: VimeoApiVideoResponse = await res.json();

  if (!data.download || data.download.length === 0) {
    throw new VimeoError(
      "The creator hasn't enabled downloads for this video.",
      "forbidden",
      403,
    );
  }

  return data.download;
}
