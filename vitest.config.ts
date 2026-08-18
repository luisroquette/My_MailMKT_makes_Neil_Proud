import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { include: ["nucleo/**/*.test.ts", "motores/**/*.test.ts", "integracoes/**/*.test.ts", "adapters/**/*.test.ts"] },
});
