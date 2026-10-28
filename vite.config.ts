import { defineConfig } from "vite";
export default defineConfig(({ mode }) => ({
  base:
    mode === "development" ? "/" : mode === "desktop" ? "./" : "/SANITY-404/",
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
        },
      },
    },
  },
}));
