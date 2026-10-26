# MyFeed - Component Specifications

## 1. Component Overview

This document provides detailed specifications for all UI components in the MyFeed application, with a focus on the feed card components that render different content types.

## 2. Base Components

### 2.1 GlassCard (Base Component)

The foundation for all feed cards.

**Purpose:** Reusable glass morphism container with consistent styling.

**Props:**
```typescript
interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}
```

**Visual Specs:**
- Background: `rgba(45, 27, 78, 0.6)` with `blur(20px)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Border Radius: `16px`
- Padding: `24px` (desktop), `16px` (mobile)
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.2)`

**Hover State:**
- Transform: `translateY(-4px)`
- Shadow: `0 12px 32px rgba(0, 0, 0, 0.25)`
- Border: `1px solid rgba(255, 255, 255, 0.3)`
- Transition: `350ms cubic-bezier(0.4, 0.0, 0.2, 1)`

**Code Example:**
```tsx
<GlassCard variant="default" hover>
  {/* Card content */}
</GlassCard>
```

---

### 2.2 ContentHeader

Displays metadata for feed items (author, date, source).

**Props:**
```typescript
interface ContentHeaderProps {
  author?: string;
  source?: string;
  publishDate: Date;
  avatar?: string;
  badge?: string; // Content type badge
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│ [Avatar] Author Name · Source       │
│          @handle · 2 hours ago      │
│                          [Badge]    │
└─────────────────────────────────────┘
```

**Visual Specs:**
- Avatar: 40px circle (desktop), 32px (mobile)
- Author text: `text-base`, `font-semibold`, `text-white`
- Metadata: `text-sm`, `font-normal`, `rgba(255, 255, 255, 0.7)`
- Badge: `text-xs`, `px-2 py-1`, `rounded-full`, purple background

---

### 2.3 ActionBar

Interaction buttons (like, comment, share, bookmark).

**Props:**
```typescript
interface ActionBarProps {
  likes?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│ ❤ 24   💬 5   ↗ Share   🔖        │
└─────────────────────────────────────┘
```

**Visual Specs:**
- Height: `48px`
- Icon size: `20px`
- Spacing: `gap-6` between actions
- Colors:
  - Default: `rgba(255, 255, 255, 0.6)`
  - Active (liked/bookmarked): `#8b5cf6`
  - Hover: `rgba(255, 255, 255, 0.9)`

**Interactions:**
- Hover: scale(1.1)
- Active: scale(0.95)
- Like animation: Heart pulse effect

---

### 2.4 UserComment

Displays user's personal commentary on shared content.

**Props:**
```typescript
interface UserCommentProps {
  comment: string;
  onEdit?: () => void;
  editable?: boolean;
}
```

**Visual Specs:**
- Background: `rgba(139, 92, 246, 0.1)`
- Border-left: `3px solid #8b5cf6`
- Padding: `16px`
- Border Radius: `8px`
- Text: `text-base`, `leading-relaxed`, italic
- Icon: Quote mark in top-left corner

---

### 2.5 ThumbnailImage

Optimized image component with loading states.

**Props:**
```typescript
interface ThumbnailImageProps {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  overlay?: boolean;
  playButton?: boolean; // For YouTube
}
```

**Features:**
- Lazy loading with Intersection Observer
- Blur-up placeholder (base64 thumbnail)
- WebP with JPEG fallback
- Smooth fade-in on load
- Optional gradient overlay for text readability

**Visual Specs:**
- Border Radius: `12px`
- Object-fit: `cover`
- Loading skeleton: Shimmer animation

---

## 3. Feed Card Components

### 3.1 MarkdownCard

Renders proprietary markdown articles.

**Component Hierarchy:**
```
MarkdownCard
├── GlassCard
│   ├── ContentHeader
│   ├── ArticleTitle
│   ├── CoverImage (optional)
│   ├── Excerpt
│   ├── ReadMore/ReadLess Toggle
│   ├── MarkdownContent (expanded)
│   ├── TagList
│   ├── UserComment (optional)
│   └── ActionBar
```

**Props:**
```typescript
interface MarkdownCardProps {
  article: MarkdownArticle;
  expanded?: boolean;
  onToggle?: () => void;
}
```

**Layout - Collapsed:**
```
┌──────────────────────────────────────────┐
│ [@] Diego Marcos · Personal Blog         │
│     2 hours ago                    [MD]  │
├──────────────────────────────────────────┤
│                                          │
│  Building a Modern Feed Application      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  [Cover Image - 16:9]                    │
│                                          │
│  In this article, I explore the design   │
│  patterns behind modern feed-based...    │
│                                          │
│  📖 Read More (5 min read)               │
│                                          │
│  #react #design #glassmorphism          │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Layout - Expanded:**
```
┌──────────────────────────────────────────┐
│ [@] Diego Marcos · Personal Blog         │
│     2 hours ago                    [MD]  │
├──────────────────────────────────────────┤
│  Building a Modern Feed Application      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  [Cover Image - 16:9]                    │
│                                          │
│  [Full Markdown Content]                 │
│  • Headers                               │
│  • Paragraphs                            │
│  • Code blocks                           │
│  • Images                                │
│  • Lists                                 │
│                                          │
│  📖 Read Less                            │
│                                          │
│  ┃ "This is my take on modern web        │
│  ┃  design patterns!" - My comment       │
│                                          │
│  #react #design #glassmorphism          │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Visual Specs:**
- Title: `text-2xl`, `font-bold`, white
- Excerpt: `text-base`, `leading-relaxed`, gray-300
- Markdown content: Serif font, `text-lg`, enhanced readability
- Code blocks: Dark theme syntax highlighting
- Read time badge: `text-sm`, purple background

**Special Features:**
- Smooth expand/collapse animation
- Sticky "Read Less" button when scrolling
- Syntax highlighting for code blocks (Prism.js)
- Auto-linked headings
- Responsive images within content

---

### 3.2 YouTubeCard

Embeds YouTube videos with metadata.

**Component Hierarchy:**
```
YouTubeCard
├── GlassCard
│   ├── ContentHeader
│   ├── VideoTitle
│   ├── ThumbnailImage (with play button)
│   ├── YouTubeEmbed (when playing)
│   ├── VideoMetadata (duration, views)
│   ├── UserComment (optional)
│   └── ActionBar
```

**Props:**
```typescript
interface YouTubeCardProps {
  video: YouTubeVideo;
  autoplay?: boolean;
}
```

**Layout - Thumbnail:**
```
┌──────────────────────────────────────────┐
│ 📺 Fireship · YouTube                    │
│    3 hours ago                    [YT]   │
├──────────────────────────────────────────┤
│  100 Seconds of Obsidian Purple          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  ╔════════════════════════════╗          │
│  ║                            ║          │
│  ║    [Thumbnail Image]       ║          │
│  ║                            ║          │
│  ║          ▶ PLAY            ║          │
│  ║                            ║          │
│  ║                      [1:40]║          │
│  ╚════════════════════════════╝          │
│                                          │
│  ┃ "Great explanation of design          │
│  ┃  principles!" - My thoughts            │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Layout - Playing:**
```
┌──────────────────────────────────────────┐
│ 📺 Fireship · YouTube             [YT]   │
├──────────────────────────────────────────┤
│  100 Seconds of Obsidian Purple          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  ┌────────────────────────────┐          │
│  │   [YouTube iframe embed]   │          │
│  │                            │          │
│  └────────────────────────────┘          │
│                                          │
│  ┃ "Great explanation of design          │
│  ┃  principles!" - My thoughts            │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Visual Specs:**
- Thumbnail aspect ratio: 16:9
- Play button: 64px circle, semi-transparent white background
- Duration badge: Bottom-right, black background with white text
- YouTube red accent: `#FF0000` for icon
- Iframe: Responsive 16:9 container

**Interactions:**
- Click thumbnail → Load iframe
- Lazy load iframe (only when visible)
- Show loading spinner during iframe load
- Close button to return to thumbnail

---

### 3.3 ArticleCard

External article links with preview.

**Component Hierarchy:**
```
ArticleCard
├── GlassCard
│   ├── ContentHeader (source website)
│   ├── ArticleTitle
│   ├── ThumbnailImage
│   ├── Excerpt
│   ├── ReadMoreButton (external link)
│   ├── UserComment (optional)
│   └── ActionBar
```

**Props:**
```typescript
interface ArticleCardProps {
  article: ExternalArticle;
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ 🌐 TechCrunch                     [LINK] │
│    5 hours ago                           │
├──────────────────────────────────────────┤
│  ┌────────────────────────────┐          │
│  │   [Article Thumbnail]      │          │
│  │   (4:3 aspect ratio)       │          │
│  └────────────────────────────┘          │
│                                          │
│  The Future of Design Systems            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Modern design systems are evolving to   │
│  incorporate new patterns like glass...  │
│                                          │
│  📄 Read on TechCrunch ↗                │
│                                          │
│  ┃ "Interesting perspective on design    │
│  ┃  system evolution" - My take          │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Visual Specs:**
- Thumbnail: 4:3 aspect ratio, top position
- Source badge: Website favicon + name
- External link icon: `↗` next to button
- Button: Glass style with hover glow
- Opens in new tab (`target="_blank"`)

**Special Features:**
- Favicon fetching from external domain
- Fallback thumbnail if none provided
- Link preview on hover (optional)
- Domain highlighting (e.g., "techcrunch.com")

---

### 3.4 TweetCard

Twitter/X post embed style.

**Component Hierarchy:**
```
TweetCard
├── GlassCard
│   ├── TweetHeader (profile pic, name, handle)
│   ├── TweetContent
│   ├── TweetMetadata (timestamp, engagement)
│   ├── UserComment (optional)
│   └── ActionBar
```

**Props:**
```typescript
interface TweetCardProps {
  tweet: Tweet;
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ [@] Elon Musk                   [𝕏]      │
│     @elonmusk · 1h ago                   │
├──────────────────────────────────────────┤
│                                          │
│  Just shipped a new feature to X that    │
│  uses obsidian purple. Looks amazing! 🚀 │
│                                          │
│  #design #purple #glassmorphism          │
│                                          │
│  💬 125   🔁 2.3K   ❤️ 15.2K            │
│                                          │
│  ┃ "Love the new aesthetic!" - Diego     │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Visual Specs:**
- Profile pic: 48px circle
- Username: `font-semibold`, white
- Handle: `text-sm`, gray, `@username`
- Content: `text-base`, `leading-relaxed`
- Engagement metrics: Gray text with icons
- Hashtags/mentions: Purple color, clickable

**Special Features:**
- Parse and highlight @mentions
- Parse and highlight #hashtags
- Auto-link URLs in tweet text
- Thread indicator (if part of thread)
- Quote tweet support (nested card)

---

### 3.5 RSSCard

RSS feed item display.

**Component Hierarchy:**
```
RSSCard
├── GlassCard
│   ├── ContentHeader (RSS source)
│   ├── ItemTitle
│   ├── Excerpt/Summary
│   ├── ReadMoreButton
│   ├── UserComment (optional)
│   └── ActionBar
```

**Props:**
```typescript
interface RSSCardProps {
  item: RSSItem;
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ 📡 CSS-Tricks                     [RSS]  │
│    12 hours ago                          │
├──────────────────────────────────────────┤
│  Modern CSS Techniques for 2025          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Discover the latest CSS features that   │
│  will change how you build websites...   │
│                                          │
│  📄 Read Full Article ↗                 │
│                                          │
│  ┃ "Great resource for staying current"  │
├──────────────────────────────────────────┤
│ ❤ 24   💬 5   ↗ Share   🔖             │
└──────────────────────────────────────────┘
```

**Visual Specs:**
- Compact layout (less padding than articles)
- RSS icon: Orange accent color
- Source name: Prominent display
- Timestamp: Relative time format
- No thumbnail by default (text-focused)

**Special Features:**
- RSS source categorization
- Optional thumbnail extraction from content
- HTML content sanitization
- Smart excerpt generation (first 150 chars)

---

## 4. Layout Components

### 4.1 FeedContainer

Main scrollable feed area.

**Props:**
```typescript
interface FeedContainerProps {
  items: FeedItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

**Layout:**
```
┌─────────────────────────────────┐
│         [Header]                │
│  ─────────────────────────────  │
│                                 │
│         [FeedCard 1]            │
│                                 │
│         [FeedCard 2]            │
│                                 │
│         [FeedCard 3]            │
│                                 │
│      [Load More Trigger]        │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- Infinite scroll with Intersection Observer
- Skeleton loaders for items
- Empty state illustration
- Pull-to-refresh (mobile)
- "Back to top" floating button

**Visual Specs:**
- Max width: `900px`
- Gap between cards: `24px` (desktop), `16px` (mobile)
- Padding: `32px` (desktop), `16px` (mobile)
- Center aligned

---

### 4.2 Header

Sticky navigation header.

**Layout:**
```
┌────────────────────────────────────────┐
│  MyFeed 🌟      [Search]   [Filter] 🌙 │
└────────────────────────────────────────┘
```

**Components:**
- Logo/Title
- Search bar (expandable on mobile)
- Filter dropdown
- Theme toggle
- User menu (future)

**Visual Specs:**
- Height: `64px`
- Glass strong variant
- Sticky position with backdrop blur
- Z-index: 10

---

### 4.3 FilterBar

Content type filter controls.

**Layout:**
```
┌─────────────────────────────────────────┐
│  [All] [📝 Markdown] [📺 YouTube]      │
│  [🌐 Articles] [𝕏 Tweets] [📡 RSS]    │
└─────────────────────────────────────────┘
```

**Visual Specs:**
- Pill-shaped buttons
- Glass subtle background
- Active state: Purple background
- Horizontal scroll on mobile

---

## 5. Loading & Empty States

### 5.1 SkeletonCard

Loading placeholder.

```
┌──────────────────────────────────┐
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░     ░░░  │
│                                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░   │
│ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░   │
│                                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└──────────────────────────────────┘
```

**Animation:** Shimmer gradient moving left to right

---

### 5.2 EmptyState

No content message.

```
┌──────────────────────────────────┐
│                                  │
│         [Illustration]           │
│                                  │
│    No feed items yet             │
│    Start adding content!         │
│                                  │
│      [+ Add Content]             │
│                                  │
└──────────────────────────────────┘
```

---

## 6. Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Full-width cards with minimal padding
- Collapsible header on scroll
- Bottom sheet for filters
- Touch-optimized tap targets (48px min)

### Tablet (640px - 1024px)
- Single column, wider cards
- Inline filters
- Larger touch targets
- Enhanced hover states

### Desktop (> 1024px)
- Centered feed column (max 900px)
- Full hover interactions
- Keyboard navigation
- Sidebar filters (optional)

---

## 7. Accessibility

All components include:
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Alt text for images
- Color contrast compliance
- Screen reader announcements

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Status:** Ready for Implementation
