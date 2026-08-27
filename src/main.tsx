import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/shared.css";
import "./styles/home.css";
import "./styles/pick.css";
import "./styles/label.css";
import "./styles/train.css";
import "./styles/test.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
