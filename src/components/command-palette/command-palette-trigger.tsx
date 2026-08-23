"use client";

import { Search } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette/command-palette";

export function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
      aria-label="Search tools"
    >
      <Search className="h-3.5 w-3.5" />
      Search
      <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
    </button>
  );
}
