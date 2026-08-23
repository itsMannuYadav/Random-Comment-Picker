import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, PlugZap, Eye, KeySquare, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOOL_REGISTRY, isToolOpenable } from "@/config/tools";
import { TOOL_CATEGORIES } from "@/config/categories";
import { appConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "About",
  description:
    "MySocial is a social media creator toolkit — privacy-first media tools, real platform APIs, and a fair, cryptographically verifiable comment picker.",
};

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Privacy-first processing",
    body: "Image, video and audio tools run entirely in your browser via Canvas and WebAssembly. Nothing is uploaded to a server unless the tool genuinely needs to call a platform's API on your behalf.",
  },
  {
    icon: PlugZap,
    title: "Real APIs, never scraping",
    body: "Every platform integration — YouTube, Reddit, Instagram — goes through that platform's official, documented API. No workarounds, no reverse-engineered endpoints, no stolen cookies.",
  },
  {
    icon: Eye,
    title: "Honest about what works",
    body: "A tool that isn't ready says \"Coming soon.\" A tool that needs a connection or a server API key says so, right on its card. Nothing pretends to work when it doesn't.",
  },
  {
    icon: KeySquare,
    title: "Verifiable, not just trusted",
    body: "The Comment Picker uses the Web Crypto API for randomness — never Math.random() — and every draw signs a hash of its exact candidate pool. Anyone can verify a result wasn't tampered with.",
  },
];

export default function AboutPage() {
  const totalTools = TOOL_REGISTRY.length;
  const liveTools = TOOL_REGISTRY.filter((tool) => tool.status === "available").length;
  const openTools = TOOL_REGISTRY.filter((tool) => isToolOpenable(tool.status)).length;
  const categoryCount = TOOL_CATEGORIES.length;

  return (
    <main id="main-content">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-14 pt-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">
          About {appConfig.name}
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          One toolbox, not five open tabs.
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          {appConfig.name} grew out of a single tool — a fair, transparent random comment picker for
          giveaways — into a full creator toolkit. The comment picker is still the flagship; everything
          else was built to the same bar: real, working, and honest about its own limits.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          <Stat value={totalTools} label="tools" />
          <Stat value={liveTools} label="live today" />
          <Stat value={categoryCount} label="categories" />
        </div>

        <Button asChild size="lg" className="mt-2">
          <Link href="/tools">
            Explore all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="border-t border-border/70 bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">How {appConfig.name} works</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            Four rules every tool in this toolkit is built to, without exception.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <Card key={principle.title} className="flex flex-col gap-3 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <principle.icon className="h-5 w-5" />
                </span>
                <p className="font-semibold">{principle.title}</p>
                <p className="text-sm text-muted-foreground">{principle.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">Explore by category</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            {openTools} of {totalTools} tools are open and working right now — the rest are clearly
            marked coming soon.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOL_CATEGORIES.map((category) => (
              <Link key={category.id} href={category.href}>
                <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/40 hover:bg-muted/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <category.icon className="h-5 w-5" />
                  </span>
                  <p className="font-semibold">{category.label}</p>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-muted/30 py-16 text-center">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Built in the open, one tool at a time</h2>
          <p className="mt-3 text-muted-foreground">
            {appConfig.name} is under active development. New tools ship when they&rsquo;re genuinely
            ready — not before. If a platform&rsquo;s official API doesn&rsquo;t support something yet,
            you&rsquo;ll see &ldquo;Coming soon,&rdquo; never a button that quietly does nothing.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">Built by Mannu Yadav.</p>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
