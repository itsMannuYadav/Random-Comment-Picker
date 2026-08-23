import Link from "next/link";
import { appConfig } from "@/lib/env";

export function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {appConfig.name}. Random. Simple. Fair.
        </p>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/extension" className="hover:text-foreground">
            Extension
          </Link>
        </div>
      </div>
    </footer>
  );
}
