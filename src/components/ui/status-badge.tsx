import { Badge } from "@/components/ui/badge";
import type { ToolStatus } from "@/config/tools";

const STATUS_META: Record<ToolStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  available: { label: "Live", variant: "success" },
  beta: { label: "Beta", variant: "warning" },
  "coming-soon": { label: "Coming soon", variant: "neutral" },
};

export function StatusBadge({ status }: { status: ToolStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
