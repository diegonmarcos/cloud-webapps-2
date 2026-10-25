import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages subpath — published at https://diegonmarcos.github.io/tldraw/
export default defineConfig({
  plugins: [react()],
  base: '/tldraw/',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
