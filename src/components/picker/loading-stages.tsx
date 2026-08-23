import { Card } from "@/components/ui/card";
import type { CommentFetchProgress } from "./types";

export function LoadingComments({ progress }: { progress: CommentFetchProgress }) {
  return (
    <Card className="flex flex-col items-center gap-5 px-8 py-14 text-center">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold">{progress.label}</p>
        <p className="text-3xl font-bold tabular-nums tracking-tight">
          {progress.totalFetched.toLocaleString()}{" "}
          <span className="text-base font-medium text-muted-foreground">comments collected</span>
        </p>
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        We&rsquo;re collecting every eligible entry directly from the platform&rsquo;s official API.
      </p>
    </Card>
  );
}
