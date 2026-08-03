import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest runs the platform-agnostic layer only: content, SRS, learning, and course
 * data. Those files import nothing from React Native, so they run in plain Node with
 * no native mocking. Component tests will need a separate environment once UI exists.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
