import { API_BASE } from "../api/config";

/** The backend stores uploaded photos (branch gallery, staff profile/
 * portfolio photos) as *relative* paths like "/uploads/branches/xyz.jpg" —
 * correct when the admin panel and the API are the same origin, but this
 * app is deployed on its own separate origin (see README), so a raw
 * relative path resolves against *this app's* domain instead and 404s.
 * Every backend-supplied image URL must go through this before use. */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  return API_BASE + url;
}
