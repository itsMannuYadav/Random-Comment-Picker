import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { isToolOpenable, type ToolDefinition } from "@/config/tools";

export function ToolCard({ tool, className }: { tool: ToolDefinition; className?: string }) {
  const isOpenable = isToolOpenable(tool.status);
  const Icon = tool.icon;

  const content = (
    <Card
      className={cn(
        "flex h-full flex-col gap-4 p-5 transition-colors",
        isOpenable ? "hover:border-primary/40 hover:bg-muted/40" : "opacity-80",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <StatusBadge status={tool.status} />
      </div>

      <div className="flex-1">
        <p className="font-semibold">{tool.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
      </div>

      {isOpenable && (
        <span className="flex items-center gap-1 text-sm font-medium text-primary">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </Card>
  );

  if (!isOpenable) {
    return content;
  }

  return (
    <Link href={tool.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl">
      {content}
    </Link>
  );
}
