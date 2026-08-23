"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/image/format";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — generous for a browser-side canvas op, bounded against accidental huge uploads

interface ImageDropzoneProps {
  onFile: (file: File) => void;
  className?: string;
}

export function ImageDropzone({ onFile, className }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndEmit(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`That file is too large — the limit is ${formatBytes(MAX_SIZE_BYTES)}.`);
      return;
    }
    setError(null);
    onFile(file);
  }

  return (
    <div className={className}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          validateAndEmit(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-6 py-12 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-muted/40"
        )}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Drag and drop an image, or click to browse</p>
        <p className="text-xs text-muted-foreground">Up to {formatBytes(MAX_SIZE_BYTES)} · processed entirely in your browser</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => validateAndEmit(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
