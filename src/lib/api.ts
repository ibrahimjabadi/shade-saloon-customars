// One door to the backend. The signed-in customer's session goes in
// x-customer-token (a separate track from staff logins). The server
// answers errors as {error:"<message>"} (Arabic, sometimes English), shown
// as-is; a failed fetch (offline, DNS) is its own NetworkError so it can
// get its own message. A 401 on a signed-in request means the session is
// gone: the app signs out locally.
declare global {
  interface Window {
    SHADI_API_BASE?: string;
  }
}

const BASE = (typeof window !== "undefined" && window.SHADI_API_BASE) || "";
const TOKEN_KEY = "shadi.c.token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public suggestion?: string,
  ) {
    super(message);
  }
}
export class NetworkError extends Error {
  constructor() {
    super("network");
  }
}

let token = localStorage.getItem(TOKEN_KEY) || "";
let onUnauthorized: () => void = () => {};

export const getToken = () => token;
export function setToken(t: string) {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

/** Uploaded photos come back as server paths (/uploads/...). */
export function media(url?: string | null) {
  if (!url) return "";
  return /^(https?:|data:|blob:)/.test(url) ? url : BASE + url;
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
      headers: { "Content-Type": "application/json", ...(token ? { "x-customer-token": token } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new NetworkError();
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized();
  if (!res.ok)
    throw new ApiError(
      typeof data?.error === "string" ? data.error : "",
      res.status,
      typeof data?.suggestion === "string" ? data.suggestion : undefined,
    );
  return data as T;
}
