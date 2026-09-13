import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "invalid-url"
  | "unsupported-platform"
  | "not-found"
  | "comments-disabled"
  | "requires-connection"
  | "quota-exceeded"
  | "rate-limited"
  | "forbidden"
  | "not-configured"
  | "invalid-request"
  | "unknown";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  "invalid-url": 400,
  "unsupported-platform": 400,
  "not-found": 404,
  "comments-disabled": 403,
  "requires-connection": 401,
  "quota-exceeded": 429,
  "rate-limited": 429,
  forbidden: 403,
  "not-configured": 503,
  "invalid-request": 400,
  unknown: 500,
};

export class ApiError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/** Converts any thrown error into a clean, human-friendly JSON response — never a stack trace. */
export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status ?? STATUS_BY_CODE[error.code] }
    );
  }

  // Known integration error classes carry their own message + status but aren't ApiError instances.
  const asIntegrationError = error as { name?: string; message?: string; kind?: string; status?: number };
  if (asIntegrationError && typeof asIntegrationError.message === "string" && asIntegrationError.kind) {
    const code = mapIntegrationKind(asIntegrationError.kind);
    return NextResponse.json(
      { error: { code, message: asIntegrationError.message } },
      { status: asIntegrationError.status ?? STATUS_BY_CODE[code] }
    );
  }

  console.error("[apiErrorResponse] Unhandled error type:", error);
  return NextResponse.json(
    { error: { code: "unknown" as ApiErrorCode, message: "Something went wrong. Please try again." } },
    { status: 500 }
  );
}

function mapIntegrationKind(kind: string): ApiErrorCode {
  switch (kind) {
    case "not-found":
      return "not-found";
    case "comments-disabled":
      return "comments-disabled";
    case "quota-exceeded":
      return "quota-exceeded";
    case "rate-limited":
      return "rate-limited";
    case "forbidden":
      return "forbidden";
    case "not-connected":
      return "requires-connection";
    case "invalid-request":
      return "not-configured";
    case "not-a-video":
      return "invalid-request";
    default:
      return "unknown";
  }
}
