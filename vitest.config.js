import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    css: false,
    testTimeout: 30000,
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
    },
  },
})
