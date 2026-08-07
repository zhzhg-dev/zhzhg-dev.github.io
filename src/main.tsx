import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { type PageName } from "./App";
import "./styles.css";

document.documentElement.classList.add("js");

const requestedPage = document.body.dataset.page;
const page: PageName =
  requestedPage === "experience" || requestedPage === "projects"
    ? requestedPage
    : "home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App page={page} />
  </StrictMode>,
);
