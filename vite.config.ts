import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  root: "apps/patient",
  envDir: resolve("."),
  resolve: {
    alias: { "@rht/shared": resolve("packages/shared/src/index.ts") },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8787" },
  },
  build: { outDir: resolve("dist/patient"), emptyOutDir: true },
});
