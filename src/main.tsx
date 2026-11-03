import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installDigitNormalizer } from "./lib/digits";
import { initPlatform } from "./lib/platform";
import "./styles/app.css";
import "./styles/screens.css";
import "./styles/platform.css";

initPlatform();
installDigitNormalizer();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
