import { defineConfig } from "vite";
export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/SANITY-404/",
  build: { target: "es2022", chunkSizeWarningLimit: 650 },
}));
