import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The `server-only` package resolves to a throwing stub under its
      // "browser" export condition, which Vitest picks up by default.
      // These are unit tests, not a Next.js runtime, so stub it out.
      "server-only": path.resolve(__dirname, "./vitest.server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
