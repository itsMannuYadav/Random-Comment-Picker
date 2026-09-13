"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Link2, Puzzle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UrlInput } from "./url-input";

const AUTO_ADVANCE_MS = 6000;

/** Generic "paste something, land on the tool with it already filled in" form —
 * every non-comment-picker slide shares this shape, just with a different
 * destination tool and placeholder. */
function NavigateForm({
  placeholder,
  buttonLabel,
  buildHref,
  multiline,
}: {
  placeholder: string;
  buttonLabel: string;
  buildHref: (value: string) => string;
  multiline?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(buildHref(value.trim()));
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-3 px-3 py-2">
          <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          )}
        </div>
        <Button type="submit" size="lg" disabled={!value.trim()} className="w-full sm:w-auto">
          {buttonLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ExtensionPromoContent() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Button asChild size="lg">
        <Link href="/extension">
          <Puzzle className="h-4 w-4" /> Get the Extension <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">Free · Works right on the page you&rsquo;re browsing</p>
    </div>
  );
}

interface HeroSlide {
  id: string;
  badge: string;
  title: React.ReactNode;
  description: string;
  content: React.ReactNode;
}

const SLIDES: HeroSlide[] = [
  {
    id: "comment-picker",
    badge: "Flagship tool",
    title: (
      <>
        Everything creators need,
        <br />
        in one place.
      </>
    ),
    description:
      "Pick winners, work with thumbnails, prepare media, clean URLs and more - all from one fast toolkit. Start with the flagship: a fair, cryptographically verifiable comment picker.",
    content: <UrlInput />,
  },
  {
    id: "thumbnail-downloader",
    badge: "Thumbnail Downloader",
    title: (
      <>
        Grab any thumbnail,
        <br />
        in seconds.
      </>
    ),
    description:
      "Download the thumbnail from a YouTube video, Reddit post, Vimeo video, or any webpage - YouTube shows every resolution actually confirmed available.",
    content: (
      <NavigateForm
        placeholder="Paste any video/post URL - YouTube, Reddit, Vimeo, or any website"
        buttonLabel="Get Thumbnail"
        buildHref={(value) => `/tools/thumbnail-downloader?url=${encodeURIComponent(value)}`}
      />
    ),
  },
  {
    id: "video-downloader",
    badge: "Video Downloader",
    title: (
      <>
        Download the video,
        <br />
        not just the link.
      </>
    ),
    description:
      "Paste any public video URL - Reddit, Vimeo, a direct file, or any webpage that embeds a video. Only real formats are shown, never fake resolutions.",
    content: (
      <NavigateForm
        placeholder="Paste any video URL - YouTube, Reddit, Vimeo, or any website"
        buttonLabel="Download Video"
        buildHref={(value) => `/tools/video-downloader?url=${encodeURIComponent(value)}`}
      />
    ),
  },
  {
    id: "qr-generator",
    badge: "QR Generator",
    title: (
      <>
        Turn any link into
        <br />a scannable code.
      </>
    ),
    description:
      "Generate a QR code for a link, video, or any text - processed entirely in your browser, nothing ever uploaded.",
    content: (
      <NavigateForm
        placeholder="Paste a URL or type any text"
        buttonLabel="Generate QR"
        buildHref={(value) => `/tools/qr-generator?text=${encodeURIComponent(value)}`}
        multiline
      />
    ),
  },
  {
    id: "extension",
    badge: "New: Browser Extension",
    title: (
      <>
        Take MySocial
        <br />
        with you.
      </>
    ),
    description:
      "Pick comment winners, download video, and grab thumbnails right from the page you're browsing - YouTube, Reddit, Instagram and more. No copying links back here.",
    content: <ExtensionPromoContent />,
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Paused only while the user is actually typing into a slide's input --
  // auto-advance must not yank their in-progress input away.
  const pausedRef = useRef(false);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
  }

  // Only ever set up once — resetTimer reads index via the updater form, not a stale closure.
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goTo(i: number) {
    setIndex((i + SLIDES.length) % SLIDES.length);
    resetTimer();
  }

  function handleFocus() {
    pausedRef.current = true;
  }

  /** Only resume once focus actually leaves the carousel entirely — not
   * when it just moves between two elements inside it (e.g. tabbing from
   * the input to its submit button). */
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    pausedRef.current = false;
  }

  const slide = SLIDES[index];

  return (
    <div className="flex w-full flex-col items-center gap-8" onFocus={handleFocus} onBlur={handleBlur}>
      {/* key={slide.id} remounts this on every slide change, restarting the
          CSS animation — no manual opacity state/effect needed. */}
      <div key={slide.id} className="hero-slide-fade flex w-full flex-col items-center gap-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> {slide.badge}
        </span>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">{slide.title}</h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">{slide.description}</p>
        {slide.content}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => goTo(index - 1)}
          className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show ${s.badge}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-border"}`}
          />
        ))}
        <button
          type="button"
          aria-label="Next"
          onClick={() => goTo(index + 1)}
          className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
