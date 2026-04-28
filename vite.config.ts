import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Use terser instead of esbuild to avoid $ variable name collision
    // esbuild minifies $ as local var which collides with React internals
    minify: 'terser',
    terserOptions: {
      mangle: {
        // Reserve $ and other common names from mangling
        reserved: ['$', '_'],
      },
    },
    cssCodeSplit: false,
  },
})
