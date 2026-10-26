# MyFeed

> Modern content aggregation platform with obsidian purple theme and glass morphism design

## 🎨 Features

- **Multi-Format Content**: Markdown articles, YouTube videos, external articles, tweets, and RSS feeds
- **Glass Morphism Design**: Stunning obsidian purple theme with translucent glass effects
- **Multi-Platform Publishing**: Publish once, distribute everywhere (Twitter, LinkedIn, Medium, Dev.to)
- **Full-Text Search**: Powered by Orama - instant, typo-tolerant search
- **Virtual Scrolling**: Smooth performance with 1000+ items
- **Privacy-Friendly**: GDPR-compliant analytics with Plausible

## 🚀 Tech Stack

### Frontend
- **Vue 3** + TypeScript + Composition API
- **Vite** 5+ (lightning-fast HMR)
- **Tailwind CSS** (custom obsidian purple theme)
- **Pinia** (official Vue state management)
- **TanStack Query** (data fetching & caching)

### UI & Interactions
- **Auto-Animate** (4KB zero-config animations)
- **Lucide Vue** (1000+ tree-shakeable icons)
- **vue-sonner** (beautiful toast notifications)
- **Floating UI** (tooltip/dropdown positioning)
- **Radix Vue** (accessible UI primitives)
- **TanStack Virtual** (virtual scrolling)

### Content & Media
- **Sanity.io** (headless CMS with free tier)
- **marked.js** (markdown parser)
- **DOMPurify** (XSS protection)
- **Shiki** (VS Code quality syntax highlighting)
- **lite-youtube-embed** (saves 500KB per video)
- **Unlazy** (smart lazy loading)
- **blurhash** (blur-up image placeholders)

### Search & Performance
- **Orama** (4KB full-text search)
- **vite-plugin-compression** (Brotli compression)
- **unplugin-auto-import** (auto-import Vue APIs)
- **web-vitals** (Core Web Vitals tracking)

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 🏗️ Project Structure

```
myfeed/
├── 0.spec/              # Complete specifications
│   ├── README.md        # Spec overview
│   ├── myfeed-spec.md   # Technical architecture
│   ├── design-system.md # Design tokens & patterns
│   ├── components.md    # Component specifications
│   ├── data-models.md   # TypeScript types & API
│   ├── roadmap.md       # Implementation guide
│   ├── research-tools.md # Tool research (50 tools)
│   └── STACK_DECISION.md # Stack decision rationale
├── 1.ops/               # Build scripts
├── 2.src/               # Source code
│   ├── components/      # Vue components
│   │   ├── common/      # Base components
│   │   ├── cards/       # Feed card components
│   │   ├── feed/        # Feed container
│   │   └── layouts/     # Page layouts
│   ├── composables/     # Vue composables
│   ├── stores/          # Pinia stores
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── data/            # Sample data
├── 3.public/            # Static assets
└── 4.jenkyls/          # Build configuration
```

## 🎯 Development Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Project structure
- [x] Package.json with optimized dependencies
- [x] Vite configuration with plugins
- [x] Tailwind CSS with obsidian purple theme
- [x] TypeScript types
- [x] Basic App.vue demo

### Phase 2: Components (Next)
- [ ] Build base components (GlassCard, ContentHeader, ActionBar)
- [ ] Build feed card components (Markdown, YouTube, Article, Tweet, RSS)
- [ ] Set up Pinia store
- [ ] Create Sanity client
- [ ] Build FeedContainer with virtual scrolling

### Phase 3: Features
- [ ] Build Header with search and filters
- [ ] Integrate Orama search
- [ ] Add Auto-Animate transitions
- [ ] Create sample data
- [ ] Test and refine

### Phase 4: Sanity CMS
- [ ] Set up Sanity project
- [ ] Create content schemas
- [ ] Deploy Sanity Studio
- [ ] Connect frontend to Sanity API

### Phase 5: Publishing Service
- [ ] Build Vercel serverless functions
- [ ] Integrate social media APIs
- [ ] Add multi-platform publishing
- [ ] Track engagement metrics

### Phase 6: Deployment
- [ ] Optimize bundle
- [ ] Lighthouse audit
- [ ] Deploy to Vercel
- [ ] Set up Plausible analytics

## 🎨 Design System

### Colors

**Obsidian Purple Palette:**
- 950: `#1a0b2e` (Deep background)
- 900: `#2d1b4e` (Dark surface)
- 800: `#3f2b5e` (Medium dark)
- 600: `#7c5cbf` (Primary purple)
- 500: `#9b7fd4` (Medium purple)
- 400: `#b89ee8` (Light purple)

**Accent Colors:**
- Violet Accent: `#8b5cf6`
- Amethyst Glow: `#a78bfa`
- Lavender Soft: `#c4b5fd`

### Typography

- **Primary Font:** System UI stack
- **Serif Font:** Charter, Georgia
- **Mono Font:** SF Mono, Monaco, Cascadia Code

### Components

- **Glass Cards:** Translucent with backdrop blur
- **Buttons:** Glass style or gradient primary
- **Inputs:** Glass morphism with focus rings
- **Prose:** Custom markdown styling

## 📊 Performance Targets

- First Contentful Paint: <1.0s
- Largest Contentful Paint: <2.0s
- Time to Interactive: <2.5s
- Cumulative Layout Shift: <0.1
- Lighthouse Score: >95

## 🔐 Environment Variables

Create a `.env` file:

```env
# Sanity Configuration
VITE_SANITY_PROJECT_ID=your_project_id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01

# Optional: Analytics
VITE_PLAUSIBLE_DOMAIN=yourdomain.com
```

## 📚 Documentation

- **Full Specs:** See `0.spec/` folder
- **Tool Research:** `0.spec/research-tools.md` (50 tools analyzed)
- **Stack Decision:** `0.spec/STACK_DECISION.md`
- **Roadmap:** `0.spec/roadmap.md`

## 💰 Cost

**Monthly: $0**

All services use free tiers:
- Sanity CMS: Free (unlimited docs, 10GB bandwidth)
- Vercel: Free (100GB bandwidth)
- Plausible: Trial/self-host

## 🤝 Contributing

1. Check the roadmap in `0.spec/roadmap.md`
2. Follow the component specs in `0.spec/components.md`
3. Match the design system in `0.spec/design-system.md`
4. Run `npm run lint` and `npm run format` before committing

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with research from 50+ cutting-edge GitHub tools
- Inspired by Facebook feeds, Medium's reading experience, and Apple's design language
- Powered by the amazing Vue.js and Vite ecosystems

---

**Status:** Phase 1 Foundation Complete ✅
**Next:** Building feed components...
**Version:** 1.0.0
**Last Updated:** November 18, 2025
