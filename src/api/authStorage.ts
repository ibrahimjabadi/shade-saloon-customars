import type { CustomerAccount } from "./types";

/* All customer-token/account persistence goes through this one object.
   Today it's localStorage (simplest option that works with a cross-origin
   backend without extra CORS/cookie coordination). It's XSS-exposed in
   principle, same as any localStorage-held credential — moving to an
   httpOnly cookie would remove that exposure, but requires the *backend* to
   set the cookie on register/login and to allow credentialed cross-origin
   requests (this app and its backend are typically on different domains).
   That's a backend-side change outside this package. Keeping every read/
   write behind these functions means that migration, whenever it happens,
   only touches this one spot instead of every call site. */
export const authStorage = {
  getToken(): string {
    return localStorage.getItem("customerToken") || "";
  },
  getAccount(): CustomerAccount | null {
    try {
      return JSON.parse(localStorage.getItem("customerAccount") || "null");
    } catch {
      return null;
    }
  },
  save(token: string, account: CustomerAccount) {
    localStorage.setItem("customerToken", token);
    localStorage.setItem("customerAccount", JSON.stringify(account));
  },
  clear() {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerAccount");
  },
};
