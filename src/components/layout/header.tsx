import Link from "next/link";
import { Dices } from "lucide-react";
import { appConfig } from "@/lib/env";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dices className="h-4.5 w-4.5" />
          </span>
          {appConfig.name}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/#platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <Link href="/#how-it-works" className="hover:text-foreground">
            How it works
          </Link>
          <Link href="/extension" className="hover:text-foreground">
            Extension
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>

        <Button asChild size="sm" variant="secondary">
          <Link href="/extension">Get the extension</Link>
        </Button>
      </div>
    </header>
  );
}
