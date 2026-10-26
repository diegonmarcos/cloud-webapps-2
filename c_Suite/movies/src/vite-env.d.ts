/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// The legal multi-source core is plain JS shared with cloud-media-center (Android).
declare module '@/lib/sources-core.mjs' {
  const core: any
  export = core
}
