import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../ui/styles.css";
import { PopupApp } from "./PopupApp";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Thiếu #root");
}
createRoot(root).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
