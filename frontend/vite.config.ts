import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Ignore both Next.js specific imports during Vite compilation
      external: ['next/navigation', 'next/link']
    },
    outDir: 'dist',
    sourcemap: false,
  },
})