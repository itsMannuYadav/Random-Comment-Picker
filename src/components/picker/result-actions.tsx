"use client";

import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DrawRecord } from "@/core/verification/types";

function toCsv(record: DrawRecord): string {
  const header = ["Winner", "Username", "Comment", "Platform", "Draw ID", "Date"];
  const rows = record.winners.map((w) => [
    w.authorName ?? "",
    w.authorUsername ?? "",
    w.text.replace(/"/g, '""'),
    record.platform,
    record.id,
    record.createdAt,
  ]);
  return [header, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
}

export function ResultActions({ record, shareUrl }: { record: DrawRecord; shareUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  }

  function download() {
    const blob = new Blob([toCsv(record)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Giveaway result", url: shareUrl }).catch(() => {});
    } else {
      await copy("share", shareUrl);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => copy("link", shareUrl)}>
        {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy link
      </Button>
      <Button variant="secondary" size="sm" onClick={share}>
        <Share2 className="h-4 w-4" /> Share
      </Button>
      <Button variant="secondary" size="sm" onClick={download}>
        <Download className="h-4 w-4" /> Download CSV
      </Button>
    </div>
  );
}
