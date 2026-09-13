"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ExternalLink, Info, Link2, Loader2, MessageSquare, Search, User, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/ui/tool-card";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { getToolById, getRelatedTools } from "@/config/tools";
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

type Stage = "idle" | "detecting" | "fetching" | "done" | "error";

const RESOURCE_ENDPOINT: Partial<Record<Platform, (id: string) => string>> = {
  youtube: (id) => `/api/youtube/video?videoId=${encodeURIComponent(id)}`,
  reddit: (id) => `/api/reddit/post?postId=${encodeURIComponent(id)}`,
  instagram: (id) => `/api/instagram/media?mediaId=${encodeURIComponent(id)}`,
};

const PLATFORM_TOOL_IDS: Partial<Record<Platform, string[]>> = {
  youtube: ["comment-picker", "thumbnail-downloader"],
  reddit: ["comment-picker", "video-downloader"],
  instagram: ["comment-picker"],
};

const PICKER_PREFIX: Partial<Record<Platform, string>> = { youtube: "y", reddit: "r", instagram: "i" };

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

function SocialMetadataPageInner() {
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectResponse | null>(null);
  const [resource, setResource] = useState<SourceResource | null>(null);

  async function lookup(rawUrl: string) {
    setNotice(null);
    setResource(null);
    setDetected(null);
    setStage("detecting");

    try {
      const det = await apiFetch<DetectResponse>("/api/platform/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl.trim() }),
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

      setStage("fetching");
      try {
        const res = await apiFetch<SourceResource>(endpoint(det.resourceId));
        setResource(res);
      } catch (err) {
        setNotice(err instanceof ClientApiError ? err.message : "Couldn't fetch metadata for that URL.");
      }
      setStage("done");
    } catch {
      setStage("error");
      setNotice("Something went wrong. Please try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    lookup(value);
  }

  useEffect(() => {
    const prefill = searchParams.get("url");
    if (!prefill) return;
    queueMicrotask(() => {
      setValue(prefill);
      lookup(prefill);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = stage === "detecting" || stage === "fetching";
  const relatedToolIds =
    detected && detected.platform !== "unknown" ? PLATFORM_TOOL_IDS[detected.platform] ?? [] : [];
  const pickerPrefix =
    detected && detected.platform !== "unknown" ? PICKER_PREFIX[detected.platform] : undefined;

  const relatedTools = getRelatedTools("social-metadata");


  return (
    <main id="main-content">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6"
      >
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.social.href} className="hover:text-foreground">Social</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Social Metadata</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Social Metadata</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Paste a YouTube, Reddit or Instagram URL to instantly preview its title, author, thumbnail and
          stats - no login required.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-3 px-3 py-2">
            <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste a YouTube, Reddit or Instagram URL"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="Social URL"
              autoFocus
            />
            {value && (
              <button type="button" onClick={() => setValue("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="lg" disabled={busy || !value.trim()} className="w-full sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {stage === "detecting" ? "Detecting…" : stage === "fetching" ? "Loading…" : "Look up"}
          </Button>
        </form>

        {notice && (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        )}
      </section>

      {stage === "done" && detected && detected.platform !== "unknown" && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          {resource ? (
            <Card className="overflow-hidden p-0">
              {resource.thumbnailUrl && (
                <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-64">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title ?? "Thumbnail"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="neutral" className="flex items-center gap-1.5 bg-black/60 text-white backdrop-blur">
                      <PlatformIcon platform={detected.platform} className="h-3.5 w-3.5 text-xs" />
                      {PLATFORM_LABEL[detected.platform]}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-5 p-6">
                {!resource.thumbnailUrl && (
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={detected.platform} className="h-7 w-7 text-sm" />
                    <Badge variant="neutral">{PLATFORM_LABEL[detected.platform]}</Badge>
                  </div>
                )}

                {resource.title && (
                  <h2 className="text-xl font-bold leading-snug">{resource.title}</h2>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {resource.authorName && (
                    <StatCard
                      icon={<User className="h-4 w-4" />}
                      label={detected.platform === "youtube" ? "Channel" : "Author"}
                      value={resource.authorName}
                    />
                  )}
                  {resource.commentCount !== undefined && (
                    <StatCard
                      icon={<MessageSquare className="h-4 w-4" />}
                      label="Comments"
                      value={resource.commentCount}
                    />
                  )}
                  {resource.authorUsername && resource.authorUsername !== resource.authorName && (
                    <StatCard
                      icon={<Info className="h-4 w-4" />}
                      label="Username"
                      value={`@${resource.authorUsername}`}
                    />
                  )}
                </div>

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View original
                </a>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={detected.platform} className="h-9 w-9 text-sm" />
                <div>
                  <p className="font-semibold">{PLATFORM_LABEL[detected.platform]}</p>
                  <p className="text-xs text-muted-foreground">ID: {detected.resourceId}</p>
                </div>
              </div>
              {detected.status && (
                <p className="mt-4 text-sm text-muted-foreground">{detected.status.description}</p>
              )}
            </Card>
          )}

          {(relatedToolIds.length > 0 || pickerPrefix) && (
            <div className="mt-8">
              <h2 className="text-lg font-bold tracking-tight">Use this URL with</h2>
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

      {stage === "idle" && relatedTools.length > 0 && (
        <section className="border-t border-border/70 bg-muted/30 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {relatedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function SocialMetadataPage() {
  return (
    <Suspense fallback={null}>
      <SocialMetadataPageInner />
    </Suspense>
  );
}
