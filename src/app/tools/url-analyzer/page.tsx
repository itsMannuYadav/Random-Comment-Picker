"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Link2, Loader2, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/ui/tool-card";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { getToolById } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";
import { PLATFORM_LABEL, type Platform } from "@/types/platform";
import type { PlatformStatusInfo } from "@/lib/platform-status";
import type { SourceResource } from "@/types/comment";

interface DetectResponse {
  platform: Platform | "unknown";
  resourceId?: string;
  message?: string;
  status?: PlatformStatusInfo;
}

type Stage = "idle" | "working" | "done";

// Every platform we actually have a resource-metadata endpoint for today.
const RESOURCE_ENDPOINT: Partial<Record<Platform, (id: string) => string>> = {
  youtube: (id) => `/api/youtube/video?videoId=${encodeURIComponent(id)}`,
  reddit: (id) => `/api/reddit/post?postId=${encodeURIComponent(id)}`,
  instagram: (id) => `/api/instagram/media?mediaId=${encodeURIComponent(id)}`,
};

// The routed short-link picker page for each platform, when one exists.
const PICKER_PREFIX: Partial<Record<Platform, string>> = { youtube: "y", reddit: "r", instagram: "i" };

// Registry tool ids relevant to each platform, whether or not they're live yet.
const PLATFORM_TOOL_IDS: Partial<Record<Platform, string[]>> = {
  youtube: ["comment-picker", "thumbnail-downloader"],
  reddit: ["comment-picker"],
  instagram: ["comment-picker"],
};

export default function UrlAnalyzerPage() {
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectResponse | null>(null);
  const [resource, setResource] = useState<SourceResource | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;

    setNotice(null);
    setResource(null);
    setResourceError(null);
    setDetected(null);
    setStage("working");
    setStatusLabel("Detecting platform…");

    try {
      const det = await apiFetch<DetectResponse>("/api/platform/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value.trim() }),
      });

      if (det.platform === "unknown" || !det.resourceId) {
        setStage("idle");
        setNotice(det.message || "That doesn't look like a supported social-media URL.");
        return;
      }
      setDetected(det);

      const endpoint = RESOURCE_ENDPOINT[det.platform];
      if (!endpoint) {
        setStage("done");
        return;
      }

      setStatusLabel("Reading metadata…");
      try {
        const res = await apiFetch<SourceResource>(endpoint(det.resourceId));
        setResource(res);
      } catch (err) {
        setResourceError(err instanceof ClientApiError ? err.message : "Couldn't read metadata for this URL.");
      }
      setStage("done");
    } catch {
      setStage("idle");
      setNotice("Something went wrong checking that URL. Please try again.");
    }
  }

  const relatedToolIds = detected && detected.platform !== "unknown" ? PLATFORM_TOOL_IDS[detected.platform] ?? [] : [];
  const pickerPrefix = detected && detected.platform !== "unknown" ? PICKER_PREFIX[detected.platform] : undefined;

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.social.href} className="hover:text-foreground">
          Social
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Social URL Analyzer</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Social URL Analyzer</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Paste any supported social URL to see its platform, available metadata, and the MySocial tools
          that work with it.
        </p>

        <div className="mx-auto w-full max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-3 px-3 py-2">
              <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Paste a YouTube, Reddit or Instagram URL"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Social URL"
              />
              {value && (
                <button type="button" onClick={() => setValue("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" disabled={stage === "working" || !value.trim()} className="w-full sm:w-auto">
              {stage === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analyze
            </Button>
          </form>

          {stage === "working" && statusLabel && (
            <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
              {statusLabel}
            </p>
          )}
          {notice && (
            <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          )}
        </div>
      </section>

      {stage === "done" && detected && detected.platform !== "unknown" && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <PlatformIcon platform={detected.platform} className="h-9 w-9 text-sm" />
              <div>
                <p className="font-semibold">{PLATFORM_LABEL[detected.platform]}</p>
                <p className="text-xs text-muted-foreground">Resource ID: {detected.resourceId}</p>
              </div>
              {detected.status && (
                <Badge variant={detected.status.status === "available" ? "success" : "neutral"} className="ml-auto">
                  {detected.status.label}
                </Badge>
              )}
            </div>

            {resource && (
              <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row">
                {resource.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resource.thumbnailUrl}
                    alt=""
                    className="h-24 w-24 shrink-0 self-start rounded-lg border border-border object-cover"
                  />
                )}
                <dl className="grid flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  {resource.title && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</dt>
                      <dd className="mt-0.5">{resource.title}</dd>
                    </div>
                  )}
                  {resource.authorName && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {detected.platform === "youtube" ? "Channel" : "Author"}
                      </dt>
                      <dd className="mt-0.5">{resource.authorName}</dd>
                    </div>
                  )}
                  {resource.commentCount !== undefined && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</dt>
                      <dd className="mt-0.5">{resource.commentCount.toLocaleString()}</dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL</dt>
                    <dd className="mt-0.5 truncate">
                      <a href={resource.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {resource.url}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {resourceError && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">{resourceError}</p>
              </div>
            )}

            {!resource && !resourceError && detected.status && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">{detected.status.description}</p>
              </div>
            )}
          </Card>

          {(relatedToolIds.length > 0 || pickerPrefix) && (
            <div className="mt-8">
              <h2 className="text-lg font-bold tracking-tight">Available Tools</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pickerPrefix && (
                  <a href={`/${pickerPrefix}/${detected.resourceId}`} className="block h-full">
                    <Card className="flex h-full flex-col gap-2 p-5 transition-colors hover:border-primary/40 hover:bg-muted/40">
                      <p className="font-semibold">Open in Comment Picker</p>
                      <p className="text-sm text-muted-foreground">
                        Jump straight into picking a winner from this post&rsquo;s comments.
                      </p>
                    </Card>
                  </a>
                )}
                {relatedToolIds
                  .filter((id) => id !== "comment-picker")
                  .map((id) => {
                    const tool = getToolById(id);
                    return tool ? <ToolCard key={id} tool={tool} /> : null;
                  })}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
