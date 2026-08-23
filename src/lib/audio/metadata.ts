import { sniffSampleRate } from "./sniff-sample-rate";

export interface AudioMetadata {
  duration: number;
  /** Null when the format isn't one sniffSampleRate() knows how to parse — never a guess. */
  sampleRate: number | null;
  numberOfChannels: number;
}

/**
 * Decodes just enough of the file to read its real duration/channel count
 * via the Web Audio API — no server round-trip, no guessing from the
 * container's declared bitrate. Deliberately doesn't attempt to read
 * embedded ID3/Vorbis tags (artist, title, ...): that needs real
 * tag-format parsing this doesn't do, and showing blank or guessed tag
 * fields would violate the no-fake-data rule.
 *
 * Sample rate is NOT read from the decoded AudioBuffer: decodeAudioData()
 * resamples to the AudioContext's own output rate per spec, so
 * buffer.sampleRate reflects the browser's audio hardware, not the file.
 * sniffSampleRate() reads it from the file's own header bytes instead.
 */
export async function loadAudioMetadata(file: File): Promise<AudioMetadata> {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const sampleRate = sniffSampleRate(arrayBuffer.slice(0));
    const buffer = await context.decodeAudioData(arrayBuffer);
    return {
      duration: buffer.duration,
      sampleRate,
      numberOfChannels: buffer.numberOfChannels,
    };
  } catch {
    throw new Error("We couldn't read that as an audio file. Try a different file.");
  } finally {
    context.close();
  }
}

export function channelLabel(count: number): string {
  if (count === 1) return "Mono";
  if (count === 2) return "Stereo";
  return `${count} channels`;
}
