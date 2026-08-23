"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { displayNameFor } from "@/lib/display-name";
import type { NormalizedComment } from "@/types/comment";
import type { Platform } from "@/types/platform";
import { PLATFORM_LABEL } from "@/types/platform";

interface WinnerCardProps {
  winner: NormalizedComment;
  platform: Platform;
  index: number;
  total: number;
  shareUrl?: string;
}

export function WinnerCard({ winner, platform, index, total, shareUrl }: WinnerCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `🎉 Winner: ${displayNameFor(winner)}\n"${winner.text}"`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleShare() {
    if (navigator.share && shareUrl) {
      await navigator.share({ title: "Giveaway winner", url: shareUrl }).catch(() => {});
    } else if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-6 py-3">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={platform} className="h-6 w-6 text-[11px]" />
          <span className="text-sm font-medium text-muted-foreground">{PLATFORM_LABEL[platform]}</span>
        </div>
        {total > 1 && (
          <span className="text-xs font-semibold text-muted-foreground">
            Winner {index + 1} of {total}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          {winner.authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={winner.authorAvatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {(winner.authorName || winner.authorUsername || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold">{winner.authorName || winner.authorUsername || "Unknown"}</p>
            {/* Only a genuinely distinct handle earns a second line — never repeat the name above it. */}
            {winner.authorName && winner.authorUsername && winner.authorUsername !== winner.authorName && (
              <p className="text-sm text-muted-foreground">@{winner.authorUsername}</p>
            )}
          </div>
        </div>

        <p className="text-lg leading-relaxed">&ldquo;{winner.text}&rdquo;</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {winner.permalink && (
            <Button variant="secondary" size="sm" onClick={() => window.open(winner.permalink, "_blank")}>
              <ExternalLink className="h-4 w-4" /> View comment
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy result"}
          </Button>
          {shareUrl && (
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
