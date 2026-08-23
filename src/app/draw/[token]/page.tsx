import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { decodeDrawToken } from "@/core/verification/token";
import { PageShell } from "@/components/layout/page-shell";
import { WinnerCard } from "@/components/picker/winner-card";
import { ResultActions } from "@/components/picker/result-actions";
import { Card } from "@/components/ui/card";
import { appConfig } from "@/lib/env";
import { displayNameFor } from "@/lib/display-name";
import { PLATFORM_PREFIX } from "@/types/platform";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const record = await decodeDrawToken(token);
  if (!record) return { title: "Draw not found" };

  const winnerLabel =
    record.winners.length === 1 ? displayNameFor(record.winners[0]) : `${record.winners.length} winners`;

  return {
    title: `${winnerLabel} won — Giveaway result`,
    description: `${record.eligibleEntries.toLocaleString()} eligible entries. Verified fair draw. Draw ID ${record.id}.`,
  };
}

export default async function DrawResultPage({ params }: PageProps) {
  const { token } = await params;
  const record = await decodeDrawToken(token);
  if (!record) notFound();

  const shareUrl = `${appConfig.url}/draw/${token}`;
  const sourcePickerUrl = `/${PLATFORM_PREFIX[record.platform]}/${record.sourceId}?resume=${token}`;

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Giveaway result</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {record.winners.length === 1 ? "We have a winner!" : `${record.winners.length} winners selected`}
          </h1>
          {record.sourceTitle && <p className="mt-2 text-muted-foreground">{record.sourceTitle}</p>}
        </div>

        <div className="flex flex-col gap-4">
          {record.winners.map((winner, i) => (
            <WinnerCard
              key={winner.id}
              winner={winner}
              platform={record.platform}
              index={i}
              total={record.winners.length}
              shareUrl={shareUrl}
            />
          ))}
        </div>

        <Card className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat label="Eligible entries" value={record.eligibleEntries.toLocaleString()} />
            <Stat label="Total comments" value={record.totalComments.toLocaleString()} />
            <Stat label="Winners" value={String(record.winners.length)} />
            <Stat label="Drawn on" value={new Date(record.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Cryptographically verified — this result&rsquo;s signature was checked when this page loaded.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>
              Draw ID <span className="font-mono font-medium text-foreground">{record.id}</span>
            </span>
            <span className="font-mono">Algorithm {record.algorithmVersion}</span>
          </div>
        </Card>

        <ResultActions record={record} shareUrl={shareUrl} />

        <div className="text-center">
          <Link href={sourcePickerUrl} className="text-sm font-medium text-primary hover:underline">
            Pick another winner from this post →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
