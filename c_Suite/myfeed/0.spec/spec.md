# MyFeed - Vue 3 Content Aggregation Platform

Modern content aggregation platform built with Vue 3, TypeScript, and Vite. Features an obsidian purple glass morphism design system.

## Project Type

**Vue 3 SPA (Single Page Application)** - Modern JavaScript application with full build pipeline.

## Technology Stack

### Core Framework
- **Vue 3.4+** - Composition API with `<script setup>` syntax
- **TypeScript 5.3+** - Full type safety across the application
- **Vite 5.1+** - Lightning-fast build tool and dev server

### State Management & Data
- **Pinia 2.1** - Vue state management with persistence
- **TanStack Vue Query 5.28** - Server state management & caching
- **@vueuse/core 10.9** - Vue composition utilities

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Glass Morphism** - Custom obsidian purple design system
- **Auto-Animate** - Zero-config animations (4KB)
- **Lucide Vue Next** - Beautiful icon library
- **Radix Vue** - Unstyled, accessible UI primitives

### Content Processing
- **Marked 12.0** - Markdown parser
- **DOMPurify 3.0** - XSS sanitization
- **Shiki 1.0** - Syntax highlighting
- **Unlazy 0.11** - Lazy loading images

### Developer Experience
- **Vue DevTools 7.0** - Enhanced debugging
- **Unplugin Auto Import** - Auto-import Vue APIs
- **Unplugin Components** - Auto-import components
- **ESLint + Prettier** - Code quality & formatting
- **Vitest** - Unit testing framework

### Performance
- **Web Vitals 3.5** - Performance monitoring
- **Vite Compression** - Brotli compression
- **Terser** - JavaScript minification
- **Manual chunk splitting** - Optimized bundle sizes

## Application Architecture

### Feed Content Types

MyFeed supports 5 different content types, each with its own card component:

1. **Markdown Articles** (`MarkdownCard.vue`)
   - Full markdown content with frontmatter
   - Cover images with blurhash placeholders
   - Author information with avatars
   - Read time estimation
   - Tags and categories

2. **YouTube Videos** (`YouTubeCard.vue`)
   - Embedded YouTube player with lite-youtube-embed (saves 500KB)
   - Channel information
   - Video metadata (duration, views, likes)
   - Start time support

3. **External Articles** (`ArticleCard.vue`)
   - Links to external content
   - Open Graph metadata
   - Favicon and thumbnail images
   - Source attribution

4. **Tweets** (`TweetCard.vue`)
   - Twitter/X post content
   - Author with verification badge
   - Engagement metrics (likes, retweets, replies, views)
   - Media attachments support
   - Thread and quote tweet support

5. **RSS Items** (`RSSCard.vue`)
   - RSS feed content
   - Feed source information
   - Enclosures (podcasts, videos)
   - Categories

### Core Features

**Content Management:**
- Multi-format content aggregation
- Full-text search with Orama (4KB search engine)
- Type-based filtering (all, markdown, youtube, article, tweet, rss)
- Tag-based filtering
- Sorting (by date, likes, publish date)

**User Engagement:**
- Like/unlike items (persisted in localStorage)
- Bookmark items (persisted in localStorage)
- Add personal comments to items
- Engagement statistics in header

**UI/UX:**
- Glass morphism design with obsidian purple theme
- Dark/light theme toggle
- Auto-animated transitions
- Skeleton loading states
- Virtual scrolling for 1000+ items
- Responsive design (mobile-first)
- Accessibility features

**Performance:**
- Lazy loading images with blurhash
- Code splitting (vendor, ui, query, content chunks)
- Brotli compression
- Core Web Vitals tracking
- Service worker ready

## Directory Structure

```
myfeed/
├── 0.spec/                    # Documentation (excluded from deployment)
│   └── spec.md               # This file
├── 1.ops/                     # Operations scripts (excluded from deployment)
│   └── build.sh              # Build/dev/preview script
├── 2.src/                     # Vue source code
│   ├── App.vue               # Root component
│   ├── main.ts               # Application entry point
│   ├── components/
│   │   ├── cards/            # Feed item cards
│   │   │   ├── ArticleCard.vue
│   │   │   ├── MarkdownCard.vue
│   │   │   ├── RSSCard.vue
│   │   │   ├── TweetCard.vue
│   │   │   └── YouTubeCard.vue
│   │   ├── common/           # Reusable UI components
│   │   │   ├── ActionBar.vue
│   │   │   ├── ContentHeader.vue
│   │   │   ├── GlassCard.vue
│   │   │   ├── SkeletonCard.vue
│   │   │   └── UserComment.vue
│   │   ├── feed/
│   │   │   └── FeedContainer.vue  # Main feed logic
│   │   └── layouts/
│   │       └── Header.vue    # Top header with search & filters
│   ├── stores/
│   │   └── feedStore.ts      # Pinia store (filters, likes, bookmarks)
│   ├── types/
│   │   └── feed.ts           # TypeScript interfaces (337 lines)
│   ├── data/
│   │   └── sampleFeed.ts     # Sample feed data (323 lines)
│   └── styles/
│       └── main.css          # Tailwind + custom styles (224 lines)
├── index.html                 # Vite entry HTML
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # TypeScript config for Node
└── .gitignore                # Git ignore rules
```

## Build & Deployment

### Local Development

```bash
# Install dependencies
cd myfeed
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Or use build script
cd 1.ops
./build.sh dev
```

### Production Build

```bash
# Build for production
npm run build

# Or use build script
cd 1.ops
./build.sh build

# Preview production build
npm run preview
# Or
./build.sh preview
```

**Build Output:**
- Directory: `myfeed/dist/`
- Optimized bundles with code splitting
- Brotli compressed assets
- Source maps (disabled in production)

### GitHub Actions Deployment

**Workflow:** `.github/workflows/deploy.yml`

1. **Detect Changes** - Only builds if `myfeed/` files changed
2. **Setup Node.js** - Uses Node 20 with npm caching
3. **Install Dependencies** - `npm install` in myfeed directory
4. **Build Vue App** - `npm run build` (includes Sass compilation)
5. **Copy to _site** - Copies `myfeed/dist/*` to `_site/myfeed/`
6. **Deploy to GitHub Pages** - Serves at `/myfeed/` path

**Deployed URL:** `https://diegonmarcos.github.io/myfeed/`

## Design System

### Color Palette (Obsidian Purple)

```css
--bg-primary: #1a0b2e;        /* obsidian-950 */
--bg-secondary: #2d1b4e;      /* obsidian-900 */
--violet-accent: #8b5cf6;     /* Primary accent */
--lavender-soft: #c4b5fd;     /* Soft lavender */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.7);
```

### Glass Morphism Effects

```css
.glass-card {
  background: rgba(45, 27, 78, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

**Variants:**
- `.glass-strong` - More opaque (80% opacity, 30px blur)
- `.glass-subtle` - More transparent (40% opacity, 10px blur)
- `.glass-hover` - Smooth hover effects with lift

### Typography

- **Font Stack:** System fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI"...`)
- **Headings:** Bold, white color, gradient purple for special text
- **Body:** Leading relaxed (1.6), white with 90% opacity
- **Code:** `'Courier New'`, monospace, lavender-soft color

### Component Styles

**Buttons:**
- `.btn-glass` - Glass effect with hover state
- `.btn-primary` - Gradient violet with shadow glow

**Inputs:**
- `.input-glass` - Glass effect with focus ring (violet accent)

**Cards:**
- Auto-animated entrance/exit
- Hover lift effect (-translate-y-1)
- Glass morphism background
- Rounded 2xl borders

**Prose (Markdown):**
- Styled headings (h1-h3)
- Custom link colors (violet-accent)
- Code blocks with obsidian background
- Blockquotes with violet left border

## TypeScript Types

### Feed Item Interfaces

All feed items extend `BaseFeedItem`:

```typescript
interface BaseFeedItem {
  id: string
  _createdAt: string
  _updatedAt?: string
  userComment?: string
  likes: number
  isLiked: boolean
  isBookmarked: boolean
  tags?: string[]
  visibility?: 'public' | 'private' | 'unlisted'
}
```

**Discriminated Union:**
```typescript
type FeedItem =
  | MarkdownArticle
  | YouTubeVideo
  | ExternalArticle
  | Tweet
  | RSSItem
```

### State Management

**Pinia Store (`feedStore`):**
- Filters: `selectedType`, `searchQuery`, `sortBy`, `sortOrder`
- Engagement: `likes`, `bookmarks`, `comments`
- UI State: `theme`, `expandedItems`
- Persistence: localStorage with key `myfeed-store`

## Performance Optimizations

### Bundle Optimization

**Code Splitting:**
- `vendor.js` - Vue core, Pinia (shared dependencies)
- `ui.js` - UI libraries (auto-animate, icons, toaster)
- `query.js` - Data fetching (TanStack Query, Sanity client)
- `content.js` - Content processing (marked, DOMPurify, shiki)

**Compression:**
- Brotli compression enabled
- Terser minification
- Tree shaking for unused code

### Runtime Optimization

- **Virtual Scrolling** - Handle 1000+ items smoothly
- **Lazy Loading** - Images with blurhash placeholders
- **Auto-Animate** - 4KB animation library
- **lite-youtube-embed** - Saves 500KB per YouTube video
- **Orama Search** - 4KB full-text search engine

### Core Web Vitals Tracking

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals'

onCLS((metric) => console.log('CLS:', metric))
onFID((metric) => console.log('FID:', metric))
onLCP((metric) => console.log('LCP:', metric))
```

## Analytics

**Matomo Analytics** integrated in `index.html`:
- Site ID: 1
- Tracker URL: `analytics.diegonmarcos.com`
- Page view tracking
- Link tracking enabled

## Future Enhancements

### Sanity.io Integration (Ready)
- `@sanity/client` - Already installed
- `@sanity/image-url` - Image URL builder
- Type-safe content fetching with TanStack Query

### Planned Features
- Infinite scroll / pagination
- Advanced search with Orama
- Content creation interface
- Export/import feed data
- RSS feed generation
- Social sharing
- Keyboard shortcuts

## Browser Compatibility

- **Modern browsers** with ES6+ support
- **ES Modules** required
- **CSS Grid & Flexbox** required
- **backdrop-filter** required for glass morphism
- **Recommended:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Development Notes

- **NOT Jekyll** - This is a Vue 3 SPA, not a static site generator
- **Build Required** - Source files in `2.src/` must be built with Vite
- **Auto-Import** - Vue APIs and components are auto-imported (no explicit imports needed)
- **Type Safety** - Full TypeScript coverage with strict mode
- **Hot Reload** - Vite HMR for instant updates during development
- **Component Library Ready** - Radix Vue provides unstyled, accessible primitives

## Scripts Reference

```json
{
  "dev": "vite",                          // Dev server on :3000
  "build": "npm run sass:build && vite build",  // Production build
  "build:check": "vue-tsc && vite build", // Build with type checking
  "preview": "vite preview",              // Preview build on :4173
  "test": "vitest",                       // Run tests
  "lint": "eslint .",                     // Lint code
  "format": "prettier --write ."          // Format code
}
```

## Credits

- **Design Inspiration:** Glass morphism, Obsidian.md
- **Icons:** Lucide Icons
- **Font:** System font stack
- **Framework:** Vue.js Team
- **Build Tool:** Vite Team
