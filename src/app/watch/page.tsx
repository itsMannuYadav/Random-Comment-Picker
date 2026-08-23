import { redirect, notFound } from "next/navigation";
import { isValidYouTubeVideoId } from "@/integrations/youtube/parser";

export default async function WatchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  if (!v || !isValidYouTubeVideoId(v)) notFound();
  redirect(`/y/${v}`);
}
