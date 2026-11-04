import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom is used for testing React components in a simulated browser environment,
    // which allows for testing DOM manipulation and component rendering without needing a real browser.
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})