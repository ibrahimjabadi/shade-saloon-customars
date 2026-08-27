SHADI SALOON — Standalone Customer App

This is a fully separate app from the main SHADI SALOON admin/backend
project. It contains only the customer-facing pages:

  /customer   → the booking wizard (account, branch, services, barber, time)
  /branches   → all-branches showcase (browse without booking)
  /branch/:id → a single branch's public profile (photos, services, staff)

It has NO business logic and NO data of its own — every page calls the
main SHADI SALOON backend over the network for everything (branches,
services, availability, bookings, staff, photos). Because of that, this
app is completely stateless, which means it can safely run on Render's
FREE plan (unlike the main backend, which needs a paid plan + persistent
disk since it actually stores data).

---

REQUIRED SETUP — do this before deploying

Open public/config.js and set it to your actual backend's URL:

    window.SHADI_API_BASE = "https://your-backend-url.onrender.com";

That's the only thing that needs to change. Everything else works as-is.

The main backend must also allow this app to call it. This is already
handled on the backend side (server.js there has CORS enabled specifically
for the customer/public routes this app needs — nothing to configure
there unless you want to restrict it to your exact domain instead of
allowing any origin, via the CORS_ALLOWED_ORIGIN environment variable on
the backend).

---

TECH STACK (v2 — React + Vite + TypeScript)

The customer-facing app itself (everything under src/) is a React 18 +
TypeScript single-page app, bundled with Vite. server.js is unchanged in
spirit: a thin Express server with no business logic, whose only job is to
serve the built app and fall back to it for client-side routing. The
original hand-rolled vanilla-JS version (no build step, no framework) was
kept for a while under legacy-vanilla-app/ for reference, then removed
once the React port had settled — see git history before this line was
added if you ever need to look back at it.

  index.html   → Vite's entry point (was public/app.html)
  src/         → the React app (was public/app.js, public/app.css, public/i18n.js)
  public/      → files copied as-is into the build: config.js, manifest.json,
                 sw.js, assets/ (icons, logo) — NOT built/bundled
  dist/        → build output (git-ignored); this is what server.js serves

---

RUN LOCALLY (development)

1. npm install
2. Edit public/config.js as described above (point it at your backend,
   or leave it pointing at the deployed backend — the dev server proxies
   /api requests to http://localhost:3000 by default if you're also running
   the main backend locally; override with VITE_DEV_API_PROXY=<url>)
3. npm run dev
4. Open http://localhost:5173 (Vite's dev server, with hot reload)

---

RUN LOCALLY (production build — what actually gets deployed)

1. npm install
2. Edit public/config.js as described above
3. npm run build   (type-checks with tsc, then bundles with Vite into dist/)
4. npm start        (starts server.js, which serves dist/)
5. Open http://localhost:3001

---

DEPLOY TO RENDER

Push this folder to its own Git repository (separate from the main
backend's repository), then create a new Blueprint on Render pointing at
it — render.yaml is already set up (free plan, since this app is
stateless) and its buildCommand runs `npm install && npm run build` before
`npm start`. Remember to edit public/config.js to point at your real,
already-deployed backend URL before pushing — config.js is copied into
dist/ unchanged by the build and can still be hand-edited after deploying
without a rebuild, exactly like before.

---

WHY SEPARATE FROM THE MAIN APP

The main project (server.js + the admin panel) also includes its own
copies of these same customer-facing files, served from the same origin
— that setup still works completely fine as a single combined deployment
if that's simpler for you. This standalone package exists for when you
specifically want the customer-facing experience deployed independently
(its own domain, its own scaling, deployed/updated on its own schedule),
completely decoupled from the admin backend's deployment.
