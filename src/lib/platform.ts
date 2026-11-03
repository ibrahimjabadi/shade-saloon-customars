// Which phone look to use: iOS (frosted tab bar, large titles, sheets with
// a grabber) or Android (Material 3: pill nav indicator, floating action
// button, ripple). Detected from the device; ?platform=ios|android|desktop
// overrides it (the side-by-side preview page uses that). The query string
// survives hash navigation, so the choice holds for the whole visit.
export type Platform = "ios" | "android" | "desktop";

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function initPlatform(): Platform {
  const q = new URLSearchParams(location.search).get("platform") as Platform | null;
  const p = q && ["ios", "android", "desktop"].includes(q) ? q : detect();
  document.documentElement.dataset.platform = p;
  if (new URLSearchParams(location.search).get("frame")) document.documentElement.dataset.frame = p;
  return p;
}

/** Short tap feedback on phones that support it (Android). */
export function haptic() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* not supported */
  }
}
