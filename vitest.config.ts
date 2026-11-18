import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
  resolve: {
    alias: { "@rht/shared": resolve("packages/shared/src/index.ts") },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
