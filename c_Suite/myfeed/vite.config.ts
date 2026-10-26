import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import compression from 'vite-plugin-compression'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/myfeed/',
  root: 'src',
  publicDir: '../public',
  plugins: [
    vue(),

    // Vue DevTools for better DX
    VueDevTools(),

    // Auto import Vue APIs
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core',
        {
          '@tanstack/vue-query': [
            'useQuery',
            'useMutation',
            'useQueryClient',
          ],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: [
        'src/composables',
        'src/stores',
      ],
      vueTemplate: true,
    }),

    // Auto import components
    Components({
      dts: 'src/components.d.ts',
      dirs: [
        'src/components',
      ],
      extensions: ['vue'],
    }),

    // Brotli compression for production
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'ui': ['@formkit/auto-animate', 'lucide-vue-next', 'vue-sonner'],
          'query': ['@tanstack/vue-query', '@sanity/client'],
          'content': ['marked', 'dompurify', 'shiki'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 8003,
    open: false,
  },
})
