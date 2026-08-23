import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "About",
  description: "MyCP is a fair, transparent random comment picker for giveaways.",
};

export default function AboutPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">About MyCP</h1>
        <p className="text-muted-foreground">
          MyCP (My Comment Picker) helps creators, brands, and agencies run fair, transparent giveaways
          on the platforms their audience actually lives on. Random. Simple. Fair.
        </p>
        <p className="text-muted-foreground">
          Every comment is fetched through each platform&rsquo;s official, documented API — never by
          scraping or working around platform restrictions. Every draw uses a cryptographically secure
          random source and produces a publicly verifiable result page, so a winner announcement is
          never just &ldquo;trust us.&rdquo;
        </p>
        <p className="text-muted-foreground">
          MyCP is under active development. Platform support expands as official APIs make it possible —
          see the platform status on the homepage for what&rsquo;s live today.
        </p>
        <p className="text-sm text-muted-foreground">Built by Mannu Yadav.</p>
      </div>
    </PageShell>
  );
}
