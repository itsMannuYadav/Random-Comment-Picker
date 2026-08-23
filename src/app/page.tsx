import Link from "next/link";
import { Filter, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { UrlInput } from "@/components/home/url-input";
import { PlatformStatusBadge } from "@/components/home/platform-status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCredentialStatus } from "@/lib/env.server";
import { PLATFORM_STATUS } from "@/lib/platform-status";
import { ALL_PLATFORMS, PLATFORM_LABEL } from "@/types/platform";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const credentials = getCredentialStatus();

  return (
    <main id="main-content">
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Fair, verifiable random draws
        </span>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
          Pick a winner.
          <br />
          Make it fair.
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Randomly select giveaway winners from YouTube, Reddit, Instagram and more — with powerful
          filters and transparent, cryptographically verifiable draw results.
        </p>

        <UrlInput />

        <Button asChild variant="ghost" size="sm">
          <Link href="/extension">Or get the browser extension →</Link>
        </Button>
      </section>

      <section id="platforms" className="border-t border-border/70 bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">Works with the platforms you use.</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
            Every integration uses the platform&rsquo;s official API — never scraping, never workarounds.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ALL_PLATFORMS.map((platform) => {
              const status = PLATFORM_STATUS[platform];
              const cred = platform in credentials ? credentials[platform as keyof typeof credentials] : undefined;
              const needsSetup = cred && !cred.configured;

              return (
                <Card key={platform} className="flex flex-col items-center gap-3 p-5 text-center">
                  <PlatformIcon platform={platform} className="h-10 w-10 text-sm" />
                  <p className="font-semibold">{PLATFORM_LABEL[platform]}</p>
                  <PlatformStatusBadge status={status.status} label={status.label} />
                  {needsSetup && (
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      Server needs {Object.keys(cred!.required).join(", ")}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-4">
            {[
              { icon: Share2, title: "Paste", body: "Drop in a video or post URL — we detect the platform automatically." },
              { icon: Filter, title: "Filter", body: "Require keywords, remove duplicates, one entry per person, and more." },
              { icon: Sparkles, title: "Pick", body: "A cryptographically secure draw selects your winner — never Math.random()." },
              { icon: ShieldCheck, title: "Share", body: "Every result gets a public, verifiable link you can post anywhere." },
            ].map((step, i) => (
              <div key={step.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">
                  {i + 1}. {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Transparent random selection</h2>
          <p className="mt-3 text-muted-foreground">
            Every draw records a hash of the exact candidate pool it ran against and signs the result
            cryptographically. Anyone with the result link can verify the draw wasn&rsquo;t tampered with —
            no trust required.
          </p>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Ready to pick a winner?</h2>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="#platforms">Get started</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
