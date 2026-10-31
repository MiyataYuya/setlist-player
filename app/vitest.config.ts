import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const mocksDir = path.resolve(__dirname, "src/test/__mocks__");

// 日付の扱いはJST固定（src/data/jstDate.ts）。JSTでもUTCでもないゾーンで走らせることで、
// 「JSTを指定し忘れた」と「UTCで組んだ日付をローカルのフィールドで読んだ」の
// 両方のタイムゾーン依存バグを検出できる（UTC固定だと後者が素通りする）。
process.env.TZ = "America/Los_Angeles";

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
