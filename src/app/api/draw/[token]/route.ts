import { NextResponse } from "next/server";
import { decodeDrawToken } from "@/core/verification/token";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const record = await decodeDrawToken(token);
    if (!record) {
      throw new ApiError("not-found", "This draw result couldn't be verified. The link may be invalid or corrupted.");
    }
    return NextResponse.json({ record, verified: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
