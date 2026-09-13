import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Github, BookOpen, Shield } from "lucide-react";
import { LegalPage } from "@/components/layout/legal-page";
import { Card } from "@/components/ui/card";
import { appConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Support",
  description: `Get help with ${appConfig.name} and the browser extension.`,
};

const SUPPORT_EMAIL = "hello@mannuyadav.me";
const GITHUB_ISSUES = "https://github.com/itsMannu-Yadav/mysocial/issues";

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      description={`Help for the ${appConfig.name} website and Microsoft Edge / Chromium extension.`}
      updated="13 September 2026"
    >
      <section className="flex flex-col gap-3">
        <h2>Contact</h2>
        <p>
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${appConfig.name} support`)}`}>
            {SUPPORT_EMAIL}
          </a>{" "}
          for account-free product questions, privacy requests, or store-listing issues. We aim to
          reply within a few business days.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <p className="font-semibold text-foreground">Extension help</p>
          <p>
            Install steps, permissions, and Edge Add-ons notes live on the{" "}
            <Link href="/extension">Extension</Link> page and in the repo{" "}
            <code className="text-foreground">extension/README.md</code>.
          </p>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <p className="font-semibold text-foreground">Product docs</p>
          <p>
            Start with <Link href="/about">About</Link>, <Link href="/features">Features</Link>, and
            the tools directory at <Link href="/tools">/tools</Link>.
          </p>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Github className="h-4 w-4" />
          </span>
          <p className="font-semibold text-foreground">Bugs &amp; feature requests</p>
          <p>
            Open an issue on GitHub:{" "}
            <a href={GITHUB_ISSUES} rel="noopener noreferrer" target="_blank">
              {GITHUB_ISSUES.replace("https://", "")}
            </a>
          </p>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </span>
          <p className="font-semibold text-foreground">Privacy &amp; terms</p>
          <p>
            Read the <Link href="/privacy">Privacy Policy</Link> and{" "}
            <Link href="/terms">Terms of Use</Link>.
          </p>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Before you write in</h2>
        <ul>
          <li>Browser and version (for example Microsoft Edge 140).</li>
          <li>Whether you&rsquo;re using the website, the extension, or both.</li>
          <li>The exact URL / tool that failed, and any error text you saw.</li>
          <li>Screenshots if the UI looks wrong.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Store reviewers</h2>
        <p>
          Microsoft Edge Add-ons certification notes, listing copy, and test steps for the extension
          are maintained in the repository under{" "}
          <code className="text-foreground">extension/store-listing/LISTING.md</code>. Backend used
          by the extension: <a href={appConfig.url}>{appConfig.url}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
