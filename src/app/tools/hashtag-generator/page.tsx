import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ToolCard } from "@/components/ui/tool-card";
import { AiGeneratorTool, type GeneratorField } from "@/components/tools/ai-generator";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("hashtag-generator");

const FIELDS: GeneratorField[] = [
  { key: "topic", label: "Content", placeholder: "Describe your content", type: "textarea", required: true },
  { key: "platform", label: "Platform (optional)", placeholder: "", type: "select", options: ["Instagram", "TikTok", "X", "LinkedIn"] },
];

export const metadata: Metadata = {
  title: "Hashtag Generator",
  description: "Get relevant hashtag suggestions for your content with AI.",
};

export default function HashtagGeneratorPage() {
  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.creator.href} className="hover:text-foreground">Creator</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Hashtag Generator</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Hashtag Generator</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Get relevant hashtag suggestions for your content.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <AiGeneratorTool kind="hashtag" fields={FIELDS} submitLabel="Generate Hashtags" />
      </section>

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
