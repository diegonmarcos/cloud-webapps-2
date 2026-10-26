# MyFeed Redesign Plan

## Overview

Redesign MyFeed from a content aggregation platform to a **data-dense feed dashboard** with two main sections:
1. **MyFeed** - Personal activity feeds (GitHub, Music, YouTube)
2. **NewsFeed** - RSS news aggregation with topic filtering

## Design Philosophy

### Current Issues
- Color scheme too vibrant/strong for data-heavy interface
- Glass morphism effects distract from content
- Typography too decorative (pixel fonts)
- Cards too large, wasting screen space
- Not optimized for scanning large amounts of data

### New Direction: "Terminal Data Dashboard"
- **Muted, low-contrast colors** - Easy on the eyes for long reading sessions
- **Compact, dense layout** - Maximum data per screen
- **Minimal chrome** - Focus on content, not decoration
- **Monospace typography** - Clean, scannable, programmer-friendly
- **Subtle separators** - Lines and spacing instead of heavy cards

---

## Color Scheme Redesign

### New Palette: "Midnight Terminal"

```scss
// Background layers
$bg-base: #0d1117;        // GitHub dark background
$bg-surface: #161b22;     // Slightly elevated
$bg-elevated: #21262d;    // Cards, modals
$bg-hover: #30363d;       // Hover states

// Text hierarchy
$text-primary: #e6edf3;   // Main text
$text-secondary: #8b949e; // Secondary/muted
$text-tertiary: #6e7681;  // Timestamps, meta
$text-link: #58a6ff;      // Links

// Accent colors (subtle)
$accent-blue: #58a6ff;    // Primary actions
$accent-green: #3fb950;   // Success, positive
$accent-orange: #d29922;  // Warnings, highlights
$accent-red: #f85149;     // Errors, alerts
$accent-purple: #a371f7;  // Special items

// Borders
$border-default: #30363d;
$border-muted: #21262d;
```

---

## Typography Redesign

### Font Stack
```scss
// Primary: System monospace for data density
$font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;

// Secondary: System sans for headers
$font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', sans-serif;

// Sizes (compact scale)
$text-xs: 0.7rem;    // 11px - timestamps, meta
$text-sm: 0.75rem;   // 12px - secondary text
$text-base: 0.8125rem; // 13px - body text
$text-md: 0.875rem;  // 14px - titles
$text-lg: 1rem;      // 16px - section headers
```

---

## Layout Architecture

### Main Structure
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Logo | [MyFeed] [NewsFeed] | Search | Settings      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TAB BAR: [GitHub] [Music] [YouTube] (for MyFeed)    │   │
│  │     or   [Headlines] [World] [Tech] [Science] [Markets] │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                   FEED CONTENT                      │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │ Item 1 - Compact row                          │ │   │
│  │  ├───────────────────────────────────────────────┤ │   │
│  │  │ Item 2 - Compact row                          │ │   │
│  │  ├───────────────────────────────────────────────┤ │   │
│  │  │ Item 3 - Compact row                          │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Compact Row Layout (Instead of Cards)
```
┌──────────────────────────────────────────────────────────────┐
│ [icon] Title of the item...        source   2h ago  [★] [⋮] │
│        Brief description or first line of content...        │
└──────────────────────────────────────────────────────────────┘
```

---

## Section 1: MyFeed

### Tabs
1. **GitHub** - Recent activity from GitHub Events API
2. **Music** - Tidal listening history/favorites
3. **YouTube** - Liked videos, watch later

### GitHub Tab Layout
```
┌─ COMMITS ────────────────────────────────────────────────────┐
│ ● repo/name  feat: add new feature          2h ago    [→]   │
│ ● repo/name  fix: resolve bug in module     5h ago    [→]   │
│ ● repo/name  docs: update readme            1d ago    [→]   │
├─ STARS ──────────────────────────────────────────────────────┤
│ ★ user/repo  Description of repo...         3h ago    [→]   │
│ ★ org/tool   Another description...         1d ago    [→]   │
├─ PULL REQUESTS ──────────────────────────────────────────────┤
│ ⎇ repo #123  Title of PR                    4h ago    [→]   │
└──────────────────────────────────────────────────────────────┘
```

### Music Tab Layout
```
┌─ RECENTLY PLAYED ────────────────────────────────────────────┐
│ ♫ Artist Name - Track Title                 Album    3:42   │
│ ♫ Artist Name - Track Title                 Album    4:15   │
├─ FAVORITES ──────────────────────────────────────────────────┤
│ ♥ Artist Name - Track Title                 Album    5:01   │
└──────────────────────────────────────────────────────────────┘
```

### YouTube Tab Layout
```
┌─ LIKED VIDEOS ───────────────────────────────────────────────┐
│ ▶ Video Title Here...                 Channel    12:34  2d  │
│ ▶ Another Video Title...              Channel    8:45   5d  │
├─ WATCH LATER ────────────────────────────────────────────────┤
│ ◷ Video Title...                      Channel    15:20  1w  │
└──────────────────────────────────────────────────────────────┘
```

---

## Section 2: NewsFeed

### Topic Tabs
1. **Headlines** - Top stories
2. **World** - International news
3. **Tech** - Technology news
4. **Science** - Science & research
5. **Markets** - Economy & finance

### RSS Sources Strategy

#### Option A: Google News RSS (Recommended)
```
Base URL: https://news.google.com/rss/
Topics:
- Headlines: /rss?hl=en-US&gl=US&ceid=US:en
- World: /rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB
- Tech: /rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB
- Science: /rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB
- Business: /rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB
```

#### Option B: Multiple Sources
- **Tech**: Hacker News, TechCrunch, Ars Technica
- **Science**: Science Daily, Nature, Phys.org
- **Markets**: Bloomberg, Reuters, Financial Times
- **World**: Reuters, AP News, BBC

### News Item Layout
```
┌──────────────────────────────────────────────────────────────┐
│ Title of the news article that might be long...    TechCrunch│
│ Brief summary or first paragraph of the article    2h ago [→]│
└──────────────────────────────────────────────────────────────┘
```

### Grouped by Time
```
─── TODAY ─────────────────────────────────────────────────────
│ News item 1...
│ News item 2...
─── YESTERDAY ─────────────────────────────────────────────────
│ News item 3...
```

---

## Implementation Plan

### Phase 1: Core Redesign (Foundation)
1. **Update color variables** in Tailwind config and SCSS
2. **Replace typography** - remove pixel fonts, use monospace
3. **Create compact row component** - replace GlassCard
4. **Update Header** - simplified, tab-based navigation
5. **Remove glass morphism** - use flat, subtle design

### Phase 2: MyFeed Section
1. **Refactor GitHub integration** - use existing RssSidebar logic
2. **Update Tidal integration** - compact music rows
3. **Update YouTube integration** - compact video rows
4. **Create tabbed interface** for switching between feeds

### Phase 3: NewsFeed Section
1. **Create RSS fetching composable** - `useRSSFeed.ts`
2. **Integrate Google News RSS** with CORS proxy
3. **Create topic filtering** - tabs for each category
4. **Create NewsItem component** - compact row layout
5. **Add time-based grouping** - Today, Yesterday, This Week

### Phase 4: Polish & Performance
1. **Virtual scrolling** - for long lists
2. **Caching strategy** - localStorage + stale-while-revalidate
3. **Loading states** - skeleton rows
4. **Error handling** - fallback content
5. **Mobile responsive** - stack layout on small screens

---

## Component Changes

### Remove
- `GlassCard.vue` - replace with compact rows
- `SkeletonCard.vue` - replace with skeleton rows
- `MarkdownCard.vue` - not needed for feeds
- `TweetCard.vue` - not needed
- `ArticleCard.vue` - merge into NewsItem
- Glass morphism styles

### Keep & Modify
- `FeedContainer.vue` - refactor for new layout
- `Header.vue` - simplify, add main section tabs
- `useYouTubeFeed.ts` - keep, update output format
- `useTidalFeed.ts` - keep, update output format
- `feedStore.ts` - extend for new sections

### New Components
- `CompactRow.vue` - base compact row component
- `GitHubRow.vue` - GitHub event row
- `MusicRow.vue` - Tidal track row
- `VideoRow.vue` - YouTube video row
- `NewsRow.vue` - RSS news item row
- `TabBar.vue` - section/topic tabs
- `TimeGroup.vue` - time-based grouping header
- `useRSSFeed.ts` - RSS fetching composable

---

## File Structure (New)

```
src/
├── components/
│   ├── common/
│   │   ├── CompactRow.vue      # Base row component
│   │   ├── TabBar.vue          # Tab navigation
│   │   ├── TimeGroup.vue       # Time grouping header
│   │   └── SkeletonRow.vue     # Loading skeleton
│   ├── myfeed/
│   │   ├── GitHubRow.vue       # GitHub event row
│   │   ├── MusicRow.vue        # Tidal track row
│   │   ├── VideoRow.vue        # YouTube video row
│   │   └── MyFeedContainer.vue # MyFeed main container
│   ├── newsfeed/
│   │   ├── NewsRow.vue         # News item row
│   │   └── NewsFeedContainer.vue # NewsFeed main container
│   └── layout/
│       └── Header.vue          # Updated header
├── composables/
│   ├── useGitHubFeed.ts        # GitHub events (refactored)
│   ├── useTidalFeed.ts         # Keep existing
│   ├── useYouTubeFeed.ts       # Keep existing
│   └── useRSSFeed.ts           # New: RSS fetching
├── stores/
│   └── feedStore.ts            # Extended store
├── styles/
│   ├── main.scss               # Updated styles
│   └── variables.scss          # New color palette
└── App.vue                     # Updated layout
```

---

## CSS Changes Summary

### Remove
- All `.glass-*` classes
- Pixel font imports
- Glow effects
- Heavy shadows
- Backdrop filters

### Add
```scss
// Compact row base
.row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid $border-muted;
  font-family: $font-mono;
  font-size: $text-base;

  &:hover {
    background: $bg-hover;
  }
}

// Dense list container
.feed-list {
  display: flex;
  flex-direction: column;
}

// Time group header
.time-group {
  font-size: $text-xs;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 0.75rem;
  background: $bg-base;
  border-bottom: 1px solid $border-default;
}

// Section tabs
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid $border-default;

  .tab {
    padding: 0.5rem 1rem;
    font-size: $text-sm;
    color: $text-secondary;
    border-bottom: 2px solid transparent;

    &.active {
      color: $text-primary;
      border-bottom-color: $accent-blue;
    }
  }
}
```

---

## Timeline Estimate

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1 | Core redesign, colors, typography | Medium |
| Phase 2 | MyFeed section with 3 tabs | Medium |
| Phase 3 | NewsFeed with RSS integration | Medium |
| Phase 4 | Polish, performance, mobile | Light |

---

## Technical Notes

### CORS Proxy for RSS
Use existing proxy pattern from YouTube feed:
```typescript
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];
```

### RSS Parsing
Use browser's DOMParser:
```typescript
const parser = new DOMParser();
const xml = parser.parseFromString(rssText, 'text/xml');
const items = xml.querySelectorAll('item');
```

### Caching Strategy
```typescript
// Cache RSS for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Store in localStorage with timestamp
localStorage.setItem('rss-cache', JSON.stringify({
  data: items,
  timestamp: Date.now()
}));
```

---

## Success Criteria

1. **Data Density** - 20+ items visible without scrolling
2. **Load Time** - < 2s initial load
3. **Readability** - Easy to scan, low eye strain
4. **Responsiveness** - Works on mobile (stacked layout)
5. **Reliability** - Graceful fallbacks when feeds fail
