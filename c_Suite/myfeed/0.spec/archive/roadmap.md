# MyFeed - Implementation Roadmap

## 1. Project Overview

This roadmap outlines the step-by-step implementation plan for building MyFeed, broken down into manageable phases and tasks.

**Estimated Timeline:** 4-6 weeks (solo developer)
**Difficulty Level:** Intermediate to Advanced

---

## 2. Prerequisites

### 2.1 Required Skills
- React 18+ with TypeScript
- CSS/Tailwind CSS
- Git version control
- Basic understanding of REST APIs or static data management

### 2.2 Development Environment
```bash
# Required tools
- Node.js 18+ and npm/yarn
- Git
- Code editor (VS Code recommended)
- Modern browser with DevTools

# Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
```

### 2.3 Initial Setup
```bash
# Create React app with Vite + TypeScript
npm create vite@latest myfeed -- --template react-ts
cd myfeed
npm install

# Install core dependencies
npm install \
  tailwindcss postcss autoprefixer \
  framer-motion \
  lucide-react \
  @tanstack/react-query \
  zustand \
  marked \
  dompurify \
  date-fns \
  clsx

# Install dev dependencies
npm install -D \
  @types/dompurify \
  @types/marked \
  eslint \
  prettier \
  prettier-plugin-tailwindcss

# Initialize Tailwind
npx tailwindcss init -p
```

---

## 3. Phase 1: Foundation (Week 1)

**Goal:** Set up project structure, design system, and base components.

### 3.1 Project Structure Setup

**Task 1.1: Organize folder structure**
```bash
myfeed/
├── 0.spec/              # Documentation (already created)
├── 1.ops/               # Build and deployment scripts
├── 2.src/
│   ├── components/
│   │   ├── feed/
│   │   ├── cards/
│   │   ├── common/
│   │   └── layouts/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── data/            # Static JSON files
│   ├── App.tsx
│   └── main.tsx
├── 3.public/
│   ├── images/
│   └── fonts/
└── package.json
```

**Checklist:**
- [ ] Create folder structure
- [ ] Set up path aliases in `tsconfig.json`
- [ ] Configure ESLint and Prettier
- [ ] Create `.gitignore`

---

### 3.2 Design System Implementation

**Task 1.2: Set up Tailwind with custom theme**

**File:** `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#1a0b2e',
          900: '#2d1b4e',
          800: '#3f2b5e',
          700: '#523c6e',
          600: '#7c5cbf',
          500: '#9b7fd4',
          400: '#b89ee8',
          300: '#d4c3f5',
          200: '#e9e0fa',
          100: '#f5f2fd',
        },
        violet: {
          accent: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Charter', 'Georgia', 'serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
```

**Task 1.3: Create CSS custom properties**

**File:** `src/styles/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors */
    --bg-primary: #1a0b2e;
    --bg-secondary: #2d1b4e;
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);

    /* Spacing */
    --container-max-width: 900px;
    --card-gap: 24px;

    /* Transitions */
    --ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
    --duration-normal: 250ms;
  }

  [data-theme='light'] {
    --bg-primary: #f5f2fd;
    --bg-secondary: #ffffff;
    --text-primary: #1a0b2e;
    --text-secondary: #523c6e;
  }

  body {
    background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #1a0b2e 100%);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    min-height: 100vh;
  }
}

@layer components {
  .glass-card {
    @apply bg-obsidian-900/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg;
  }

  .glass-strong {
    @apply bg-obsidian-900/80 backdrop-blur-[30px] border-white/30;
  }

  .glass-subtle {
    @apply bg-obsidian-900/40 backdrop-blur-md border-white/15;
  }
}
```

**Checklist:**
- [ ] Configure Tailwind with obsidian purple theme
- [ ] Create global CSS with custom properties
- [ ] Test theme in browser
- [ ] Create utility classes for glass effects

---

### 3.3 TypeScript Type Definitions

**Task 1.4: Define all data types**

**File:** `src/types/feed.ts`
```typescript
// Copy all TypeScript interfaces from data-models.md
export interface BaseFeedItem { /* ... */ }
export interface MarkdownArticle extends BaseFeedItem { /* ... */ }
export interface YouTubeVideo extends BaseFeedItem { /* ... */ }
export interface ExternalArticle extends BaseFeedItem { /* ... */ }
export interface Tweet extends BaseFeedItem { /* ... */ }
export interface RSSItem extends BaseFeedItem { /* ... */ }

export type FeedItem =
  | MarkdownArticle
  | YouTubeVideo
  | ExternalArticle
  | Tweet
  | RSSItem;
```

**Checklist:**
- [ ] Create type definitions for all feed items
- [ ] Create API types
- [ ] Create UI component prop types
- [ ] Set up barrel exports (`types/index.ts`)

---

### 3.4 Base Components

**Task 1.5: Build GlassCard component**

**File:** `src/components/common/GlassCard.tsx`
```typescript
import React from 'react';
import clsx from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({
  children,
  variant = 'default',
  hover = false,
  className,
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={clsx(
        'glass-card p-6',
        variant === 'strong' && 'glass-strong',
        variant === 'subtle' && 'glass-subtle',
        hover && 'transition-all duration-350 hover:-translate-y-1 hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

**Task 1.6: Build other base components**
- [ ] `ContentHeader.tsx`
- [ ] `ActionBar.tsx`
- [ ] `UserComment.tsx`
- [ ] `ThumbnailImage.tsx`
- [ ] `SkeletonCard.tsx`

---

## 4. Phase 2: Feed Cards (Week 2)

**Goal:** Implement all feed card components.

### 4.1 Card Components

**Task 2.1: MarkdownCard**

**File:** `src/components/cards/MarkdownCard.tsx`
```typescript
import { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { GlassCard } from '../common/GlassCard';
import { ContentHeader } from '../common/ContentHeader';
import { ActionBar } from '../common/ActionBar';
import type { MarkdownArticle } from '@/types';

export function MarkdownCard({ article }: { article: MarkdownArticle }) {
  const [expanded, setExpanded] = useState(false);

  const renderMarkdown = (content: string) => {
    const html = marked(content);
    return DOMPurify.sanitize(html);
  };

  return (
    <GlassCard hover>
      <ContentHeader
        author={article.author.name}
        publishDate={article.publishDate}
        badge="MD"
      />

      <h2 className="text-2xl font-bold mt-4 mb-2">{article.title}</h2>

      {article.coverImage && (
        <img
          src={article.coverImage.url}
          alt={article.coverImage.alt}
          className="w-full rounded-lg my-4"
        />
      )}

      <div
        className={clsx(
          'prose prose-invert',
          !expanded && 'line-clamp-3'
        )}
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(expanded ? article.content : article.excerpt || '')
        }}
      />

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-violet-accent mt-4"
      >
        {expanded ? '📖 Read Less' : '📖 Read More'}
      </button>

      {article.userComment && <UserComment comment={article.userComment} />}

      <ActionBar
        likes={article.likes}
        isLiked={article.isLiked}
        isBookmarked={article.isBookmarked}
      />
    </GlassCard>
  );
}
```

**Task 2.2-2.5: Implement other card components**
- [ ] `YouTubeCard.tsx`
- [ ] `ArticleCard.tsx`
- [ ] `TweetCard.tsx`
- [ ] `RSSCard.tsx`

**Checklist for each card:**
- [ ] Implement layout per spec
- [ ] Add hover animations
- [ ] Handle loading states
- [ ] Add responsive styles
- [ ] Test with sample data

---

## 5. Phase 3: Feed Layout & Logic (Week 3)

**Goal:** Build feed container, filtering, and data management.

### 5.1 Data Management

**Task 3.1: Create sample data**

**File:** `src/data/sample-feed.json`
```json
{
  "items": [
    {
      "id": "md-001",
      "type": "markdown",
      "title": "Welcome to MyFeed",
      "content": "# Hello\n\nThis is a sample article...",
      "author": {
        "name": "Diego Marcos"
      },
      "publishDate": "2025-11-18T10:00:00Z",
      "createdAt": "2025-11-18T10:00:00Z",
      "likes": 0,
      "isLiked": false,
      "isBookmarked": false,
      "tags": ["welcome", "sample"]
    }
  ]
}
```

**Task 3.2: Create data service**

**File:** `src/services/feedService.ts`
```typescript
import feedData from '@/data/sample-feed.json';
import type { FeedItem } from '@/types';

export async function getFeedItems(): Promise<FeedItem[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return feedData.items as FeedItem[];
}

export function filterFeedItems(
  items: FeedItem[],
  type?: FeedItem['type']
): FeedItem[] {
  if (!type || type === 'all') return items;
  return items.filter(item => item.type === type);
}
```

**Checklist:**
- [ ] Create sample data for all content types
- [ ] Implement feed service
- [ ] Add filter/sort utilities
- [ ] Set up React Query hooks

---

### 5.2 State Management

**Task 3.3: Create Zustand store**

**File:** `src/stores/feedStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeedStore {
  // Filters
  selectedType: string;
  setSelectedType: (type: string) => void;

  // Engagement
  likes: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;

  // UI
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useFeedStore = create<FeedStore>()(
  persist(
    (set) => ({
      selectedType: 'all',
      setSelectedType: (type) => set({ selectedType: type }),

      likes: {},
      bookmarks: {},
      toggleLike: (id) =>
        set((state) => ({
          likes: { ...state.likes, [id]: !state.likes[id] },
        })),
      toggleBookmark: (id) =>
        set((state) => ({
          bookmarks: { ...state.bookmarks, [id]: !state.bookmarks[id] },
        })),

      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'myfeed-storage' }
  )
);
```

**Checklist:**
- [ ] Create Zustand store
- [ ] Add localStorage persistence
- [ ] Create custom hooks for state access
- [ ] Test state updates

---

### 5.3 Feed Container

**Task 3.4: Build FeedContainer**

**File:** `src/components/feed/FeedContainer.tsx`
```typescript
import { useQuery } from '@tanstack/react-query';
import { useFeedStore } from '@/stores/feedStore';
import { getFeedItems, filterFeedItems } from '@/services/feedService';
import { MarkdownCard } from '../cards/MarkdownCard';
import { YouTubeCard } from '../cards/YouTubeCard';
import { SkeletonCard } from '../common/SkeletonCard';
import type { FeedItem } from '@/types';

export function FeedContainer() {
  const selectedType = useFeedStore((state) => state.selectedType);

  const { data: items, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: getFeedItems,
  });

  const filteredItems = items ? filterFeedItems(items, selectedType) : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[900px] mx-auto p-6">
      {filteredItems.map((item) => (
        <FeedItemRenderer key={item.id} item={item} />
      ))}
    </div>
  );
}

function FeedItemRenderer({ item }: { item: FeedItem }) {
  switch (item.type) {
    case 'markdown':
      return <MarkdownCard article={item} />;
    case 'youtube':
      return <YouTubeCard video={item} />;
    // ... other cases
    default:
      return null;
  }
}
```

**Checklist:**
- [ ] Build FeedContainer component
- [ ] Add loading states
- [ ] Implement filtering
- [ ] Add empty state
- [ ] Test with different content types

---

### 5.4 Header & Navigation

**Task 3.5: Build Header component**

**File:** `src/components/layouts/Header.tsx`
```typescript
import { useFeedStore } from '@/stores/feedStore';
import { Moon, Sun } from 'lucide-react';

export function Header() {
  const { theme, toggleTheme, selectedType, setSelectedType } = useFeedStore();

  return (
    <header className="glass-strong sticky top-0 z-10 p-4">
      <div className="max-w-[900px] mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">MyFeed 🌟</h1>

        <div className="flex items-center gap-4">
          {/* Filter buttons */}
          <FilterBar
            selected={selectedType}
            onSelect={setSelectedType}
          />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
```

**Checklist:**
- [ ] Build Header component
- [ ] Add FilterBar component
- [ ] Implement theme toggle
- [ ] Make header sticky
- [ ] Add responsive mobile layout

---

## 6. Phase 4: Polish & Interactions (Week 4)

**Goal:** Add animations, transitions, and micro-interactions.

### 6.1 Animations

**Task 4.1: Add Framer Motion animations**

```typescript
import { motion } from 'framer-motion';

// Fade in on scroll
export function FeedContainer() {
  return (
    <div>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <FeedItemRenderer item={item} />
        </motion.div>
      ))}
    </div>
  );
}
```

**Checklist:**
- [ ] Add fade-in animations for feed items
- [ ] Add hover animations for cards
- [ ] Implement smooth expand/collapse for markdown
- [ ] Add like button animation (heart pulse)
- [ ] Add page transitions

---

### 6.2 Infinite Scroll

**Task 4.2: Implement infinite scroll**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

export function FeedContainer() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed-infinite'],
    queryFn: ({ pageParam = 1 }) => getFeedPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  return (
    <div>
      {/* Render items */}
      <div ref={ref}>{/* Scroll sentinel */}</div>
    </div>
  );
}
```

**Checklist:**
- [ ] Implement infinite scroll
- [ ] Add "Load More" sentinel
- [ ] Show loading spinner at bottom
- [ ] Handle errors gracefully

---

### 6.3 Accessibility

**Task 4.3: Add accessibility features**

**Checklist:**
- [ ] Add ARIA labels to interactive elements
- [ ] Implement keyboard navigation (Tab, Enter, Esc)
- [ ] Ensure focus indicators are visible
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Add skip-to-content link
- [ ] Verify color contrast ratios
- [ ] Add alt text to all images
- [ ] Support prefers-reduced-motion

---

## 7. Phase 5: Testing & Optimization (Week 5)

**Goal:** Test thoroughly and optimize performance.

### 7.1 Testing

**Task 5.1: Unit tests**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Checklist:**
- [ ] Test utility functions (filters, formatters)
- [ ] Test Zustand store actions
- [ ] Test component rendering
- [ ] Test user interactions

---

### 7.2 Performance Optimization

**Task 5.2: Optimize bundle**

**Checklist:**
- [ ] Enable code splitting for routes
- [ ] Lazy load heavy components (YouTube iframe)
- [ ] Optimize images (WebP, lazy loading)
- [ ] Analyze bundle with `vite-bundle-analyzer`
- [ ] Enable gzip compression
- [ ] Add service worker for caching (optional)

**Task 5.3: Lighthouse audit**

**Checklist:**
- [ ] Run Lighthouse audit
- [ ] Achieve score > 90 in all categories
- [ ] Fix any accessibility issues
- [ ] Optimize Largest Contentful Paint (LCP)
- [ ] Minimize Cumulative Layout Shift (CLS)

---

## 8. Phase 6: Deployment (Week 6)

**Goal:** Deploy to production.

### 8.1 Build Configuration

**Task 6.1: Configure build**

**File:** `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
});
```

**Checklist:**
- [ ] Configure build optimization
- [ ] Set up environment variables
- [ ] Test production build locally
- [ ] Configure base URL for deployment

---

### 8.2 Deployment Options

**Option A: GitHub Pages**
```bash
npm install -D gh-pages

# package.json
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  }
}
```

**Option B: Vercel**
```bash
npm install -g vercel
vercel
```

**Option C: Netlify**
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Checklist:**
- [ ] Choose deployment platform
- [ ] Configure build settings
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS
- [ ] Test deployed site

---

### 8.3 Post-Deployment

**Task 6.2: Monitoring & Analytics**

**Checklist:**
- [ ] Add analytics (Google Analytics, Plausible)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor performance (Web Vitals)
- [ ] Create sitemap
- [ ] Submit to search engines

---

## 9. Future Enhancements (Phase 2)

### 9.1 User Features
- [ ] User authentication
- [ ] User profiles
- [ ] Multiple feed collections
- [ ] Content creation UI
- [ ] Comment system

### 9.2 Advanced Features
- [ ] Real-time updates (WebSocket)
- [ ] Search functionality
- [ ] Advanced filtering
- [ ] PWA support
- [ ] Offline mode

### 9.3 Backend Integration
- [ ] Set up backend API (Node.js/Express)
- [ ] Database integration (PostgreSQL)
- [ ] User management
- [ ] Content management system
- [ ] RSS feed parser

---

## 10. Quick Start Checklist

**For someone starting fresh:**

**Day 1-2: Setup**
- [ ] Install dependencies
- [ ] Set up Tailwind with obsidian theme
- [ ] Create type definitions
- [ ] Build GlassCard component

**Day 3-5: Components**
- [ ] Build all base components
- [ ] Build MarkdownCard
- [ ] Build YouTubeCard
- [ ] Build other card components

**Day 6-8: Layout**
- [ ] Create sample data
- [ ] Build FeedContainer
- [ ] Build Header
- [ ] Implement filtering

**Day 9-12: Polish**
- [ ] Add animations
- [ ] Implement infinite scroll
- [ ] Add accessibility features
- [ ] Test on mobile

**Day 13-15: Deploy**
- [ ] Run Lighthouse audit
- [ ] Fix issues
- [ ] Build for production
- [ ] Deploy to hosting

---

## 11. Helpful Resources

### Documentation
- [React Query Docs](https://tanstack.com/query/latest)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Marked.js Docs](https://marked.js.org/)

### Design References
- [Glassmorphism.com](https://glassmorphism.com/)
- [Apple Design Resources](https://developer.apple.com/design/)
- [Dribbble - Feed Designs](https://dribbble.com/search/feed-design)

### Tools
- [Tailwind UI](https://tailwindui.com/) - Component examples
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Coolors](https://coolors.co/) - Color palette generator

---

## 12. Troubleshooting

### Common Issues

**Issue: Markdown rendering breaks layout**
- Solution: Add `prose` classes with max-width constraint

**Issue: YouTube embeds slow down page**
- Solution: Lazy load iframes, show thumbnail first

**Issue: Glass effect not working on Safari**
- Solution: Add `-webkit-backdrop-filter` prefix

**Issue: Infinite scroll triggers too early**
- Solution: Adjust intersection observer threshold

**Issue: Theme toggle not persisting**
- Solution: Check localStorage persistence in Zustand

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Status:** Ready to Implement

**Good luck building MyFeed! 🚀✨**
