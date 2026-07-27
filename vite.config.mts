import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies /api to a local backend so `npm run dev` can talk to
// a same-origin backend without CORS. In production, public/config.js sets
// window.SHADI_API_BASE to the real backend URL instead — this proxy is a
// dev-only convenience, not part of the deployed app's runtime behavior.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind all interfaces, not just localhost — needed inside containers/WSL/sandboxes
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // public/assets/ (logo, icons — unhashed, copied by Vite as-is) already
    // owns the "/assets" URL. Building the app's own content-hashed JS/CSS
    // into a differently-named directory keeps the two apart, so the two can
    // get very different Cache-Control treatment in server.js: the hashed
    // build output is safe to cache forever, the unhashed icons are not.
    assetsDir: "app-build",
  },
});
