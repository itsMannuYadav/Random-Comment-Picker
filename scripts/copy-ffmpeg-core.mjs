// Copies the ffmpeg.wasm single-threaded core (a build artifact of the
// @ffmpeg/core dependency, not a source file) into public/ffmpeg/ so it can
// be fetched same-origin at runtime -- required by the CSP's connect-src
// 'self' and avoids ever committing a ~32MB binary into git history. Runs
// automatically via the "postinstall" script, both locally and on Vercel.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
// The ESM build, not UMD: @ffmpeg/ffmpeg's worker is created with
// `{ type: "module" }`, so it always loads the core via a dynamic
// `import()` (importScripts() isn't available in module workers, and its
// UMD/ESM auto-swap fallback only triggers for the package's own default
// unpkg URL, not a self-hosted one like ours) -- importing the UMD build
// fails with an opaque "TypeError: Failed to fetch" since it isn't a
// valid ES module.
const src = path.join(root, "node_modules/@ffmpeg/core/dist/esm");
const dest = path.join(root, "public/ffmpeg");

if (!existsSync(src)) {
  console.warn("[copy-ffmpeg-core] @ffmpeg/core not installed, skipping.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log("[copy-ffmpeg-core] copied ffmpeg-core.js and ffmpeg-core.wasm to public/ffmpeg/");
