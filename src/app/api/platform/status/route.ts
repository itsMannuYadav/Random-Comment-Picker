import { NextResponse } from "next/server";
import { getCredentialStatus } from "@/lib/env.server";
import { PLATFORM_STATUS } from "@/lib/platform-status";
import { ALL_PLATFORMS } from "@/types/platform";

/**
 * Merges static implementation status with live credential presence, so the
 * UI can honestly say "needs YOUTUBE_API_KEY" instead of just failing at
 * draw time. This is safe to expose publicly — it reports booleans, never
 * the credential values themselves.
 */
export async function GET() {
  const credentials = getCredentialStatus();

  const platforms = ALL_PLATFORMS.map((platform) => {
    const info = PLATFORM_STATUS[platform];
    const cred = platform in credentials ? credentials[platform as keyof typeof credentials] : undefined;

    return {
      platform,
      ...info,
      credentialsConfigured: cred?.configured ?? true,
      missingEnvVars: cred ? Object.entries(cred.required).filter(([, ok]) => !ok).map(([name]) => name) : [],
    };
  });

  return NextResponse.json({ platforms });
}
