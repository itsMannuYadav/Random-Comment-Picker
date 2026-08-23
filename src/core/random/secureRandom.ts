/**
 * Cryptographically secure randomness for the draw engine. Never use
 * `Math.random()` here — it is not a fairness-grade random source and must
 * never be the mechanism a giveaway winner is chosen with.
 */

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) {
    throw new Error("A cryptographically secure random source is not available in this runtime.");
  }
  return c;
}

/**
 * Returns a uniformly distributed secure random integer in [0, maxExclusive).
 * Uses rejection sampling against a Web Crypto byte source to avoid modulo bias.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error("maxExclusive must be positive");
  if (maxExclusive === 1) return 0;

  const cryptoObj = getCrypto();
  const bitsNeeded = Math.ceil(Math.log2(maxExclusive));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const mask = bytesNeeded * 8 === bitsNeeded ? (1 << bitsNeeded) - 1 : (1 << (bytesNeeded * 8)) - 1;
  const buf = new Uint8Array(bytesNeeded);

  // Rejection sampling: draw until the masked value falls within range.
  // Expected iterations stay under 2 for any maxExclusive.
  for (let attempt = 0; attempt < 1000; attempt++) {
    cryptoObj.getRandomValues(buf);
    let value = 0;
    for (let i = 0; i < buf.length; i++) value = (value << 8) | buf[i];
    value = value & mask;
    if (value < maxExclusive) return value;
  }

  throw new Error("Failed to generate a secure random number within range.");
}

/**
 * Secure, unbiased Fisher-Yates partial shuffle: selects `count` items from
 * `items` without replacement. Returns a NEW array — the input is untouched.
 */
export function secureSample<T>(items: readonly T[], count: number): T[] {
  if (count > items.length) {
    throw new Error("Cannot sample more items than are available.");
  }
  const pool = [...items];
  const n = pool.length;

  for (let i = 0; i < count; i++) {
    const j = i + secureRandomInt(n - i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}
