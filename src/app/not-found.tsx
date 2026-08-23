import Link from "next/link";
import { Dices } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Dices className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Nothing to draw here</h1>
        <p className="max-w-sm text-muted-foreground">
          This page doesn&rsquo;t exist, or the link may be broken.
        </p>
        <Button asChild>
          <Link href="/">Back to MyCP</Link>
        </Button>
      </div>
    </PageShell>
  );
}
