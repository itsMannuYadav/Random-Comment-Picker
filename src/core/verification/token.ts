import "server-only";
import { getDrawSecret } from "@/lib/env.server";
import type { DrawRecord } from "./types";

/**
 * V1 has no database (see planning doc section 11 — Vercel-compatible, no
 * filesystem/persistent process). Instead of faking persistence with an
 * in-memory store that silently loses data across serverless instances,
 * every draw record is serialized and HMAC-signed into the `/draw/[token]`
 * URL itself: the page is entirely self-verifying, with no lookup required.
 *
 * This is a deliberate architectural choice, not a shortcut — it's the thing
 * that actually works correctly, statelessly, on Vercel today. When
 * accounts/draw history (planning doc section 49) ship, swap this for a real
 * store behind the same `encodeDrawToken`/`decodeDrawToken` call sites.
 */

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(value, "base64url");
  const bytes = new Uint8Array(buf.length);
  bytes.set(buf);
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getDrawSecret();
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function encodeDrawToken(record: DrawRecord): Promise<string> {
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(record)));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const signaturePart = base64UrlEncode(new Uint8Array(signature));
  return `${payload}.${signaturePart}`;
}

export async function decodeDrawToken(token: string): Promise<DrawRecord | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signaturePart] = parts;

  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signaturePart),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;

    const json = new TextDecoder().decode(base64UrlDecode(payload));
    return JSON.parse(json) as DrawRecord;
  } catch {
    return null;
  }
}

/** Short, human-friendly display ID (e.g. "MYCP-8F3A91"). Independent of the token — generate before signing. */
export function generateFriendlyDrawId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `MYCP-${hex.slice(0, 6)}`;
}
