# MyFeed - Research Tools & Libraries

**Last Updated:** November 18, 2025
**Purpose:** Curated list of cutting-edge GitHub tools for building a modern feed-based web SPA

---

## 📊 Selection Criteria

- ⭐ High GitHub stars (active community)
- 🔥 Recently updated (2024-2025)
- 🎯 Relevant to feed/SPA architecture
- 🚀 Performance-focused
- 💪 Production-ready

---

## 🎨 UI & Animation Libraries

### 1. **Auto-Animate**
- **GitHub:** https://github.com/formkit/auto-animate
- **Stars:** ~11k ⭐
- **Description:** Zero-config animation library that automatically animates element changes
- **Why for MyFeed:** Effortless animations for feed items appearing/disappearing
- **Size:** ~4KB
- **Vue Support:** ✅ Native Vue support

```vue
<script setup>
import { useAutoAnimate } from '@formkit/auto-animate/vue'
const [parent] = useAutoAnimate()
</script>

<template>
  <div ref="parent">
    <FeedCard v-for="item in items" :key="item.id" />
  </div>
</template>
```

**Recommendation:** ✅ **USE THIS** - Replace complex Framer Motion, much lighter

---

### 2. **Motion One**
- **GitHub:** https://github.com/motiondivision/motionone
- **Stars:** ~4.5k ⭐
- **Description:** Modern, performant animation library (powers Framer Motion v11)
- **Why for MyFeed:** Ultra-light (5KB), GPU-accelerated, works with Vue
- **Bundle Size:** 5KB vs Framer Motion 35KB

```typescript
import { animate, spring } from 'motion'

animate('.feed-card',
  { opacity: [0, 1], y: [20, 0] },
  { duration: 0.5, easing: spring() }
)
```

**Recommendation:** ✅ **USE THIS** - Modern alternative to Framer Motion

---

### 3. **VueUse**
- **GitHub:** https://github.com/vueuse/vueuse
- **Stars:** ~18k ⭐
- **Description:** Collection of essential Vue composition utilities
- **Why for MyFeed:** Has everything - scroll detection, infinite scroll, image lazy loading
- **Last Updated:** Active (daily commits)

```typescript
import {
  useInfiniteScroll,
  useIntersectionObserver,
  useScroll,
  useLocalStorage
} from '@vueuse/core'
```

**Recommendation:** ✅ **ESSENTIAL** - Already in our stack, use extensively

---

### 4. **Floating UI**
- **GitHub:** https://github.com/floating-ui/floating-ui
- **Stars:** ~28k ⭐
- **Description:** Positioning library for tooltips, popovers, dropdowns
- **Why for MyFeed:** Perfect for action menus, share buttons, previews
- **Vue Integration:** Via `@floating-ui/vue`

**Recommendation:** ✅ **USE** - For tooltips and dropdown menus

---

### 5. **Radix Vue**
- **GitHub:** https://github.com/radix-vue/radix-vue
- **Stars:** ~2.5k ⭐
- **Description:** Unstyled, accessible Vue components (port of Radix UI)
- **Why for MyFeed:** Accessible dropdowns, dialogs, tooltips ready for glass styling
- **Last Updated:** 2025

**Recommendation:** ✅ **USE** - For accessible UI primitives

---

## 📝 Content Rendering & Markdown

### 6. **Shiki**
- **GitHub:** https://github.com/shikijs/shiki
- **Stars:** ~9k ⭐
- **Description:** Beautiful syntax highlighter using TextMate grammars
- **Why for MyFeed:** Better than Prism.js, supports 200+ languages, VS Code themes
- **Bundle Size:** Tree-shakeable

```typescript
import { codeToHtml } from 'shiki'

const html = await codeToHtml(code, {
  lang: 'javascript',
  theme: 'material-theme-palenight' // Matches obsidian purple!
})
```

**Recommendation:** ✅ **USE THIS** - Replace Prism.js

---

### 7. **Marked**
- **GitHub:** https://github.com/markedjs/marked
- **Stars:** ~32k ⭐
- **Description:** Fast markdown parser and compiler
- **Why for MyFeed:** Already in our stack, but ensure latest version
- **Extensions:** Has plugins for GitHub Flavored Markdown

**Recommendation:** ✅ **KEEP** - Already using

---

### 8. **markdown-it**
- **GitHub:** https://github.com/markdown-it/markdown-it
- **Stars:** ~17k ⭐
- **Description:** Markdown parser with 100% CommonMark support, extensible
- **Why for MyFeed:** More powerful than marked, better plugin ecosystem
- **Plugins:** Emoji, footnotes, containers, math

**Recommendation:** 🤔 **CONSIDER** - Alternative to marked if need more features

---

### 9. **Sandpack**
- **GitHub:** https://github.com/codesandbox/sandpack
- **Stars:** ~7.5k ⭐
- **Description:** Live code editor component by CodeSandbox
- **Why for MyFeed:** Embed interactive code examples in articles
- **Vue Support:** Via `sandpack-vue3`

**Recommendation:** 🌟 **FUTURE FEATURE** - For tutorial articles

---

### 10. **Tiptap**
- **GitHub:** https://github.com/ueberdosis/tiptap
- **Stars:** ~24k ⭐
- **Description:** Headless WYSIWYG editor framework
- **Why for MyFeed:** Future: Create articles directly in MyFeed UI
- **Features:** Markdown shortcuts, collaborative editing

**Recommendation:** 🌟 **PHASE 2** - Content creation UI

---

## 🖼️ Image & Media Handling

### 11. **blurhash**
- **GitHub:** https://github.com/woltapp/blurhash
- **Stars:** ~15k ⭐
- **Description:** Compact image placeholder encoding
- **Why for MyFeed:** Beautiful blur-up effect while images load
- **Size:** Tiny

```typescript
import { decode } from 'blurhash'

// Sanity can generate blurhash on upload
const pixels = decode(item.coverImage.blurhash, 32, 32)
```

**Recommendation:** ✅ **USE** - Add blurhash to Sanity images

---

### 12. **Unlazy**
- **GitHub:** https://github.com/johannschopplich/unlazy
- **Stars:** ~500+ ⭐
- **Description:** Universal lazy loading library with auto-detection
- **Why for MyFeed:** Lightweight, auto-lazy loads images/iframes
- **Size:** 1.8KB

```vue
<script setup>
import { unlazy } from 'unlazy'
onMounted(() => unlazy())
</script>

<img data-src="image.jpg" class="lazyload" />
```

**Recommendation:** ✅ **USE** - Better than native lazy loading

---

### 13. **sharp** (via Sanity)
- **GitHub:** https://github.com/lovell/sharp
- **Stars:** ~28k ⭐
- **Description:** High-performance image processing
- **Why for MyFeed:** Sanity uses this for image transformations
- **Features:** Auto WebP, resize, blur

**Recommendation:** ✅ **BUILT-IN** - Use Sanity's image pipeline

---

### 14. **lite-youtube-embed**
- **GitHub:** https://github.com/paulirish/lite-youtube-embed
- **Stars:** ~5k ⭐
- **Description:** Lightweight YouTube embed (no iframe until click)
- **Why for MyFeed:** Saves 500KB+ per video, instant page load
- **Performance:** 100x faster than YouTube iframe

```html
<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>
```

**Recommendation:** ✅✅ **MUST USE** - Critical for performance

---

### 15. **Plyr**
- **GitHub:** https://github.com/sampotts/plyr
- **Stars:** ~26k ⭐
- **Description:** Simple, customizable media player
- **Why for MyFeed:** If hosting videos, beautiful player with glass styling
- **Features:** Keyboard shortcuts, fullscreen, captions

**Recommendation:** 🤔 **OPTIONAL** - Only if hosting videos

---

## ♾️ Infinite Scroll & Virtualization

### 16. **TanStack Virtual**
- **GitHub:** https://github.com/TanStack/virtual
- **Stars:** ~4.5k ⭐ (part of TanStack)
- **Description:** Headless UI for virtualizing large lists
- **Why for MyFeed:** Render 1000+ feed items smoothly
- **Vue Support:** `@tanstack/vue-virtual`

```vue
<script setup>
import { useVirtualizer } from '@tanstack/vue-virtual'

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => 400, // Estimated card height
})
</script>
```

**Recommendation:** ✅ **USE** - For large feeds (1000+ items)

---

### 17. **vue-virtual-scroller**
- **GitHub:** https://github.com/Akryum/vue-virtual-scroller
- **Stars:** ~9k ⭐
- **Description:** Vue-specific virtual scroller (by Vue core team member)
- **Why for MyFeed:** Vue-optimized, dynamic heights
- **Features:** Variable height items, horizontal scrolling

**Recommendation:** 🤔 **ALTERNATIVE** - Vue-specific option to TanStack

---

## 🔄 State Management & Data Fetching

### 18. **TanStack Query (Vue Query)**
- **GitHub:** https://github.com/TanStack/query
- **Stars:** ~40k ⭐
- **Description:** Powerful async state management
- **Why for MyFeed:** Already in stack, perfect for Sanity data
- **Features:** Caching, background updates, pagination

**Recommendation:** ✅ **KEEP** - Core to our architecture

---

### 19. **Pinia Colada**
- **GitHub:** https://github.com/posva/pinia-colada
- **Stars:** ~500+ ⭐ (new!)
- **Description:** Data fetching layer for Pinia (by Pinia creator)
- **Why for MyFeed:** Combines Pinia + TanStack Query patterns
- **Released:** 2024

**Recommendation:** 🔥 **CONSIDER** - Simpler than Vue Query for Pinia users

---

### 20. **Zustand** (for Vue: Pinia)
- **GitHub:** https://github.com/pmndrs/zustand
- **Stars:** ~44k ⭐
- **Description:** Lightweight state management (React, but philosophy applies)
- **Why for MyFeed:** We're using Pinia (Vue equivalent)

**Recommendation:** ✅ **USING PINIA** - Vue's official solution

---

## 🎭 Advanced UI Components

### 21. **Embla Carousel**
- **GitHub:** https://github.com/davidjerleke/embla-carousel
- **Stars:** ~5k ⭐
- **Description:** Lightweight carousel library
- **Why for MyFeed:** For image galleries in articles, tweet media
- **Size:** 6KB, framework-agnostic

**Recommendation:** 🤔 **OPTIONAL** - For media galleries

---

### 22. **Swiper**
- **GitHub:** https://github.com/nolimits4web/swiper
- **Stars:** ~38k ⭐
- **Description:** Modern mobile touch slider
- **Why for MyFeed:** Mobile-optimized image/media swiping
- **Vue Support:** Native Vue components

**Recommendation:** 🤔 **OPTIONAL** - For mobile galleries

---

### 23. **sonner**
- **GitHub:** https://github.com/emilkowalski/sonner
- **Stars:** ~7k ⭐
- **Description:** Opinionated toast component
- **Why for MyFeed:** Beautiful notifications ("Bookmarked!", "Liked!")
- **Vue Port:** `vue-sonner`

```vue
<script setup>
import { toast } from 'vue-sonner'

const handleLike = () => {
  toast.success('Added to likes!', {
    description: 'View all your liked posts',
  })
}
</script>
```

**Recommendation:** ✅ **USE** - For user feedback

---

### 24. **cmdk**
- **GitHub:** https://github.com/pacocoursey/cmdk
- **Stars:** ~8k ⭐
- **Description:** Command menu component (Cmd+K)
- **Why for MyFeed:** Fast keyboard navigation, search
- **Vue Port:** `vue-command-palette`

**Recommendation:** 🌟 **COOL FEATURE** - Power user navigation

---

## 🔍 Search & Filtering

### 25. **Fuse.js**
- **GitHub:** https://github.com/krisk/Fuse
- **Stars:** ~17k ⭐
- **Description:** Lightweight fuzzy-search library
- **Why for MyFeed:** Client-side search through feed items
- **Features:** Fuzzy matching, weighted search

```typescript
import Fuse from 'fuse.js'

const fuse = new Fuse(feedItems, {
  keys: ['title', 'content', 'tags'],
  threshold: 0.3,
})

const results = fuse.search('vue design')
```

**Recommendation:** ✅ **USE** - For search functionality

---

### 26. **Orama (formerly Lyra)**
- **GitHub:** https://github.com/oramasearch/orama
- **Stars:** ~8k ⭐
- **Description:** Full-text search engine in browser
- **Why for MyFeed:** More powerful than Fuse.js, typo-tolerant
- **Size:** 4KB

**Recommendation:** 🔥 **BETTER ALTERNATIVE** - To Fuse.js

---

### 27. **MiniSearch**
- **GitHub:** https://github.com/lucaong/minisearch
- **Stars:** ~4.5k ⭐
- **Description:** Tiny but powerful full-text search
- **Why for MyFeed:** Best size/performance ratio
- **Size:** 6KB, supports auto-suggestions

**Recommendation:** 🤔 **LIGHTWEIGHT OPTION** - Smaller than Orama

---

## 📱 Progressive Web App (PWA)

### 28. **Vite PWA Plugin**
- **GitHub:** https://github.com/vite-pwa/vite-plugin-pwa
- **Stars:** ~3k ⭐
- **Description:** Zero-config PWA for Vite
- **Why for MyFeed:** Offline support, install to homescreen
- **Features:** Service worker, manifest generation

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MyFeed',
        theme_color: '#8b5cf6',
      },
    }),
  ],
}
```

**Recommendation:** 🌟 **PHASE 2** - Make it a PWA

---

### 29. **Workbox**
- **GitHub:** https://github.com/GoogleChrome/workbox
- **Stars:** ~12k ⭐
- **Description:** Service worker libraries by Google
- **Why for MyFeed:** Advanced offline caching strategies
- **Features:** Cache-first, network-first strategies

**Recommendation:** ⚡ **BUILT INTO** Vite PWA Plugin

---

## 📊 Analytics & Monitoring

### 30. **Plausible Analytics**
- **GitHub:** https://github.com/plausible/analytics
- **Stars:** ~19k ⭐
- **Description:** Privacy-friendly Google Analytics alternative
- **Why for MyFeed:** GDPR compliant, lightweight script
- **Self-hosted:** Yes, or use their cloud

```html
<script defer data-domain="yourdomain.com"
  src="https://plausible.io/js/script.js"></script>
```

**Recommendation:** ✅ **USE** - Better than Google Analytics

---

### 31. **Umami**
- **GitHub:** https://github.com/umami-software/umami
- **Stars:** ~20k ⭐
- **Description:** Self-hosted web analytics
- **Why for MyFeed:** Free, privacy-focused, beautiful UI
- **Deploy:** Vercel/Railway one-click

**Recommendation:** ✅ **ALTERNATIVE** - To Plausible

---

### 32. **web-vitals**
- **GitHub:** https://github.com/GoogleChrome/web-vitals
- **Stars:** ~7k ⭐
- **Description:** Library for measuring Core Web Vitals
- **Why for MyFeed:** Track LCP, FID, CLS in production
- **Size:** 1.5KB

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals'

onCLS(console.log)
onFID(console.log)
onLCP(console.log)
```

**Recommendation:** ✅ **USE** - Monitor performance

---

## 🎨 CSS & Styling

### 33. **Tailwind CSS**
- **GitHub:** https://github.com/tailwindlabs/tailwindcss
- **Stars:** ~80k ⭐
- **Description:** Utility-first CSS framework
- **Why for MyFeed:** Already in stack, perfect for glass morphism

**Recommendation:** ✅ **KEEP** - Core to design system

---

### 34. **UnoCSS**
- **GitHub:** https://github.com/unocss/unocss
- **Stars:** ~15k ⭐
- **Description:** Instant on-demand atomic CSS engine
- **Why for MyFeed:** 5x faster than Tailwind, smaller bundle
- **Compatible:** Tailwind preset available

**Recommendation:** 🔥 **CONSIDER** - Faster alternative to Tailwind

---

### 35. **Open Props**
- **GitHub:** https://github.com/argyleink/open-props
- **Stars:** ~4.5k ⭐
- **Description:** CSS custom properties (design tokens)
- **Why for MyFeed:** Pre-built easing, shadows, gradients
- **Usage:** Supplement our custom properties

**Recommendation:** 🤔 **OPTIONAL** - We have custom design system

---

## 🔐 Security & Performance

### 36. **DOMPurify**
- **GitHub:** https://github.com/cure53/DOMPurify
- **Stars:** ~13k ⭐
- **Description:** XSS sanitizer for HTML
- **Why for MyFeed:** Already in stack, essential for markdown

**Recommendation:** ✅ **KEEP** - Security critical

---

### 37. **vite-plugin-compression**
- **GitHub:** https://github.com/vbenjs/vite-plugin-compression
- **Stars:** ~1k ⭐
- **Description:** Gzip/Brotli compression for Vite builds
- **Why for MyFeed:** Reduce bundle size by 70%

```typescript
import compression from 'vite-plugin-compression'

export default {
  plugins: [
    compression({ algorithm: 'brotliCompress' })
  ]
}
```

**Recommendation:** ✅ **USE** - Free performance boost

---

### 38. **vite-plugin-imagemin**
- **GitHub:** https://github.com/vbenjs/vite-plugin-imagemin
- **Stars:** ~900 ⭐
- **Description:** Image compression for Vite
- **Why for MyFeed:** Optimize local images automatically

**Recommendation:** 🤔 **OPTIONAL** - Sanity handles most images

---

## 🧪 Testing & Quality

### 39. **Vitest**
- **GitHub:** https://github.com/vitest-dev/vitest
- **Stars:** ~12k ⭐
- **Description:** Blazing fast unit test framework (Vite-native)
- **Why for MyFeed:** Native Vite integration, Jest-compatible
- **Speed:** 10x faster than Jest

**Recommendation:** ✅ **USE** - For unit testing

---

### 40. **Playwright**
- **GitHub:** https://github.com/microsoft/playwright
- **Stars:** ~63k ⭐
- **Description:** End-to-end testing framework
- **Why for MyFeed:** Test feed interactions, animations
- **Features:** Auto-wait, screenshots, video recording

**Recommendation:** 🌟 **PHASE 2** - E2E testing

---

## 🚀 Build & Deploy Tools

### 41. **Vite**
- **GitHub:** https://github.com/vitejs/vite
- **Stars:** ~65k ⭐
- **Description:** Next generation frontend tooling
- **Why for MyFeed:** Already in stack, lightning fast

**Recommendation:** ✅ **KEEP** - Core build tool

---

### 42. **vite-plugin-vue-devtools**
- **GitHub:** https://github.com/webfansplz/vite-plugin-vue-devtools
- **Stars:** ~1.5k ⭐
- **Description:** Vite plugin for Vue DevTools
- **Why for MyFeed:** Enhanced debugging experience
- **Features:** Component inspector, state timeline

**Recommendation:** ✅ **USE** - Dev experience

---

## 📡 Social Media Integration

### 43. **twitter-api-v2**
- **GitHub:** https://github.com/plhery/node-twitter-api-v2
- **Stars:** ~1.2k ⭐
- **Description:** Twitter API v2 client for Node.js
- **Why for MyFeed:** For publishing service
- **Features:** Full v2 API coverage, TypeScript

**Recommendation:** ✅ **USE** - Already planned for publisher

---

### 44. **linkedin-api-client**
- **GitHub:** https://github.com/eilonmore/linkedin-api-client
- **Stars:** ~600 ⭐
- **Description:** LinkedIn API wrapper
- **Why for MyFeed:** Publishing to LinkedIn

**Recommendation:** ✅ **USE** - For LinkedIn integration

---

## 🎁 Bonus: Emerging Tools (2025)

### 45. **Astro**
- **GitHub:** https://github.com/withastro/astro
- **Stars:** ~43k ⭐
- **Description:** Static site builder with partial hydration
- **Why for MyFeed:** Could use for blog-style articles
- **Vue Support:** Vue islands in Astro

**Recommendation:** 🤔 **ALTERNATIVE ARCHITECTURE** - For SSG approach

---

### 46. **Nuxt 4**
- **GitHub:** https://github.com/nuxt/nuxt
- **Stars:** ~52k ⭐
- **Description:** Vue meta-framework with SSR/SSG
- **Why for MyFeed:** Full-stack Vue framework
- **Features:** File-based routing, API routes, SSR

**Recommendation:** 🤔 **ALTERNATIVE** - More complex than needed

---

### 47. **Nitro**
- **GitHub:** https://github.com/unjs/nitro
- **Stars:** ~5k ⭐
- **Description:** Universal server framework (powers Nuxt)
- **Why for MyFeed:** For custom API endpoints
- **Deploy:** Cloudflare Workers, Vercel, Netlify

**Recommendation:** 🤔 **IF NEED BACKEND** - Alternative to Express

---

### 48. **Iconify**
- **GitHub:** https://github.com/iconify/iconify
- **Stars:** ~4k ⭐
- **Description:** Universal icon framework (100k+ icons)
- **Why for MyFeed:** All icon sets in one library
- **Vue:** `@iconify/vue`

**Recommendation:** 🤔 **ALTERNATIVE** - To Lucide (much larger)

---

### 49. **unplugin-auto-import**
- **GitHub:** https://github.com/antfu/unplugin-auto-import
- **Stars:** ~3k ⭐
- **Description:** Auto import APIs on-demand
- **Why for MyFeed:** No need to import Vue/VueUse functions
- **DX:** Cleaner code

```vue
<script setup>
// No imports needed!
const route = useRoute() // auto-imported
const count = ref(0) // auto-imported
</script>
```

**Recommendation:** ✅ **USE** - Better DX

---

### 50. **unplugin-vue-components**
- **GitHub:** https://github.com/antfu/unplugin-vue-components
- **Stars:** ~3.5k ⭐
- **Description:** Auto import Vue components
- **Why for MyFeed:** No need to import components
- **DX:** Faster development

```vue
<template>
  <!-- No import needed -->
  <GlassCard>
    <FeedItem />
  </GlassCard>
</template>
```

**Recommendation:** ✅ **USE** - Pairs with auto-import

---

## 📊 Tool Comparison Matrix

| Category | Current Choice | Alternative | Winner |
|----------|---------------|-------------|--------|
| **Animation** | Framer Motion | Motion One / Auto-Animate | 🏆 Auto-Animate |
| **Syntax Highlight** | Prism.js | Shiki | 🏆 Shiki |
| **Markdown** | marked | markdown-it | ⚖️ Marked (simpler) |
| **Virtual Scroll** | None | TanStack Virtual | 🏆 TanStack Virtual |
| **YouTube Embed** | Native | lite-youtube-embed | 🏆 lite-youtube-embed |
| **Search** | None | Fuse.js / Orama | 🏆 Orama |
| **Toast** | None | vue-sonner | 🏆 vue-sonner |
| **Analytics** | None | Plausible / Umami | 🏆 Plausible |
| **CSS** | Tailwind | UnoCSS | ⚖️ Tailwind (familiar) |
| **Icons** | Lucide Vue | Iconify | ⚖️ Lucide (lighter) |

---

## 🎯 Final Recommendations by Priority

### ✅ Must Use (Core)
1. **Auto-Animate** - Effortless animations
2. **lite-youtube-embed** - Critical for performance
3. **Shiki** - Beautiful syntax highlighting
4. **TanStack Virtual** - Large feed performance
5. **Orama** - Powerful search
6. **vue-sonner** - User feedback
7. **Plausible** - Privacy-friendly analytics
8. **web-vitals** - Performance monitoring
9. **unplugin-auto-import** - Better DX
10. **unplugin-vue-components** - Auto-import components

### 🔥 Strongly Recommended
11. **Floating UI** - Tooltips/menus
12. **Radix Vue** - Accessible primitives
13. **Unlazy** - Better lazy loading
14. **blurhash** - Image placeholders
15. **Fuse.js** - Backup search option
16. **vite-plugin-compression** - Bundle optimization
17. **vite-plugin-vue-devtools** - Dev experience

### 🌟 Nice to Have (Phase 2)
18. **Tiptap** - Content editor
19. **Sandpack** - Live code examples
20. **cmdk** - Command palette
21. **Vite PWA Plugin** - Offline support
22. **Embla Carousel** - Media galleries
23. **Playwright** - E2E testing

### 🤔 Consider Later
24. **UnoCSS** - If need better performance than Tailwind
25. **markdown-it** - If need more markdown features
26. **Nuxt** - If need SSR/SSG
27. **Iconify** - If need more icon variety

---

## 💰 Bundle Size Impact

### Current Stack Estimate
```
Vue 3: 50KB
Tailwind CSS: 10KB (purged)
Framer Motion: 35KB
Marked: 50KB
Prism.js: 15KB
Lucide React: 5KB (tree-shaken)
---
Total: ~165KB gzipped
```

### Optimized Stack Estimate
```
Vue 3: 50KB
Tailwind CSS: 10KB (purged)
Auto-Animate: 4KB ✅ (-31KB)
Marked: 50KB
Shiki: 15KB (async loaded) ✅ (same)
Lucide Vue: 5KB
TanStack Virtual: 8KB ✅ (+8KB)
Orama: 4KB ✅ (+4KB)
vue-sonner: 3KB ✅ (+3KB)
lite-youtube: 2KB ✅ (+2KB)
---
Total: ~151KB gzipped (-14KB, 8% smaller)
```

**Plus performance gains:**
- YouTube embeds: 500KB saved per video
- Virtual scrolling: Smooth 1000+ items
- Search: Instant results

---

## 🚀 Implementation Priority

### Week 1 (Foundation)
- [x] Vue 3 + Vite setup
- [ ] Add unplugin-auto-import
- [ ] Add unplugin-vue-components
- [ ] Configure Auto-Animate

### Week 2 (Content)
- [ ] Integrate Shiki for syntax highlighting
- [ ] Add lite-youtube-embed
- [ ] Implement Unlazy for image loading
- [ ] Add blurhash support

### Week 3 (Features)
- [ ] Integrate TanStack Virtual
- [ ] Add Orama search
- [ ] Implement vue-sonner
- [ ] Add Floating UI for menus

### Week 4 (Polish)
- [ ] Add Radix Vue components
- [ ] Integrate Plausible analytics
- [ ] Add web-vitals monitoring
- [ ] Optimize with vite-plugin-compression

---

## 📚 Additional Resources

- **Vue Ecosystem:** https://github.com/vuejs/awesome-vue
- **Vite Plugins:** https://github.com/vitejs/awesome-vite
- **Performance Tools:** https://github.com/nucliweb/webperf-snippets
- **Accessibility:** https://github.com/brunopulis/awesome-a11y

---

**Last Updated:** November 18, 2025
**Total Tools Researched:** 50
**Recommended for Immediate Use:** 17
**Phase 2 Candidates:** 10

---

**Next Steps:**
1. Review recommendations with team
2. Update package.json with selected tools
3. Create integration guides for each tool
4. Update roadmap with new timeline
