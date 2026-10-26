// vite.config.ts
import { defineConfig } from "file:///home/diego/Documents/Git/front-Github_io/myfeed/node_modules/vite/dist/node/index.js";
import vue from "file:///home/diego/Documents/Git/front-Github_io/myfeed/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import AutoImport from "file:///home/diego/Documents/Git/front-Github_io/myfeed/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///home/diego/Documents/Git/front-Github_io/myfeed/node_modules/unplugin-vue-components/dist/vite.js";
import compression from "file:///home/diego/Documents/Git/front-Github_io/myfeed/node_modules/vite-plugin-compression/dist/index.mjs";
import VueDevTools from "file:///home/diego/Documents/Git/front-Github_io/myfeed/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_import_meta_url = "file:///home/diego/Documents/Git/front-Github_io/myfeed/vite.config.ts";
var vite_config_default = defineConfig({
  base: "/myfeed/",
  plugins: [
    vue(),
    // Vue DevTools for better DX
    VueDevTools(),
    // Auto import Vue APIs
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
        "@vueuse/core",
        {
          "@tanstack/vue-query": [
            "useQuery",
            "useMutation",
            "useQueryClient"
          ]
        }
      ],
      dts: "src/auto-imports.d.ts",
      dirs: [
        "src/composables",
        "src/stores"
      ],
      vueTemplate: true
    }),
    // Auto import components
    Components({
      dts: "src/components.d.ts",
      dirs: [
        "src/components"
      ],
      extensions: ["vue"]
    }),
    // Brotli compression for production
    compression({
      algorithm: "brotliCompress",
      ext: ".br"
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor": ["vue", "pinia"],
          "ui": ["@formkit/auto-animate", "lucide-vue-next", "vue-sonner"],
          "query": ["@tanstack/vue-query", "@sanity/client"],
          "content": ["marked", "dompurify", "shiki"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  },
  server: {
    port: 3e3,
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9kaWVnby9Eb2N1bWVudHMvR2l0L2Zyb250LUdpdGh1Yl9pby9teWZlZWRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2RpZWdvL0RvY3VtZW50cy9HaXQvZnJvbnQtR2l0aHViX2lvL215ZmVlZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9kaWVnby9Eb2N1bWVudHMvR2l0L2Zyb250LUdpdGh1Yl9pby9teWZlZWQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuaW1wb3J0IGNvbXByZXNzaW9uIGZyb20gJ3ZpdGUtcGx1Z2luLWNvbXByZXNzaW9uJ1xuaW1wb3J0IFZ1ZURldlRvb2xzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29scydcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6ICcvbXlmZWVkLycsXG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcblxuICAgIC8vIFZ1ZSBEZXZUb29scyBmb3IgYmV0dGVyIERYXG4gICAgVnVlRGV2VG9vbHMoKSxcblxuICAgIC8vIEF1dG8gaW1wb3J0IFZ1ZSBBUElzXG4gICAgQXV0b0ltcG9ydCh7XG4gICAgICBpbXBvcnRzOiBbXG4gICAgICAgICd2dWUnLFxuICAgICAgICAndnVlLXJvdXRlcicsXG4gICAgICAgICdwaW5pYScsXG4gICAgICAgICdAdnVldXNlL2NvcmUnLFxuICAgICAgICB7XG4gICAgICAgICAgJ0B0YW5zdGFjay92dWUtcXVlcnknOiBbXG4gICAgICAgICAgICAndXNlUXVlcnknLFxuICAgICAgICAgICAgJ3VzZU11dGF0aW9uJyxcbiAgICAgICAgICAgICd1c2VRdWVyeUNsaWVudCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBkdHM6ICdzcmMvYXV0by1pbXBvcnRzLmQudHMnLFxuICAgICAgZGlyczogW1xuICAgICAgICAnc3JjL2NvbXBvc2FibGVzJyxcbiAgICAgICAgJ3NyYy9zdG9yZXMnLFxuICAgICAgXSxcbiAgICAgIHZ1ZVRlbXBsYXRlOiB0cnVlLFxuICAgIH0pLFxuXG4gICAgLy8gQXV0byBpbXBvcnQgY29tcG9uZW50c1xuICAgIENvbXBvbmVudHMoe1xuICAgICAgZHRzOiAnc3JjL2NvbXBvbmVudHMuZC50cycsXG4gICAgICBkaXJzOiBbXG4gICAgICAgICdzcmMvY29tcG9uZW50cycsXG4gICAgICBdLFxuICAgICAgZXh0ZW5zaW9uczogWyd2dWUnXSxcbiAgICB9KSxcblxuICAgIC8vIEJyb3RsaSBjb21wcmVzc2lvbiBmb3IgcHJvZHVjdGlvblxuICAgIGNvbXByZXNzaW9uKHtcbiAgICAgIGFsZ29yaXRobTogJ2Jyb3RsaUNvbXByZXNzJyxcbiAgICAgIGV4dDogJy5icicsXG4gICAgfSksXG4gIF0sXG5cbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAndmVuZG9yJzogWyd2dWUnLCAncGluaWEnXSxcbiAgICAgICAgICAndWknOiBbJ0Bmb3Jta2l0L2F1dG8tYW5pbWF0ZScsICdsdWNpZGUtdnVlLW5leHQnLCAndnVlLXNvbm5lciddLFxuICAgICAgICAgICdxdWVyeSc6IFsnQHRhbnN0YWNrL3Z1ZS1xdWVyeScsICdAc2FuaXR5L2NsaWVudCddLFxuICAgICAgICAgICdjb250ZW50JzogWydtYXJrZWQnLCAnZG9tcHVyaWZ5JywgJ3NoaWtpJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICB9LFxuXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogdHJ1ZSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtVLFNBQVMsb0JBQW9CO0FBQy9WLE9BQU8sU0FBUztBQUNoQixTQUFTLGVBQWUsV0FBVztBQUNuQyxPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLGlCQUFpQjtBQU5nTCxJQUFNLDJDQUEyQztBQVN6UCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUE7QUFBQSxJQUdKLFlBQVk7QUFBQTtBQUFBLElBR1osV0FBVztBQUFBLE1BQ1QsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsVUFDRSx1QkFBdUI7QUFBQSxZQUNyQjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsUUFDSjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUE7QUFBQSxJQUdELFdBQVc7QUFBQSxNQUNULEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxRQUNKO0FBQUEsTUFDRjtBQUFBLE1BQ0EsWUFBWSxDQUFDLEtBQUs7QUFBQSxJQUNwQixDQUFDO0FBQUE7QUFBQSxJQUdELFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osVUFBVSxDQUFDLE9BQU8sT0FBTztBQUFBLFVBQ3pCLE1BQU0sQ0FBQyx5QkFBeUIsbUJBQW1CLFlBQVk7QUFBQSxVQUMvRCxTQUFTLENBQUMsdUJBQXVCLGdCQUFnQjtBQUFBLFVBQ2pELFdBQVcsQ0FBQyxVQUFVLGFBQWEsT0FBTztBQUFBLFFBQzVDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
