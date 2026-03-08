import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const mocksDir = path.resolve(__dirname, "src/test/__mocks__");

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: false,
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "virtual:songs": path.join(mocksDir, "virtualSongs.ts"),
      "virtual:performances": path.join(mocksDir, "virtualPerformances.ts"),
      "virtual:videos": path.join(mocksDir, "virtualVideos.ts"),
    },
  },
});
