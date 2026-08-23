import { Badge } from "@/components/ui/badge";
import type { PlatformStatusKind } from "@/lib/platform-status";

const VARIANT_BY_STATUS: Record<PlatformStatusKind, "success" | "warning" | "neutral"> = {
  available: "success",
  beta: "warning",
  "requires-connection": "warning",
  "coming-soon": "neutral",
};

export function PlatformStatusBadge({ status, label }: { status: PlatformStatusKind; label: string }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{label}</Badge>;
}
