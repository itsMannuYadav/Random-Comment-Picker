"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Copy, Link2, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { cleanUrl, type CleanUrlResult } from "@/lib/url/clean";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("url-cleaner");

export default function UrlCleanerPage() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CleanUrlResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    const cleaned = cleanUrl(value);
    if (!cleaned) {
      setResult(null);
      setNotice("That doesn't look like a valid URL.");
      return;
    }
    setNotice(null);
    setResult(cleaned);
  }

  function copyClean() {
    if (!result) return;
    navigator.clipboard.writeText(result.clean).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.social.href} className="hover:text-foreground">Social</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">URL Cleaner</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">URL Cleaner</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Strip tracking parameters (utm_*, fbclid, gclid and more) from a URL. Only known
          tracking params are removed — anything that could change what the link points to is
          left alone.
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
                placeholder="Paste a URL to clean"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="URL to clean"
              />
              {value && (
                <button type="button" onClick={() => setValue("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" disabled={!value.trim()} className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4" /> Clean
            </Button>
          </form>

          {notice && (
            <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          )}
        </div>
      </section>

      {result && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <Card className="flex flex-col gap-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{result.original}</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clean</p>
              <p className="mt-1 break-all text-sm font-medium">{result.clean}</p>
            </div>
            {result.removedParams.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Removed: {result.removedParams.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No tracking parameters found.</p>
            )}
            <Button variant="secondary" className="w-full sm:w-auto" onClick={copyClean}>
              <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy clean URL"}
            </Button>
          </Card>
        </section>
      )}

      {related.length > 0 && (
        <section className="border-t border-border/70 bg-muted/30 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
