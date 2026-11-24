import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // All rules tests share one emulator database.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
