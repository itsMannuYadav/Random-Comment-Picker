import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidYouTubeVideoId } from "@/integrations/youtube/parser";
import { decodeDrawToken } from "@/core/verification/token";
import { PageShell } from "@/components/layout/page-shell";
import { YouTubePickerClient } from "./youtube-picker-client";

export const metadata: Metadata = {
  title: "Pick a YouTube comment winner",
  description: "Fetch comments from a YouTube video and randomly select a fair winner.",
};

interface PageProps {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ resume?: string }>;
}

export default async function YouTubePickerPage({ params, searchParams }: PageProps) {
  const { videoId } = await params;
  const { resume: resumeToken } = await searchParams;

  if (!isValidYouTubeVideoId(videoId)) notFound();

  const resumeRecord = resumeToken ? await decodeDrawToken(resumeToken) : null;

  return (
    <PageShell wide>
      <YouTubePickerClient
        videoId={videoId}
        resume={resumeRecord && resumeToken ? { token: resumeToken, record: resumeRecord } : undefined}
      />
    </PageShell>
  );
}
