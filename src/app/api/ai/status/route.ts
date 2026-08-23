import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai/provider";

/** Lets the client check up front whether to show the real tool or a "Requires API access" state. */
export async function GET() {
  return NextResponse.json({ configured: isAiConfigured() });
}
