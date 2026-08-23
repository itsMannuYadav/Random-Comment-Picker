"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { apiFetch } from "@/lib/api-client";
import { PLATFORM_LABEL, PLATFORM_PREFIX, type Platform } from "@/types/platform";
import type { PlatformStatusInfo } from "@/lib/platform-status";

interface DetectResponse {
  platform: Platform | "unknown";
  resourceId?: string;
  message?: string;
  status?: PlatformStatusInfo;
}

export function UrlInput({ showPlatformChips = true }: { showPlatformChips?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setNotice(null);

    try {
      const result = await apiFetch<DetectResponse>("/api/platform/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value.trim() }),
      });

      if (result.platform === "unknown" || !result.resourceId) {
        setNotice(result.message || "That doesn't look like a supported social-media URL.");
        return;
      }

      if (result.status?.status === "coming-soon") {
        setNotice(`${PLATFORM_LABEL[result.platform]}: ${result.status.description}`);
        return;
      }

      const prefix = PLATFORM_PREFIX[result.platform];
      startTransition(() => router.push(`/${prefix}/${result.resourceId}`));
    } catch {
      setNotice("Something went wrong checking that URL. Please try again.");
    }
  }

  return (
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
            aria-label="Post or video URL"
          />
          {value && (
            <button type="button" onClick={() => setValue("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="lg" disabled={pending || !value.trim()} className="w-full sm:w-auto">
          Pick a Comment <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {notice && (
        <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      )}

      {showPlatformChips && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {(["youtube", "reddit", "instagram"] as const).map((p) => (
            <span key={p} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <PlatformIcon platform={p} className="h-4 w-4 text-[8px]" /> {PLATFORM_LABEL[p]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
