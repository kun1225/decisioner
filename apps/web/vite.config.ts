import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import type {PluginOption} from 'vite';
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const isTest = process.env.VITEST === 'true'

const config = defineConfig({
  define: {
    __DEVTOOLS_ENABLED__: JSON.stringify(process.env.VITEST !== 'true'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    isTest ? null : devtools(),
    isTest ? null : nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    isTest ? null : tailwindcss(),
    isTest ? null : tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ].filter(Boolean) as Array<PluginOption>,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setup-tests.ts',
  },
})

export default config
