"use client";

import { useEffect, useState } from "react";
import { Copy, PlugZap, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import type { GeneratorInput, GeneratorKind, GeneratorOutput } from "@/lib/ai/prompts";

export interface GeneratorField {
  key: keyof GeneratorInput;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
}

interface AiGeneratorToolProps {
  kind: GeneratorKind;
  fields: GeneratorField[];
  submitLabel: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
    >
      <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function GeneratorOutputView({ result }: { result: GeneratorOutput }) {
  switch (result.kind) {
    case "caption":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{result.caption}</p>
            <CopyButton text={result.caption} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {result.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-sm font-medium">{result.cta}</p>
            <CopyButton text={result.cta} />
          </div>
        </div>
      );
    case "title":
      return <ListOutput items={result.titles} />;
    case "hashtag":
      return <ListOutput items={result.hashtags} />;
    case "hook":
      return <ListOutput items={result.hooks} />;
    case "reply":
      return <ListOutput items={result.replies} />;
    case "description":
      return (
        <div className="flex items-start justify-between gap-3">
          <p className="whitespace-pre-wrap text-sm">{result.description}</p>
          <CopyButton text={result.description} />
        </div>
      );
  }
}

function ListOutput({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
          <span>{item}</span>
          <CopyButton text={item} />
        </li>
      ))}
    </ul>
  );
}

export function AiGeneratorTool({ kind, fields, submitLabel }: AiGeneratorToolProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [values, setValues] = useState<GeneratorInput>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratorOutput | null>(null);

  useEffect(() => {
    apiFetch<{ configured: boolean }>("/api/ai/status")
      .then((res) => setConfigured(res.configured))
      .catch(() => setConfigured(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await apiFetch<GeneratorOutput>("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, input: values }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (configured === null) {
    return (
      <Card className="flex items-center justify-center p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card className="flex flex-col items-center gap-3 px-8 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <PlugZap className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold">This tool requires an AI provider connection.</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This server hasn&rsquo;t been configured with AI credentials yet. Set{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AI_PROVIDER_API_KEY</code> in the
          environment to enable it.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {field.label}
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={3}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground"
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-normal text-foreground outline-none"
                >
                  <option value="">Any</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground"
                />
              )}
            </label>
          ))}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </form>

        {error && (
          <p className="mt-3 text-center text-sm text-muted-foreground" role="status">
            {error}
          </p>
        )}
      </Card>

      {result && (
        <Card className="p-5">
          <GeneratorOutputView result={result} />
        </Card>
      )}
    </div>
  );
}
