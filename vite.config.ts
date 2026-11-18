import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: true,
    rolldownOptions: {
      input: ["index.html", "experience/index.html", "projects/index.html", "contact/index.html"],
    },
  },
});
