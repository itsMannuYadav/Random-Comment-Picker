"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { searchTools, isToolOpenable } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";
import { StatusBadge } from "@/components/ui/status-badge";

export function ToolSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const results = searchTools(query);
  const open = query.trim().length > 0;

  return (
    <div className={className}>
      <div className="relative">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search tools"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-lg">
            {results.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No tools found for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              results.map((tool) => {
                const Icon = tool.icon;
                const isOpenable = isToolOpenable(tool.status);
                const row = (
                  <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-left">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{tool.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {CATEGORY_BY_ID[tool.category].label}
                      </span>
                    </span>
                    <StatusBadge status={tool.status} />
                  </span>
                );

                return isOpenable ? (
                  <Link key={tool.id} href={tool.href} className="block hover:bg-muted/60 rounded-lg">
                    {row}
                  </Link>
                ) : (
                  <span key={tool.id} className="block opacity-70">
                    {row}
                  </span>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
