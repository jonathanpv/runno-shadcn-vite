import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import type { NextFunction } from 'connect'

// This plugin configures the necessary headers for cross-origin isolation
// which is required for SharedArrayBuffer used by Runno
const crossOriginPolicy = {
  name: "configure-server",
  configureServer(server: ViteDevServer) {
    server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), crossOriginPolicy],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

