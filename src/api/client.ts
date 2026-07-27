import { API_BASE } from "./config";

/** fetch() itself throws for offline/DNS/CORS failures, before there's even
 * a response to read. Those have nothing to do with the backend's business
 * logic, so they're always surfaced as this one type regardless of cause. */
export class NetworkError extends Error {
  constructor() {
    super("network");
    this.name = "NetworkError";
  }
}

/** The backend answered, but with a non-2xx status. `serverMessage` is
 * whatever `error` string it sent (if any) — the backend is a separate
 * project we don't fully control, so we pass its message through as-is
 * rather than trying to map every possible string it might send. It may be
 * English even in an Arabic UI; that's a known limitation tracked until the
 * backend adopts a stable `code` field callers here could map 1:1. */
export class ApiError extends Error {
  serverMessage?: string;
  status: number;
  constructor(status: number, serverMessage?: string) {
    super(serverMessage || "api_error");
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

/** Resolves any error api() can throw into a string to show the user.
 * `tr` is injected rather than imported so this module doesn't need to know
 * about the current language — callers (the store, mostly) already have it. */
export function resolveErrorMessage(err: unknown, tr: (key: "errNetwork" | "errGeneric") => string): string {
  if (err instanceof NetworkError) return tr("errNetwork");
  if (err instanceof ApiError) return err.serverMessage || tr("errGeneric");
  if (err instanceof DOMException && err.name === "AbortError") return "";
  return tr("errGeneric");
}

export interface ApiOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  token?: string;
}

export async function api<T>(url: string, opt: ApiOptions = {}): Promise<T> {
  const { token, ...rest } = opt;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opt.headers || {}) };
  if (token) headers["x-customer-token"] = token;

  let res: Response;
  try {
    res = await fetch(API_BASE + url, { ...rest, headers });
  } catch (networkErr) {
    if (networkErr instanceof DOMException && networkErr.name === "AbortError") throw networkErr;
    throw new NetworkError();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, typeof data?.error === "string" ? data.error : undefined);
  }
  return data as T;
}
