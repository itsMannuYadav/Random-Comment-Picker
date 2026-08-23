import type { Metadata } from "next";
import { decodeDrawToken } from "@/core/verification/token";
import { PageShell } from "@/components/layout/page-shell";
import { RedditPickerClient } from "./reddit-picker-client";

export const metadata: Metadata = {
  title: "Pick a Reddit comment winner",
  description: "Fetch comments from a Reddit post and randomly select a fair winner.",
};

interface PageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ subreddit?: string; resume?: string }>;
}

export default async function RedditPickerPage({ params, searchParams }: PageProps) {
  const { postId } = await params;
  const { subreddit, resume: resumeToken } = await searchParams;

  const resumeRecord = resumeToken ? await decodeDrawToken(resumeToken) : null;

  return (
    <PageShell wide>
      <RedditPickerClient
        postId={postId}
        subreddit={subreddit}
        resume={resumeRecord && resumeToken ? { token: resumeToken, record: resumeRecord } : undefined}
      />
    </PageShell>
  );
}
