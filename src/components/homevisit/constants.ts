/** Placeholder flat travel fee shown to the customer before booking, until
 * the backend has real pricing config (flat or distance-tiered — see the
 * home-visit API contract handed off separately). Not enforced anywhere
 * server-side; purely informational so the estimated total isn't just the
 * services subtotal. Change this once real pricing exists, or better,
 * replace its usage with a call to the future /api/home-visit/quote. */
export const PROVISIONAL_TRAVEL_FEE = 3;
