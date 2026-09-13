import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCard } from "@/components/ui/tool-card";
import { TOOL_CATEGORIES, CATEGORY_BY_ID, type ToolCategoryId } from "@/config/categories";
import { getToolsByCategory } from "@/config/tools";

export function generateStaticParams() {
  return TOOL_CATEGORIES.map((category) => ({ category: category.id }));
}

function isCategoryId(value: string): value is ToolCategoryId {
  return value in CATEGORY_BY_ID;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categoryParam } = await params;
  if (!isCategoryId(categoryParam)) return {};

  const category = CATEGORY_BY_ID[categoryParam];
  return {
    title: category.label,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryParam } = await params;
  if (!isCategoryId(categoryParam)) notFound();

  const category = CATEGORY_BY_ID[categoryParam];
  const tools = getToolsByCategory(categoryParam);
  const Icon = category.icon;

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{category.label}</h1>
        <p className="mt-3 text-muted-foreground">{category.description}</p>
      </div>

      {tools.length === 0 ? (
        <div className="mx-auto mt-14 max-w-md text-center text-muted-foreground">
          <p className="text-3xl">✨</p>
          <p className="mt-3">No tools in this category yet - check back soon.</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </main>
  );
}
