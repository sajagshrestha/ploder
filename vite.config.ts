import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    allowedHosts: [
      "inherently-smooth-swift.ngrok-free.app",
      ".ngrok-free.app",
      ".ngrok.io",
    ],
  },
  plugins: [
    devtools(),
    nitro({
      preset: "vercel",
      rollupConfig: { external: [/^@sentry\//] },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
