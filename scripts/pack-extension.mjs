/**
 * Build a Microsoft Edge Add-ons upload package from extension/.
 *
 * Uses Python's zipfile so entries always use forward slashes (Partner Center
 * is picky about package layout). Excludes store-listing/, README.md, and zips.
 *
 * Usage: node scripts/pack-extension.mjs
 * Output: dist/mysocial-edge-<version>.zip
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const extDir = join(root, "extension");
const outDir = join(root, "dist");
const helper = join(root, "scripts", "_pack-extension.py");

async function main() {
  if (!existsSync(join(extDir, "manifest.json"))) {
    throw new Error("extension/manifest.json not found");
  }

  const manifest = JSON.parse(readFileSync(join(extDir, "manifest.json"), "utf8"));
  const version = manifest.version || "0.0.0";

  const hosts = manifest.host_permissions || [];
  if (hosts.some((h) => String(h).includes("localhost"))) {
    throw new Error(
      "Refuse to pack: host_permissions still includes localhost. Remove it from extension/manifest.json before packaging for the store.",
    );
  }

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `mysocial-edge-${version}.zip`);
  if (existsSync(outPath)) rmSync(outPath);

  const result = spawnSync("python", [helper, extDir, outPath], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "pack helper failed");
  }
  if (result.stdout.trim()) process.stdout.write(result.stdout);

  const size = (await stat(outPath)).size;
  console.log(`Packed ${outPath} (${size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
