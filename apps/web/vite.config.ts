import { execSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

function getWorktreeIndex() {
  try {
    const branch = execSync('git branch --show-current').toString().trim();
    const match = branch.match(/\d+/);
    return match ? Number(match[0]) : 0;
  } catch {
    return 0;
  }
}

const baseDevtoolsPort = 43000;
const index = getWorktreeIndex();
const defaultApiTarget = `http://localhost:${Number(process.env.API_PORT ?? 4000)}`;
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? defaultApiTarget;

const config = defineConfig({
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools({
      eventBusConfig: {
        port: baseDevtoolsPort + index,
      },
    }),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});

export default config;
