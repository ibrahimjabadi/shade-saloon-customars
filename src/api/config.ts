declare global {
  interface Window {
    SHADI_API_BASE?: string;
  }
}

// public/config.js sets this before the bundle runs (see index.html) so the
// backend URL can be changed post-deploy without a rebuild — same mechanism
// as the original vanilla-JS app, see README.
export const API_BASE: string =
  (typeof window !== "undefined" && window.SHADI_API_BASE) || "";
