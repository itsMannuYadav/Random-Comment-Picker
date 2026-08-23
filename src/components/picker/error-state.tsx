import { AlertTriangle, Clock, Link2Off, PlugZap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ICON_BY_CODE: Record<string, React.ComponentType<{ className?: string }>> = {
  "requires-connection": PlugZap,
  "not-configured": PlugZap,
  "rate-limited": Clock,
  "quota-exceeded": Clock,
  "not-found": Link2Off,
};

export function ErrorState({ message, code }: { message: string; code: string }) {
  const Icon = ICON_BY_CODE[code] ?? AlertTriangle;

  return (
    <Card className="flex flex-col items-center gap-4 px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold">{message}</p>
        {code === "not-configured" && (
          <p className="max-w-sm text-sm text-muted-foreground">
            This server hasn&rsquo;t been configured with the credentials this integration needs yet.
          </p>
        )}
      </div>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </Card>
  );
}
