import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      convex: resolve(import.meta.dirname, "convex"),
    },
  },
  test: {
    include: ["**/*.test.{ts,tsx}", "**/*.browser.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
