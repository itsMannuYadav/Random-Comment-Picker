"use client";

import { useState } from "react";
import { ChevronDown, Users, Hash, Type, Calendar, ShieldOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { DrawFilters, FilterStep } from "@/core/comment-engine/types";

interface FilterPanelProps {
  filters: DrawFilters;
  onChange: (next: DrawFilters) => void;
  steps: FilterStep[];
}

function Checkbox({ checked, onChange, label, icon: Icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-[var(--primary)]"
      />
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span>{label}</span>
    </label>
  );
}

const DEFAULT_FILTERS: DrawFilters = { excludeEmpty: true };

function countAdvancedFilters(filters: DrawFilters): number {
  let count = 0;
  if (filters.after || filters.before) count++;
  if (filters.minLength !== undefined || filters.maxLength !== undefined) count++;
  if (filters.replyMode && filters.replyMode !== "include") count++;
  if (filters.blockedWords && filters.blockedWords.length > 0) count++;
  return count;
}

export function FilterPanel({ filters, onChange, steps }: FilterPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const set = <K extends keyof DrawFilters>(key: K, value: DrawFilters[K]) => onChange({ ...filters, [key]: value });
  const advancedCount = countAdvancedFilters(filters);
  const hasAnyFilter =
    Boolean(filters.onePerPerson || filters.removeDuplicateComments || filters.excludeLinks || filters.keyword || filters.hashtag) ||
    advancedCount > 0;

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</h3>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick filters</h3>
        <div className="flex flex-col gap-3">
          <Checkbox
            icon={Users}
            checked={Boolean(filters.onePerPerson)}
            onChange={(v) => set("onePerPerson", v)}
            label="One entry per person"
          />
          <Checkbox
            checked={Boolean(filters.removeDuplicateComments)}
            onChange={(v) => set("removeDuplicateComments", v)}
            label="Remove duplicate comments"
          />
          <Checkbox
            icon={ShieldOff}
            checked={Boolean(filters.excludeLinks)}
            onChange={(v) => set("excludeLinks", v)}
            label="Exclude comments with links"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Comment requirements
        </h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm">
            <Type className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Must contain keyword"
              value={filters.keyword ?? ""}
              onChange={(e) => set("keyword", e.target.value || undefined)}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
          <label className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm">
            <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Must contain hashtag"
              value={filters.hashtag ?? ""}
              onChange={(e) => set("hashtag", e.target.value || undefined)}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            Advanced filters
            {advancedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {advancedCount}
              </span>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
        </button>

        {advancedOpen && (
          <div className="mt-4 flex flex-col gap-5">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Date range
              </p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.after?.slice(0, 10) ?? ""}
                  onChange={(e) => set("after", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={filters.before?.slice(0, 10) ?? ""}
                  onChange={(e) => set("before", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Text length</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={filters.minLength ?? ""}
                  onChange={(e) => set("minLength", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={filters.maxLength ?? ""}
                  onChange={(e) => set("maxLength", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Replies</p>
              <div className="flex gap-2">
                {(["include", "exclude", "only"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => set("replyMode", mode)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                      (filters.replyMode ?? "include") === mode
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {mode === "include" ? "Include replies" : mode === "exclude" ? "Exclude replies" : "Replies only"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
              Blocked words (comma separated)
              <input
                value={filters.blockedWords?.join(", ") ?? ""}
                onChange={(e) =>
                  set(
                    "blockedWords",
                    e.target.value
                      ? e.target.value.split(",").map((w) => w.trim()).filter(Boolean)
                      : undefined
                  )
                }
                className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-normal text-foreground"
              />
            </label>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live effect</p>
        <ul className="flex flex-col gap-1 text-sm">
          {steps.map((step, i) => (
            <li key={step.label} className="flex items-center justify-between">
              <span className={i === 0 ? "text-muted-foreground" : "flex items-center gap-1.5 text-muted-foreground"}>
                {i > 0 && <span className="text-muted-foreground/60">→</span>} {step.label}
              </span>
              <span className="font-semibold tabular-nums">{step.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
