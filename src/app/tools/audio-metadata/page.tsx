"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/ui/tool-card";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { loadAudioMetadata, channelLabel, type AudioMetadata } from "@/lib/audio/metadata";
import { formatBytes } from "@/lib/image/format";
import { formatTimestamp } from "@/lib/video/frame";
import { getRelatedTools } from "@/config/tools";
import { CATEGORY_BY_ID } from "@/config/categories";

const related = getRelatedTools("audio-metadata");
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024; // decodeAudioData holds the full decoded PCM in memory

export default function AudioMetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<AudioMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(selected: File) {
    setError(null);
    setMeta(null);
    setFile(selected);
    setLoading(true);
    try {
      const info = await loadAudioMetadata(selected);
      setMeta(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that audio file.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setMeta(null);
    setError(null);
  }

  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-8 text-xs text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_BY_ID.audio.href} className="hover:text-foreground">Audio</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Audio Metadata</span>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Audio Metadata</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Inspect an audio file&rsquo;s real duration, sample rate and channel count — decoded
          entirely in your browser.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {!file && (
          <FileDropzone onFile={handleFile} accept="audio/" kind="audio" maxSizeBytes={MAX_AUDIO_SIZE_BYTES} />
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}

        {file && (
          <Card className="flex flex-col gap-4 p-6">
            <div>
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {file.type || "Unknown type"} · {formatBytes(file.size)}
              </p>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Decoding…</p>}

            {meta && (
              <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</dt>
                  <dd className="mt-0.5">{formatTimestamp(meta.duration)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sample rate</dt>
                  <dd className="mt-0.5">{meta.sampleRate !== null ? `${meta.sampleRate.toLocaleString()} Hz` : "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</dt>
                  <dd className="mt-0.5">{channelLabel(meta.numberOfChannels)}</dd>
                </div>
              </dl>
            )}

            <Button variant="secondary" className="mt-2 w-full sm:w-auto" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Inspect Another
            </Button>
          </Card>
        )}
      </section>

      {related.length > 0 && (
        <section className="border-t border-border/70 bg-muted/30 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
