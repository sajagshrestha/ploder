export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      json.error ?? `Request failed (${response.status})`,
      response.status,
    );
  }
  return json as T;
}

export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
