import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Returns a lazily-loaded, session-cached FFmpeg instance shared by every
 * ffmpeg-based tool (video and audio alike). The ~32MB WebAssembly core is
 * only fetched the first time any of them actually runs a conversion —
 * never on page load, and never in the homepage bundle (doc §97
 * performance budget). Self-hosted from /public/ffmpeg (see
 * scripts/copy-ffmpeg-core.mjs) rather than a CDN, since the CSP's
 * connect-src is 'self' only.
 *
 * Deliberately NOT using @ffmpeg/util's toBlobURL() here, despite it being
 * the pattern in every ffmpeg.wasm example: that trick exists to work
 * around CORS when loading the core from a different origin (its usual
 * unpkg.com CDN default). Self-hosted same-origin, plain absolute URLs
 * work directly and skip an extra failure mode a blob: URL fetched from
 * inside a Worker introduced here (returned corrupt/empty content in
 * testing — root cause not worth chasing further given it isn't needed).
 */
export function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return Promise.resolve(ffmpegInstance);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    const origin = window.location.origin;
    // classWorkerURL points at a plain static file (public/ffmpeg-worker.js)
    // instead of @ffmpeg/ffmpeg's built-in worker — see that file's header
    // comment for why: Turbopack statically bundles the built-in worker and
    // breaks its runtime `import(coreURL)` call in the process. Passed as a
    // fully-qualified URL: FFmpeg.load() resolves it against import.meta.url
    // of its own (Turbopack-bundled) chunk, which isn't a usable http(s)
    // base in this build, so a root-relative path resolves wrong.
    await ffmpeg.load({
      coreURL: `${origin}/ffmpeg/ffmpeg-core.js`,
      wasmURL: `${origin}/ffmpeg/ffmpeg-core.wasm`,
      classWorkerURL: `${origin}/ffmpeg-worker.js`,
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })().catch((err) => {
    loadPromise = null; // allow retrying on a later attempt instead of caching a failure forever
    throw err;
  });

  return loadPromise;
}
