import type { ReactNode } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { appConfig } from "@/lib/env";

export function LegalPage({
  title,
  description,
  updated,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-border/70 pb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {appConfig.name}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">Last updated: {updated}</p>
        </header>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:mt-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>

        <nav className="flex flex-wrap gap-4 border-t border-border/70 pt-6 text-sm">
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <Link href="/support" className="text-muted-foreground hover:text-foreground">
            Support
          </Link>
          <Link href="/extension" className="text-muted-foreground hover:text-foreground">
            Extension
          </Link>
        </nav>
      </article>
    </PageShell>
  );
}
