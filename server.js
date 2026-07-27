const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;

// This app has no business logic of its own — it's a React SPA shell (a
// unified bottom-tab-bar app: Home / My Bookings / Profile) calling the main
// SHADI SALOON backend (configured in public/config.js) over the network.
// Nothing here reads or writes any data directly. `npm run build` compiles
// src/ + index.html into dist/ via Vite; this server only ever serves that
// build output, never src/ directly. The legacy branch.html/customer.html/
// branch.js/customer.js pages, and later the original vanilla-JS app.html/
// app.js/app.css/i18n.js (superseded by the React rewrite, kept for
// reference in legacy-vanilla-app/), were removed from here for the same
// reason: anything reachable through express.static keeps serving forever
// once it's forgotten about, even after the real app has moved on. Do not
// add stand-alone files under public/ unless they're meant to ship in dist/
// as-is (Vite copies public/ verbatim) — there is no routing indirection to
// rely on to keep something unreachable.
const DIST_DIR = path.join(__dirname, "dist");

app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","SAMEORIGIN");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  next();
});

// config.js is the one file people edit by hand and need to see take effect
// immediately — never let the browser (or a service worker) serve a stale
// cached copy of it.
app.get("/config.js",(req,res)=>{
  res.setHeader("Cache-Control","no-store, no-cache, must-revalidate");
  res.sendFile(path.join(DIST_DIR,"config.js"));
});

// Vite content-hashes everything under dist/app-build/ (e.g.
// index-a1b2c3.js) — a new build always produces new filenames, so these can
// be cached indefinitely with no staleness risk. Everything else (index.html,
// config.js, manifest.json, and the unhashed icons/logo under /assets/) stays
// on normal/no caching via the routes above/below instead.
app.use("/app-build", express.static(path.join(DIST_DIR, "app-build"), { immutable: true, maxAge: "1y" }));

app.use(express.static(DIST_DIR));

app.get("/health",(req,res)=>res.status(200).type("text/plain").send("OK"));

app.get("/customer",(req,res)=>res.sendFile(path.join(DIST_DIR,"index.html")));
app.get("/branches",(req,res)=>res.sendFile(path.join(DIST_DIR,"index.html")));
app.get("/branch",(req,res)=>res.sendFile(path.join(DIST_DIR,"index.html")));
app.get("/branch/:id",(req,res)=>res.sendFile(path.join(DIST_DIR,"index.html")));
app.get("/",(req,res)=>res.sendFile(path.join(DIST_DIR,"index.html")));
app.get("*",(req,res)=>res.sendFile(path.join(DIST_DIR,"index.html")));

app.use((err,req,res,next)=>{
  console.error("Unhandled request error:", err);
  if(res.headersSent) return next(err);
  res.status(500).json({error:"Internal server error"});
});
process.on("uncaughtException",(err)=>{ console.error("Uncaught exception — restarting process:", err); process.exit(1); });
process.on("unhandledRejection",(reason)=>{ console.error("Unhandled promise rejection — restarting process:", reason); process.exit(1); });

app.listen(PORT,()=>console.log(`SHADI SALOON customer app running on http://localhost:${PORT}`));
