import type { Metadata } from "next";
import Link from "next/link";
import { ToolCard } from "@/components/ui/tool-card";
import { ToolSearch } from "@/components/home/tool-search";
import { TOOL_REGISTRY } from "@/config/tools";
import { TOOL_CATEGORIES } from "@/config/categories";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Browse every tool in the MySocial creator toolkit.",
};

export default function ToolsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">All Tools</h1>
        <p className="mt-3 text-muted-foreground">
          Everything in the MySocial toolkit, in one place.
        </p>
        <ToolSearch className="mt-8" />
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-2">
        {TOOL_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {category.label}
          </Link>
        ))}
      </div>

      {TOOL_CATEGORIES.map((category) => {
        const tools = TOOL_REGISTRY.filter((tool) => tool.category === category.id);
        if (tools.length === 0) return null;

        return (
          <section key={category.id} id={category.id} className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-bold tracking-tight">{category.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
