# MyFeed - Technical Specification

## 1. Project Overview

**MyFeed** is a modern, unified content aggregation platform that combines the best features of social media feeds and blog platforms. It provides a single, beautiful interface for consuming diverse content types including proprietary markdown articles, YouTube videos, external articles, tweets, and RSS feed items.

### 1.1 Vision Statement

Create an elegant, performant, and user-friendly feed experience that rivals Facebook's feed and Medium's reading experience, with a distinctive obsidian purple aesthetic and glassy Apple-inspired design language.

### 1.2 Core Features

- **Multi-Format Content Rendering**
  - Proprietary Markdown articles with rich formatting
  - YouTube videos with embedded player, thumbnails, and comments
  - External articles with thumbnail preview and commentary
  - Twitter/X posts with native styling
  - RSS feed items with metadata and commentary

- **Unified Feed Experience**
  - Chronological or algorithm-based feed ordering
  - Infinite scroll with lazy loading
  - Responsive card-based layout
  - Smooth animations and transitions
  - Dark mode optimized with obsidian purple theme

- **User Interaction**
  - Add personal comments to any content
  - Like/favorite items
  - Share functionality
  - Filter by content type
  - Search functionality

## 2. Technical Architecture

### 2.1 Technology Stack (Updated with Research)

**Frontend Core:**
- **Framework:** Vue 3 with TypeScript + Composition API
- **Build Tool:** Vite 5+ (lightning fast HMR)
- **Styling:** Tailwind CSS (glass morphism optimized)
- **State Management:** Pinia (Vue's official store)
- **Data Fetching:** TanStack Query (Vue Query) for Sanity CMS

**Content & Media:**
- **Headless CMS:** Sanity.io (free tier: unlimited docs, 10GB bandwidth)
- **Markdown Parser:** marked.js (fast, extensible)
- **Markdown Sanitizer:** DOMPurify (XSS protection)
- **Syntax Highlighting:** Shiki (VS Code quality, 200+ languages)
- **YouTube Embeds:** lite-youtube-embed (500KB saved per video)
- **Image Optimization:** Sanity image pipeline + blurhash placeholders
- **Lazy Loading:** Unlazy (1.8KB, auto-detection)

**UI & Interactions:**
- **Animations:** Auto-Animate (4KB, zero-config magic)
- **Icons:** Lucide Vue (tree-shakeable, 1000+ icons)
- **Toasts/Notifications:** vue-sonner (beautiful, opinionated)
- **Tooltips/Dropdowns:** Floating UI (positioning perfection)
- **Accessible Primitives:** Radix Vue (unstyled, WCAG compliant)
- **Virtual Scrolling:** TanStack Virtual (1000+ items smoothly)

**Search & Performance:**
- **Search Engine:** Orama (4KB full-text search, typo-tolerant)
- **Bundle Compression:** vite-plugin-compression (Brotli)
- **Auto Imports:** unplugin-auto-import + unplugin-vue-components
- **Performance Monitoring:** web-vitals (Core Web Vitals tracking)

**Developer Experience:**
- **Composables:** VueUse (essential Vue utilities)
- **DevTools:** vite-plugin-vue-devtools (enhanced debugging)
- **Testing:** Vitest (Vite-native, 10x faster than Jest)

**Analytics & Publishing:**
- **Analytics:** Plausible (privacy-friendly, GDPR compliant)
- **Publishing Service:** Vercel Serverless Functions
- **Social APIs:** twitter-api-v2, linkedin-api-client
- **Deployment:** Vercel (frontend) + Sanity Cloud (CMS)

**Storage & Hosting:**
- **CMS:** Sanity Cloud (free tier)
- **Frontend:** Vercel / Netlify (free tier)
- **Images:** Sanity CDN (auto-optimization)
- **Publishing Backend:** Vercel Serverless Functions

### 2.2 Application Structure

```
myfeed/
├── 0.spec/              # Specification files (this folder)
├── 1.ops/               # Build scripts and operations
├── 2.src/               # Source code
│   ├── components/      # React components
│   │   ├── feed/        # Feed container and layout
│   │   ├── cards/       # Card components for each content type
│   │   ├── common/      # Shared UI components
│   │   └── layouts/     # Page layouts
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and data services
│   ├── styles/          # Global styles and theme
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── data/            # Static data/content files
├── 3.public/            # Static assets
│   ├── images/          # Image assets
│   └── fonts/           # Custom fonts
└── 4.jenkyls/          # Build configuration
```

### 2.3 Component Architecture

**Hierarchical Structure:**

```
App
└── FeedLayout
    ├── Header
    │   ├── Logo
    │   ├── SearchBar
    │   └── FilterControls
    ├── FeedContainer
    │   └── FeedItem (dynamic)
    │       ├── MarkdownCard
    │       ├── YouTubeCard
    │       ├── ArticleCard
    │       ├── TweetCard
    │       └── RSSCard
    └── Footer
```

**Shared Components:**
- GlassCard (base component with glassy effect)
- ContentHeader (title, author, date)
- CommentSection (user commentary)
- ActionBar (like, share, bookmark)
- ThumbnailImage (optimized image loading)

### 2.4 Data Flow

```
User → UI Component → React Query → Data Service → Data Source
                                                        ↓
User ← UI Component ← State Update  ← Cache Update  ← JSON/API
```

## 3. Responsive Design Strategy

### 3.1 Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md-lg)
- **Desktop:** > 1024px (xl)
- **Wide:** > 1536px (2xl)

### 3.2 Layout Adaptations

**Mobile (Single Column):**
- Full-width cards with minimal padding
- Stacked content layout
- Collapsed filter menu
- Bottom navigation bar

**Tablet (Single Column, Wider):**
- Max-width 768px centered
- Expanded card padding
- Inline filter chips
- Top navigation bar

**Desktop (Centered Feed):**
- Max-width 900px feed column
- Larger media previews
- Sticky header
- Sidebar filters (optional)

## 4. Performance Optimization

### 4.1 Loading Strategy

- **Initial Load:** First 10 feed items
- **Lazy Loading:** Load more on scroll (intersection observer)
- **Image Optimization:**
  - WebP with JPEG fallback
  - Responsive images with srcset
  - Lazy loading with blur-up placeholder

### 4.2 Caching Strategy

- React Query cache (5 minutes default)
- LocalStorage for user preferences
- Service Worker for offline support (optional phase 2)

### 4.3 Bundle Optimization

- Code splitting by route
- Dynamic imports for heavy components (YouTube player)
- Tree shaking with ES modules
- Minification and compression

## 5. Content Type Specifications

### 5.1 Markdown Article

**Data Structure:**
```typescript
interface MarkdownArticle {
  id: string;
  type: 'markdown';
  title: string;
  author: string;
  publishDate: Date;
  content: string; // Markdown content
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number; // minutes
  userComment?: string;
}
```

**Rendering:**
- Parse markdown with marked.js
- Sanitize HTML with DOMPurify
- Syntax highlighting for code blocks
- Responsive images and tables

### 5.2 YouTube Video

**Data Structure:**
```typescript
interface YouTubeVideo {
  id: string;
  type: 'youtube';
  videoId: string; // YouTube video ID
  title: string;
  thumbnail: string; // YouTube thumbnail URL
  channelName: string;
  publishDate: Date;
  duration?: string;
  userComment?: string;
}
```

**Rendering:**
- Thumbnail preview with play button overlay
- Lazy load iframe on click
- Responsive 16:9 aspect ratio container
- Show video metadata

### 5.3 External Article

**Data Structure:**
```typescript
interface ExternalArticle {
  id: string;
  type: 'article';
  title: string;
  url: string;
  source: string; // Website name
  thumbnail?: string;
  excerpt?: string;
  author?: string;
  publishDate?: Date;
  userComment?: string;
}
```

**Rendering:**
- Large thumbnail with overlay
- Title and excerpt
- External link indicator
- Open in new tab

### 5.4 Tweet/X Post

**Data Structure:**
```typescript
interface Tweet {
  id: string;
  type: 'tweet';
  tweetId?: string; // For embedded tweets
  author: string;
  handle: string;
  content: string;
  timestamp: Date;
  likes?: number;
  retweets?: number;
  url?: string;
  userComment?: string;
}
```

**Rendering:**
- Twitter-like card styling
- Profile picture placeholder
- Tweet content with link parsing
- Engagement metrics

### 5.5 RSS Feed Item

**Data Structure:**
```typescript
interface RSSItem {
  id: string;
  type: 'rss';
  title: string;
  content: string;
  source: string; // Feed name
  url: string;
  publishDate: Date;
  thumbnail?: string;
  userComment?: string;
}
```

**Rendering:**
- Compact card layout
- Source badge
- Timestamp
- Read more link

## 6. Accessibility

### 6.1 WCAG 2.1 Level AA Compliance

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Focus visible indicators
- Color contrast ratios > 4.5:1

### 6.2 Screen Reader Support

- Alt text for all images
- Descriptive link text
- Proper heading hierarchy
- Skip to content link

## 7. Browser Support

- **Modern Browsers:** Latest 2 versions
  - Chrome/Edge (Chromium)
  - Firefox
  - Safari
- **Mobile Browsers:**
  - Safari iOS 14+
  - Chrome Android

## 8. Future Enhancements (Phase 2)

- User authentication and personalization
- Multiple feed collections
- Advanced filtering and search
- Content creation interface
- Social sharing integration
- Analytics dashboard
- PWA support with offline mode
- Real-time updates with WebSockets
- Comment threading and discussions

## 9. Success Metrics

- **Performance:**
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Lighthouse score > 90

- **User Experience:**
  - Smooth 60fps scrolling
  - Content rendering < 100ms
  - Zero layout shifts

- **Accessibility:**
  - WCAG 2.1 AA compliance
  - Keyboard navigation for all features
  - Screen reader compatibility

## 10. Dependencies (Optimized Stack)

**Core:**
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

**UI & Styling:**
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@formkit/auto-animate": "^0.8.0",
    "lucide-vue-next": "^0.340.0",
    "vue-sonner": "^1.0.0"
  }
}
```

**Data & State:**
```json
{
  "dependencies": {
    "@tanstack/vue-query": "^5.28.0",
    "pinia": "^2.1.0",
    "@sanity/client": "^6.12.0",
    "@sanity/image-url": "^1.0.2"
  }
}
```

**Content & Media:**
```json
{
  "dependencies": {
    "marked": "^12.0.0",
    "dompurify": "^3.0.0",
    "shiki": "^1.0.0",
    "unlazy": "^0.11.0",
    "blurhash": "^2.0.0"
  }
}
```

**UI Components & Utilities:**
```json
{
  "dependencies": {
    "@vueuse/core": "^10.9.0",
    "@floating-ui/vue": "^1.0.0",
    "radix-vue": "^1.5.0",
    "@tanstack/vue-virtual": "^3.1.0",
    "@orama/orama": "^2.0.0",
    "date-fns": "^3.3.0",
    "clsx": "^2.1.0"
  }
}
```

**Performance & Optimization:**
```json
{
  "dependencies": {
    "web-vitals": "^3.5.0"
  },
  "devDependencies": {
    "vite-plugin-compression": "^0.5.0",
    "unplugin-auto-import": "^0.17.0",
    "unplugin-vue-components": "^0.26.0"
  }
}
```

**Development & Testing:**
```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vue-tsc": "^1.8.0",
    "vitest": "^1.3.0",
    "@testing-library/vue": "^8.0.0",
    "vite-plugin-vue-devtools": "^7.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

**Publishing Service (Separate Project):**
```json
{
  "dependencies": {
    "twitter-api-v2": "^1.15.0",
    "axios": "^1.6.0",
    "@sanity/client": "^6.12.0"
  }
}
```

**Bundle Size Comparison:**
- **Old Stack:** ~165KB gzipped (React + Framer Motion + Prism)
- **New Stack:** ~151KB gzipped (Vue + Auto-Animate + Shiki)
- **Savings:** 14KB (8% reduction)
- **YouTube Embeds:** Additional 500KB saved per video with lite-youtube-embed

**Performance Gains:**
- Virtual scrolling handles 1000+ items smoothly
- Auto-Animate adds transitions with zero configuration
- Shiki loads syntax highlighting asynchronously
- Unlazy reduces initial bundle by lazy-loading images properly
- Orama provides instant search results (<10ms)

---

**Version:** 2.0.0 (Updated with Research)
**Last Updated:** 2025-11-18
**Status:** Production-Ready Stack
