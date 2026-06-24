import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      'next/link':       path.resolve('./src/lib/stubs/next-link.tsx'),
      'next/navigation': path.resolve('./src/lib/stubs/next-navigation.ts'),
      'next/router':     path.resolve('./src/lib/stubs/next-navigation.ts'),
      'next/headers':    path.resolve('./src/lib/stubs/next-headers.ts'),
      'next/server':     path.resolve('./src/lib/stubs/next-server.ts'),
    },
  },
})
