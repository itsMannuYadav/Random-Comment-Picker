import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <main id="main-content" className={cn("mx-auto w-full flex-1 px-4 py-10 sm:px-6", wide ? "max-w-5xl" : "max-w-2xl")}>
      {children}
    </main>
  );
}
