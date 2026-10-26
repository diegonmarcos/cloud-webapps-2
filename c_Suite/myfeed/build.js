import { build } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

async function buildSPA() {
  console.log('🔨 Building single-file SPA...')

  // Single-file SPA build
  await build({
    configFile: false,
    base: '/myfeed/',
    root: 'src', // Set root to src directory
    publicDir: '../public', // Public assets relative to project root
    plugins: [
      (await import('@vitejs/plugin-vue')).default(),
      viteSingleFile()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      outDir: '../dist', // Output to project root's dist folder
      sourcemap: false,
      minify: 'terser',
      emptyOutDir: true
    }
  })

  console.log('✅ Single-file SPA build complete!')
}

buildSPA().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
