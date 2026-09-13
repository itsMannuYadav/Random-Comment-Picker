"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Copy, ExternalLink, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { sanitizeUsername, generateProfileLinks } from "@/lib/social/profile-links";
import type { Platform } from "@/types/platform";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("social-links");

export default function SocialLinksPage() {
  const [value, setValue] = useState("");
  const [links, setLinks] = useState<{ id: string; label: string; url: string }[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = sanitizeUsername(value);
    if (!username) {
      setLinks(null);
      setNotice("Enter a username with no spaces.");
      return;
    }
    setNotice(null);
    setLinks(generateProfileLinks(username));
  }

  function copyUrl(id: string, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
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
        <span className="text-foreground">Social Link Generator</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Social Link Generator</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Enter a username to generate profile links across supported platforms. These are just
          URL patterns - we don&rsquo;t check whether the account actually exists.
        </p>

        <div className="mx-auto w-full max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-3 px-3 py-2">
              <User className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="username"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Username"
              />
            </div>
            <Button type="submit" size="lg" disabled={!value.trim()} className="w-full sm:w-auto">
              Generate Links
            </Button>
          </form>

          {notice && (
            <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          )}
        </div>
      </section>

      {links && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Card key={link.id} className="flex items-center gap-4 p-4">
                <PlatformIcon platform={link.id as Platform} className="h-10 w-10 shrink-0 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{link.label}</p>
                  <p className="truncate text-sm text-muted-foreground">{link.url}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyUrl(link.id, link.url)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{copiedId === link.id ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
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
