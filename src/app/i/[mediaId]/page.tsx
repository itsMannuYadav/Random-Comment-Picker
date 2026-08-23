import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { InstagramPickerClient } from "./instagram-picker-client";

export const metadata: Metadata = {
  title: "Pick an Instagram comment winner",
  description: "Instagram comment picking requires connecting a professional account.",
};

export default async function InstagramPickerPage({ params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;

  return (
    <PageShell wide>
      <InstagramPickerClient mediaId={mediaId} />
    </PageShell>
  );
}
