import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Filter, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { UrlInput } from "@/components/home/url-input";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { ToolCard } from "@/components/ui/tool-card";
import { getRelatedTools, getToolById } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";
import { PLATFORM_STATUS } from "@/lib/platform-status";
import { PLATFORM_LABEL, type Platform } from "@/types/platform";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comment Picker",
  description:
    "Pick random giveaway winners from YouTube, Reddit and Instagram comments — fair, filterable and cryptographically verifiable.",
};

const STEPS = [
  { icon: Share2, title: "Paste", body: "Drop in a video or post URL — we detect the platform automatically." },
  { icon: Filter, title: "Filter", body: "Require keywords, remove duplicates, one entry per person, and more." },
  { icon: Sparkles, title: "Pick", body: "A cryptographically secure draw selects your winner — never Math.random()." },
  { icon: ShieldCheck, title: "Share", body: "Every result gets a public, verifiable link you can post anywhere." },
];

// Only platforms the picker actually has a routed draw flow for today (/y, /r, /i).
const SUPPORTED_PLATFORMS: Platform[] = ["youtube", "reddit", "instagram"];

const FAQ = [
  {
    question: "Is the draw actually fair?",
    answer:
      "Yes. Winners are selected with the Web Crypto API's cryptographically secure random number generator using rejection sampling, never Math.random(). Every draw also records a SHA-256 hash of the exact candidate pool it ran against, so the result can't be quietly rerun or tampered with after the fact.",
  },
  {
    question: "How do I know a result wasn't faked?",
    answer:
      "Every draw produces a shareable /draw/[token] link. The entire result — winners, candidate pool hash and algorithm version — is signed with an HMAC secret and embedded in that token. Anyone who opens the link gets the signature re-verified on the spot, with no database lookup and no trust required.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Paste a URL and go. Because results are self-verifying signed links rather than database records, there's nothing to sign up for in order to run or share a draw.",
  },
  {
    question: "What happens to the comments you load?",
    answer:
      "Comments are fetched live from the platform's official API for the draw and are not stored in a database — the only thing that persists is the signed result embedded in your draw's own share link.",
  },
  {
    question: "Can I pick more than one winner, or re-roll?",
    answer:
      "Yes — choose up to 10 winners per draw. After a draw completes, \"Pick another winner\" reruns the draw excluding everyone already selected, so you can top up a giveaway without picking the same person twice.",
  },
];

export default function CommentPickerToolPage() {
  const tool = getToolById("comment-picker");
  const related = getRelatedTools("comment-picker");

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.engage.href} className="hover:text-foreground">
          Engage
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Comment Picker</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-14 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Comment Picker</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          {tool?.description ?? "Pick random giveaway winners from your comments — fair and verifiable."}
        </p>

        <UrlInput showPlatformChips={false} />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const status = PLATFORM_STATUS[platform];
            return (
              <span
                key={platform}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                title={status.description}
              >
                <PlatformIcon platform={platform} className="h-4 w-4 text-[8px]" />
                {PLATFORM_LABEL[platform]}
                {status.status !== "available" && <span className="text-muted-foreground/70">· {status.label}</span>}
              </span>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/70 bg-muted/30 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold tracking-tight">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-4">
            {STEPS.map((step, i) => (
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

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-8 flex flex-col divide-y divide-border">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                  {item.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border/70 bg-muted/30 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((relatedTool) => (
                <ToolCard key={relatedTool.id} tool={relatedTool} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
