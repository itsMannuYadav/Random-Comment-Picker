import { describe, expect, it } from "vitest";
import { decodeDrawToken, encodeDrawToken, generateFriendlyDrawId } from "./token";
import type { DrawRecord } from "./types";

function makeRecord(): DrawRecord {
  return {
    id: generateFriendlyDrawId(),
    platform: "youtube",
    sourceId: "abc123",
    sourceUrl: "https://www.youtube.com/watch?v=abc123",
    totalComments: 100,
    eligibleEntries: 42,
    filters: { onePerPerson: true },
    winners: [
      {
        id: "w1",
        platform: "youtube",
        postId: "abc123",
        text: "pick me!",
        isReply: false,
        parentId: null,
      },
    ],
    candidatePoolHash: "deadbeef",
    algorithmVersion: "mycp-draw-v1",
    createdAt: new Date().toISOString(),
  };
}

describe("draw tokens", () => {
  it("round-trips a record through encode/decode", async () => {
    const record = makeRecord();
    const token = await encodeDrawToken(record);
    const decoded = await decodeDrawToken(token);
    expect(decoded).toEqual(record);
  });

  it("rejects a token with a tampered payload", async () => {
    const token = await encodeDrawToken(makeRecord());
    const [, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ hacked: true })).toString("base64url");
    const decoded = await decodeDrawToken(`${tamperedPayload}.${signature}`);
    expect(decoded).toBeNull();
  });

  it("rejects a token with a tampered signature", async () => {
    const token = await encodeDrawToken(makeRecord());
    const [payload] = token.split(".");
    const decoded = await decodeDrawToken(`${payload}.not-a-real-signature`);
    expect(decoded).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await decodeDrawToken("not.a.valid.token")).toBeNull();
    expect(await decodeDrawToken("garbage")).toBeNull();
  });

  it("generates distinct friendly IDs", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateFriendlyDrawId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^MYCP-[0-9A-F]{6}$/);
  });
});
