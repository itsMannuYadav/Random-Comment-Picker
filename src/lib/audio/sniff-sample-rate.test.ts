import { describe, expect, it } from "vitest";
import { sniffSampleRate } from "./sniff-sample-rate";

function buildWav(sampleRate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44);
  const view = new DataView(buf);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeAscii(0, "RIFF");
  view.setUint32(4, 36, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 2, true); // channels
  view.setUint32(24, sampleRate, true);
  writeAscii(36, "data");
  view.setUint32(40, 0, true);
  return buf;
}

function buildOggVorbis(sampleRate: number): ArrayBuffer {
  const marker = [0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73]; // \x01 vorbis
  const bytes = new Uint8Array(marker.length + 4 + 1 + 4);
  bytes.set(marker, 0);
  // vorbis_version (4 bytes, all zero) already at marker.length
  bytes[marker.length + 4] = 2; // channels
  const rateOffset = marker.length + 5;
  bytes[rateOffset] = sampleRate & 0xff;
  bytes[rateOffset + 1] = (sampleRate >> 8) & 0xff;
  bytes[rateOffset + 2] = (sampleRate >> 16) & 0xff;
  bytes[rateOffset + 3] = (sampleRate >> 24) & 0xff;
  return bytes.buffer;
}

describe("sniffSampleRate", () => {
  it("reads a WAV file's fmt chunk directly", () => {
    expect(sniffSampleRate(buildWav(44100))).toBe(44100);
    expect(sniffSampleRate(buildWav(96000))).toBe(96000);
  });

  it("reads an MPEG1 Layer III frame header (44100Hz)", () => {
    const bytes = new Uint8Array([0xff, 0xfb, 0x10, 0x00]);
    expect(sniffSampleRate(bytes.buffer)).toBe(44100);
  });

  it("reads an MPEG2 Layer III frame header (22050Hz)", () => {
    const bytes = new Uint8Array([0xff, 0xf3, 0x00, 0x00]);
    expect(sniffSampleRate(bytes.buffer)).toBe(22050);
  });

  it("skips a leading ID3v2 tag to find the first MP3 frame", () => {
    const bytes = new Uint8Array([
      ...[0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0, 0, 0, 0], // "ID3", size=0 (synchsafe)
      0xff, 0xfb, 0x10, 0x00, // 44100Hz frame right after the (empty) tag
    ]);
    expect(sniffSampleRate(bytes.buffer)).toBe(44100);
  });

  it("reads an OGG Vorbis identification header", () => {
    expect(sniffSampleRate(buildOggVorbis(48000))).toBe(48000);
  });

  it("returns null for an unrecognized format", () => {
    expect(sniffSampleRate(new Uint8Array([1, 2, 3, 4]).buffer)).toBeNull();
  });
});
