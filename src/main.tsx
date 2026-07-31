import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// BASE_URL is "/" standalone, or e.g. "/customer-app/" when mounted inside
// another app's server (see vite.config.mts) — registering at that prefix
// keeps the service worker's scope limited to this app's own pages/assets
// either way, never reaching up into a host app's routes.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
