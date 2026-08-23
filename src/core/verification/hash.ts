async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Deterministic hash of a candidate pool: sorts entry IDs canonically first
 * so the hash only depends on *which* entries were eligible, not the order
 * they happened to arrive from the platform API.
 */
export async function hashCandidatePool(entryIds: string[]): Promise<string> {
  const canonical = [...entryIds].sort().join("\n");
  return sha256Hex(canonical);
}

export { sha256Hex };
