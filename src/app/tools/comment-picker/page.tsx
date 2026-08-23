import type { Metadata } from "next";
import { Filter, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { UrlInput } from "@/components/home/url-input";
import { getToolById } from "@/config/tools";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comment Picker",
  description: "Pick random giveaway winners from YouTube, Reddit and Instagram comments — fair, filterable and cryptographically verifiable.",
};

const STEPS = [
  { icon: Share2, title: "Paste", body: "Drop in a video or post URL — we detect the platform automatically." },
  { icon: Filter, title: "Filter", body: "Require keywords, remove duplicates, one entry per person, and more." },
  { icon: Sparkles, title: "Pick", body: "A cryptographically secure draw selects your winner — never Math.random()." },
  { icon: ShieldCheck, title: "Share", body: "Every result gets a public, verifiable link you can post anywhere." },
];

export default function CommentPickerToolPage() {
  const tool = getToolById("comment-picker");

  return (
    <main id="main-content">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-14 pt-16 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Comment Picker</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          {tool?.description ?? "Pick random giveaway winners from your comments — fair and verifiable."}
        </p>

        <UrlInput />
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
    </main>
  );
}
