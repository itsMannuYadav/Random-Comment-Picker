"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, Search, Puzzle } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette/command-palette";

const LINKS = [
  { href: "/tools", label: "Tools" },
  { href: "/features", label: "Features" },
  { href: "/#popular", label: "Popular" },
];

/** The header's nav links and search trigger are both hidden below sm/md
 * with no fallback — this is the mobile equivalent, a slide-in drawer. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { setOpen: setCommandOpen } = useCommandPalette();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground md:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 border-l border-border bg-background p-4 focus:outline-none">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">Site navigation and search</Dialog.Description>

          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-semibold text-muted-foreground">Menu</span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close menu" className="rounded-full p-1.5 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCommandOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
          >
            <Search className="h-4 w-4" /> Search tools
          </button>

          {LINKS.map((link) => (
            <Dialog.Close asChild key={link.href}>
              <Link href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                {link.label}
              </Link>
            </Dialog.Close>
          ))}

          <div className="mt-2 border-t border-border pt-3">
            <Dialog.Close asChild>
              <Link
                href="/extension"
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Puzzle className="h-4 w-4" /> Extension
              </Link>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
