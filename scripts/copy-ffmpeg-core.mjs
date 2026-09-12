// Copies the ffmpeg.wasm single-threaded core (a build artifact of the
// @ffmpeg/core dependency, not a source file) into public/ffmpeg/ so it can
// be fetched same-origin at runtime -- required by the CSP's connect-src
// 'self' and avoids ever committing a ~32MB binary into git history. Runs
// automatically via the "postinstall" script, both locally and on Vercel.
//
// (qr-scanner's worker does NOT need this treatment: it loads its worker via
// a plain relative `import("./qr-scanner-worker.min.js")`, which Turbopack
// code-splits and serves automatically -- unlike @ffmpeg/ffmpeg's worker,
// which uses `new Worker(new URL(...))`, a pattern Turbopack mis-bundles.)
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
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
