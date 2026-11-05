import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { type PageName } from "./App";
import { LanguageProvider } from "./i18n";
import "./styles.css";

document.documentElement.classList.add("js");

const requestedPage = document.body.dataset.page;
const page: PageName =
  requestedPage === "experience" || requestedPage === "projects" || requestedPage === "contact"
    ? requestedPage
    : "home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider><App page={page} /></LanguageProvider>
  </StrictMode>,
);
