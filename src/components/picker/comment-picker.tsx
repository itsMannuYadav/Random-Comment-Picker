"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { ErrorState } from "@/components/picker/error-state";
import { LoadingComments } from "@/components/picker/loading-stages";
import { FilterPanel } from "@/components/picker/filter-panel";
import { WinnerAnimation } from "@/components/picker/winner-animation";
import { WinnerCard } from "@/components/picker/winner-card";
import { Confetti } from "@/components/ui/confetti";
import { applyFilters } from "@/core/comment-engine/pipeline";
import type { DrawFilters } from "@/core/comment-engine/types";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { appConfig } from "@/lib/env";
import { displayNameFor } from "@/lib/display-name";
import type { NormalizedComment, SourceResource } from "@/types/comment";
import type { Platform } from "@/types/platform";
import { PLATFORM_LABEL } from "@/types/platform";
import type { CommentFetchProgress, PlatformAdapter, ResumeState } from "./types";

const WINNER_COUNT_OPTIONS = [1, 2, 3, 5, 10];

interface CommentPickerProps {
  platform: Platform;
  resourceId: string;
  adapter: PlatformAdapter;
  resume?: ResumeState;
}

type Stage = "loading-resource" | "fetching-comments" | "ready" | "drawing" | "revealed" | "error";

export function CommentPicker({ platform, resourceId, adapter, resume }: CommentPickerProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading-resource");
  const [resource, setResource] = useState<SourceResource | null>(null);
  const [comments, setComments] = useState<NormalizedComment[]>([]);
  const [progress, setProgress] = useState<CommentFetchProgress>({ totalFetched: 0, pagesLoaded: 0, label: "Connecting…" });
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const [filters, setFilters] = useState<DrawFilters>(resume?.record.filters ?? { excludeEmpty: true });
  const [winnerCount, setWinnerCount] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [drawWinners, setDrawWinners] = useState<NormalizedComment[] | null>(null);
  const [drawToken, setDrawToken] = useState<string | null>(null);
  const previousWinners = useMemo(() => resume?.record.winners ?? [], [resume]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStage("loading-resource");
        const res = await adapter.fetchResource();
        if (cancelled) return;
        setResource(res);

        setStage("fetching-comments");
        const all = await adapter.fetchComments((p) => !cancelled && setProgress(p));
        if (cancelled) return;
        setComments(all);
        setStage("ready");
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof ClientApiError ? err.message : "Something went wrong loading this post.";
        const code = err instanceof ClientApiError ? err.code : "unknown";
        setError({ message, code });
        setStage("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const { eligible, steps } = useMemo(() => applyFilters(comments, filters), [comments, filters]);
  const eligibleForDraw = useMemo(
    () => eligible.filter((c) => !previousWinners.some((w) => w.id === c.id)),
    [eligible, previousWinners]
  );

  async function handleDraw() {
    if (!resource) return;
    setDrawing(true);
    setStage("drawing");
  }

  async function completeDraw() {
    if (!resource) return;
    try {
      const result = await apiFetch<{ token: string; drawId: string }>("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          sourceId: resourceId,
          sourceUrl: resource.url,
          sourceTitle: resource.title,
          comments,
          filters,
          winnerCount,
          previousWinners,
        }),
      });
      setDrawToken(result.token);
      router.prefetch(`/draw/${result.token}`);

      // Reveal locally first (with confetti) before navigating to the shareable result page.
      const winners = await apiFetch<{ record: { winners: NormalizedComment[] } }>(`/api/draw/${result.token}`);
      setDrawWinners(winners.record.winners.slice(previousWinners.length));
      setStage("revealed");
    } catch (err) {
      const message = err instanceof ClientApiError ? err.message : "We couldn't complete the draw. Please try again.";
      const code = err instanceof ClientApiError ? err.code : "unknown";
      setError({ message, code });
      setStage("error");
    } finally {
      setDrawing(false);
    }
  }

  if (stage === "error" && error) {
    return <ErrorState message={error.message} code={error.code} />;
  }

  if (stage === "loading-resource") {
    return (
      <Card className="flex flex-col items-center gap-3 px-8 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading post…</p>
      </Card>
    );
  }

  if (stage === "fetching-comments") {
    return (
      <div className="flex flex-col gap-4">
        {resource && <ResourceHeader resource={resource} platform={platform} />}
        <LoadingComments progress={progress} />
      </div>
    );
  }

  if (stage === "drawing") {
    return <WinnerAnimation candidates={eligibleForDraw.length > 0 ? eligibleForDraw : comments} onDone={completeDraw} />;
  }

  if (stage === "revealed" && drawWinners) {
    return (
      <div className="flex flex-col gap-6">
        <Confetti />
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Draw complete</p>
          <h2 className="mt-1 text-2xl font-bold">
            {drawWinners.length === 1 ? "We have a winner!" : `${drawWinners.length} winners selected`}
          </h2>
        </div>
        {drawWinners.map((w, i) => (
          <WinnerCard
            key={w.id}
            winner={w}
            platform={platform}
            index={previousWinners.length + i}
            total={previousWinners.length + drawWinners.length}
            shareUrl={drawToken ? `${appConfig.url}/draw/${drawToken}` : undefined}
          />
        ))}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={() => drawToken && router.push(`/draw/${drawToken}`)}>
            View shareable result
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => drawToken && router.push(`?resume=${drawToken}`)}
          >
            Pick another winner
          </Button>
        </div>
      </div>
    );
  }

  // stage === "ready"
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        {resource && <ResourceHeader resource={resource} platform={platform} />}

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tabular-nums">{eligibleForDraw.length.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">eligible entries out of {comments.length.toLocaleString()} comments</p>
            </div>
            <Dices className="h-10 w-10 text-primary/40" />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Number of winners
            </p>
            <div className="flex flex-wrap gap-2">
              {WINNER_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setWinnerCount(n)}
                  className={`h-10 min-w-10 rounded-full border px-3 text-sm font-semibold transition-colors ${
                    winnerCount === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={eligibleForDraw.length < winnerCount || drawing}
            onClick={handleDraw}
          >
            {eligibleForDraw.length < winnerCount
              ? "Not enough eligible entries"
              : `Pick ${winnerCount === 1 ? "a" : winnerCount} Comment${winnerCount > 1 ? "s" : ""}`}
          </Button>
        </Card>

        {previousWinners.length > 0 && (
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Already selected ({previousWinners.length})
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {previousWinners.map((w) => (
                <li key={w.id}>{displayNameFor(w)}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <FilterPanel filters={filters} onChange={setFilters} steps={steps} />
    </div>
  );
}

function ResourceHeader({ resource, platform }: { resource: SourceResource; platform: Platform }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      {resource.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resource.thumbnailUrl}
          alt={resource.title ? `Thumbnail for ${resource.title}` : ""}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <PlatformIcon platform={platform} className="h-14 w-14 shrink-0 text-lg" />
      )}
      <div className="min-w-0">
        <h1 className="truncate font-semibold">{resource.title || resource.url}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{resource.authorName}</span>
          <Badge variant="neutral">{PLATFORM_LABEL[platform]}</Badge>
        </div>
      </div>
    </Card>
  );
}
