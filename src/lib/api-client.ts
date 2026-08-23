export class ClientApiError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message || "Something went wrong. Please try again.";
    const code = body?.error?.code || "unknown";
    throw new ClientApiError(message, code);
  }

  return body as T;
}
