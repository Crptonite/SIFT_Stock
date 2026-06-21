import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Add 'next/navigation' to external modules so Vite ignores it
      external: ['next/navigation']
    },
    outDir: 'dist',
    sourcemap: false,
  },
})
