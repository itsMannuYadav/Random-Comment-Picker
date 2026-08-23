/**
 * decodeAudioData() resamples decoded PCM to the AudioContext's own output
 * rate (spec-mandated — see the Web Audio API decodeAudioData algorithm),
 * so the resulting AudioBuffer's `sampleRate` is NOT the source file's
 * native rate; it's whatever the browser's audio hardware happens to run
 * at (commonly 48000Hz regardless of the file). Reporting that as "the
 * file's sample rate" would be exactly the kind of fabricated-looking data
 * this project avoids, so this reads the real value straight from each
 * format's own header bytes instead. Returns null for formats it doesn't
 * know how to parse — callers should omit the field rather than guess.
 */
export function sniffSampleRate(buffer: ArrayBuffer): number | null {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (isAscii(bytes, 0, "RIFF") && isAscii(bytes, 8, "WAVE")) {
    return parseWav(view);
  }
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return parseMp3(bytes, 0);
  }
  const id3Rate = tryMp3AfterId3(bytes);
  if (id3Rate !== null) return id3Rate;

  const oggRate = parseOggVorbis(bytes);
  if (oggRate !== null) return oggRate;

  return null;
}

function isAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function parseWav(view: DataView): number | null {
  let offset = 12;
  while (offset + 8 <= view.byteLength) {
    const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
    const size = view.getUint32(offset + 4, true);
    if (id === "fmt " && offset + 8 + 8 <= view.byteLength) {
      return view.getUint32(offset + 8 + 4, true);
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

const MP3_SAMPLE_RATES: Record<number, number[]> = {
  0b00: [11025, 12000, 8000], // MPEG 2.5
  0b10: [22050, 24000, 16000], // MPEG 2
  0b11: [44100, 48000, 32000], // MPEG 1
};

function parseMp3(bytes: Uint8Array, offset: number): number | null {
  if (offset + 2 >= bytes.length) return null;
  const b1 = bytes[offset + 1];
  const b2 = bytes[offset + 2];
  const versionBits = (b1 >> 3) & 0b11;
  const rateIndex = (b2 >> 2) & 0b11;
  const table = MP3_SAMPLE_RATES[versionBits];
  if (!table || rateIndex === 3) return null;
  return table[rateIndex] ?? null;
}

function tryMp3AfterId3(bytes: Uint8Array): number | null {
  if (!isAscii(bytes, 0, "ID3")) return null;
  const size =
    ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
  const start = 10 + size;
  for (let i = start; i < Math.min(start + 4096, bytes.length - 1); i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
      return parseMp3(bytes, i);
    }
  }
  return null;
}

function parseOggVorbis(bytes: Uint8Array): number | null {
  // Search for the Vorbis identification header packet marker (0x01 "vorbis")
  // rather than fully parsing OGG page framing — it's always in the first
  // page and this is far simpler while remaining exact once found.
  const marker = [0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73]; // \x01 vorbis
  const searchLimit = Math.min(bytes.length - marker.length - 5, 65536);
  for (let i = 0; i < searchLimit; i++) {
    let matched = true;
    for (let j = 0; j < marker.length; j++) {
      if (bytes[i + j] !== marker[j]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      const sampleRateOffset = i + marker.length + 4 + 1; // skip marker + vorbis_version(4) + audio_channels(1)
      if (sampleRateOffset + 4 > bytes.length) return null;
      return (
        bytes[sampleRateOffset] |
        (bytes[sampleRateOffset + 1] << 8) |
        (bytes[sampleRateOffset + 2] << 16) |
        (bytes[sampleRateOffset + 3] << 24)
      );
    }
  }
  return null;
}
