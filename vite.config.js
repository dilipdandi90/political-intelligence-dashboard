import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // recharts is the bulk of the bundle; keep it in its own chunk so app code caches separately
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') ? 'charts' : undefined),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
    // Worker threads start much faster than child processes on Windows, and capping
    // parallelism stops slow/busy machines from hitting Vitest's fixed worker
    // start-up timeout ("Timeout waiting for worker to respond").
    pool: 'threads',
    maxWorkers: 4,
    include: ['src/**/*.test.{js,jsx}'], // e2e/ is run by Playwright, not Vitest
  },
})
