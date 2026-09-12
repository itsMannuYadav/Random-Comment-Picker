import Link from "next/link";
import { Sparkles } from "lucide-react";
import { appConfig } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          {appConfig.name}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/tools" className="hover:text-foreground">
            Tools
          </Link>
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/#popular" className="hover:text-foreground">
            Popular
          </Link>
          <Link href="/extension" className="hover:text-foreground">
            Extension
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <CommandPaletteTrigger />
          <Button asChild size="sm" variant="secondary" className="shrink-0">
            <Link href="/extension">Get the extension</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
