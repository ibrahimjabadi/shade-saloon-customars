/** Keeps Tab-key focus cycling inside whichever modal is currently open,
 * instead of letting it escape to the page content behind it. Pure DOM, no
 * React state — deliberately so: this needs to reason about which overlay is
 * *actually* topmost in the DOM right now (year-calendar modal, portalled to
 * body, vs. the booking/reschedule overlay underneath it), which is a
 * question about rendered output, not component state. */
export function trapTabKey(e: KeyboardEvent, containerSelector: string): boolean {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) return false;
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
  if (!focusables.length) return false;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!container.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
    return true;
  }
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return true;
}
