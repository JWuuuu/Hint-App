import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

const rawPort = process.env.PORT ?? "5173";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:5050";

function copyTarotDeckAssets() {
  let publicDir = "";
  let outDir = "";

  return {
    name: "copy-tarot-deck-assets",
    configResolved(config: { publicDir: string; build: { outDir: string } }) {
      publicDir = config.publicDir;
      outDir = config.build.outDir;
    },
    writeBundle() {
      const source = path.resolve(publicDir, "brand/tarot/decks");
      const destination = path.resolve(outDir, "brand/tarot/decks");
      if (!fs.existsSync(source)) return;
      fs.cpSync(source, destination, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), copyTarotDeckAssets()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
