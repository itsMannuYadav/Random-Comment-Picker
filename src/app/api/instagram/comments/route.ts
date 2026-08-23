import { NextRequest, NextResponse } from "next/server";
import { getAllInstagramComments } from "@/integrations/instagram";
import { apiErrorResponse, ApiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const mediaId = req.nextUrl.searchParams.get("mediaId");
    if (!mediaId) throw new ApiError("invalid-request", "An Instagram media ID is required.");

    // No account-connection flow exists yet — always fails honestly with a clear reason.
    const comments = await getAllInstagramComments(mediaId, undefined);
    return NextResponse.json({ comments, totalFetched: comments.length });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
