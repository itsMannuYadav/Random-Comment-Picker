import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Browser Extension",
  description: "Pick winners faster — detect supported posts directly from your browser.",
};

const STEPS = [
  "Download or clone the MySocial repository.",
  'Open chrome://extensions (or edge://extensions in Edge).',
  'Enable "Developer mode" (top-right toggle).',
  'Click "Load unpacked" and select the /extension folder.',
  "Pin the MySocial icon to your toolbar for quick access.",
];

export default function ExtensionPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <Badge variant="warning">Not yet published to the Chrome/Edge stores</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">MySocial Browser Extension</h1>
          <p className="mt-3 text-muted-foreground">
            Detect supported social posts directly from your browser and jump straight into the
            right MySocial tool.
          </p>
        </div>

        <Card className="p-6">
          <h2 className="font-semibold">What it does</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            While you&rsquo;re on a supported YouTube, Reddit or Instagram page, the extension detects
            it and offers one-click actions — &ldquo;Pick with MySocial&rdquo;, &ldquo;Get
            Thumbnail&rdquo; (YouTube) and &ldquo;Analyze&rdquo; — that open the matching MySocial
            tool pre-filled with that page&rsquo;s URL. It never reads comments itself or holds any
            API credentials; it just opens a MySocial URL.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Manual installation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The extension isn&rsquo;t in the Chrome Web Store or Edge Add-ons store yet. Until it is, install
            it as an unpacked developer extension:
          </p>
          <ol className="mt-4 flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Supported today</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {["youtube.com/watch, /shorts, youtu.be", "reddit.com/r/*/comments/*", "instagram.com/p, /reel, /tv"].map((pattern) => (
              <li key={pattern} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" /> <code className="font-mono">{pattern}</code>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
