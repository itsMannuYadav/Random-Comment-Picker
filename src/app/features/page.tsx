import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Dices } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { getToolsByCategory } from "@/config/tools";
import { TOOL_CATEGORIES, type ToolCategoryId } from "@/config/categories";
import { appConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything MySocial can do, category by category — how each part of the toolkit actually works.",
};

const FLAGSHIP_FEATURES = [
  "Real comments via YouTube, Reddit and Instagram's official APIs — never scraped",
  "Filters: keywords, hashtags, blocked words, date range, one entry per person, and more",
  "Cryptographically secure randomness (Web Crypto API) — never Math.random()",
  "Every draw is HMAC-signed and independently verifiable at its own shareable link",
];

// How each category's tools actually work, mechanically — the thing a plain
// icon grid can't convey. Categories with zero shipped tools yet (e.g. AI,
// which only holds architecture right now) are skipped rather than shown
// with nothing behind them.
const CATEGORY_MECHANISM: Partial<Record<ToolCategoryId, string>> = {
  engage: "Fetches through each platform's official API, then draws winners with cryptographically secure randomness — every result is independently verifiable.",
  images: "Runs entirely in your browser via the Canvas API. Nothing is uploaded — your files never leave your device.",
  video: "Processed client-side via WebAssembly (a real ffmpeg build compiled to run in the browser) and native video decoding — no upload, no server queue.",
  audio: "Converted and compressed client-side via WebAssembly; metadata is read straight from the file's own headers, never guessed from a resampled value.",
  social: "Works from the URL you paste — no login, no scraping, using each platform's official API only where real data is actually needed.",
  creator: "Real AI-generated text via a connected provider. If no provider is configured, the tool says so plainly — never a fake result.",
  utilities: "Generated instantly, entirely client-side — no upload, no waiting.",
};

export default function FeaturesPage() {
  const categoriesWithTools = TOOL_CATEGORIES.filter((category) => getToolsByCategory(category.id).length > 0);

  return (
    <main id="main-content">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-14 pt-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">
          Features
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Everything {appConfig.name} can do.
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Not a list of buttons — a look at how each part of the toolkit actually works, and why it can
          be trusted to do what it says.
        </p>
      </section>

      <section className="border-t border-border/70 bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="grid grid-cols-1 gap-8 p-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Flagship
              </span>
              <h2 className="text-2xl font-bold tracking-tight">Comment Picker</h2>
              <p className="text-muted-foreground">
                The tool {appConfig.name} was built around: a fair, transparent way to pick giveaway
                winners that doesn&rsquo;t ask anyone to just trust the result.
              </p>
              <ul className="flex flex-col gap-2.5">
                {FLAGSHIP_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-2 w-fit">
                <Link href="/tools/comment-picker">
                  Open Comment Picker <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <span className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Dices className="h-12 w-12" />
            </span>
          </Card>
        </div>
      </section>

      {categoriesWithTools.map((category, i) => {
        const tools = getToolsByCategory(category.id);
        const preview = tools.slice(0, 3);
        const remaining = tools.length - preview.length;

        return (
          <section key={category.id} className={i % 2 === 0 ? "py-16" : "border-t border-border/70 bg-muted/30 py-16"}>
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <category.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{category.label}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <Link href={category.href} className="shrink-0 text-sm font-medium text-primary hover:underline">
                  View all {tools.length} →
                </Link>
              </div>

              {CATEGORY_MECHANISM[category.id] && (
                <p className="mt-5 max-w-3xl text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">How it works: </span>
                  {CATEGORY_MECHANISM[category.id]}
                </p>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {preview.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
              {remaining > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  +{remaining} more in{" "}
                  <Link href={category.href} className="font-medium text-primary hover:underline">
                    {category.label}
                  </Link>
                </p>
              )}
            </div>
          </section>
        );
      })}

      <section className="border-t border-border/70 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight">See it all in one place</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Search, filter and browse every tool — including what&rsquo;s coming next.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/tools">
              Browse all tools <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/about">Read about {appConfig.name} →</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
