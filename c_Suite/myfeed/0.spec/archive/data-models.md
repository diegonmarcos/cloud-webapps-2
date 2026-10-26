# MyFeed - Data Models & API Specifications

## 1. Overview

This document defines the data structures, type definitions, and API specifications for the MyFeed application. All types are defined using TypeScript for type safety and developer experience.

## 2. Core Type Definitions

### 2.1 Base FeedItem

The discriminated union type for all feed items.

```typescript
// Base interface shared by all feed items
interface BaseFeedItem {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  userComment?: string;

  // Engagement
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;

  // Metadata
  tags?: string[];
  visibility?: 'public' | 'private' | 'unlisted';
}

// Discriminated union of all feed item types
type FeedItem =
  | MarkdownArticle
  | YouTubeVideo
  | ExternalArticle
  | Tweet
  | RSSItem;
```

### 2.2 MarkdownArticle

Proprietary markdown-based articles.

```typescript
interface MarkdownArticle extends BaseFeedItem {
  type: 'markdown';

  // Content
  title: string;
  content: string; // Raw markdown
  excerpt?: string; // Auto-generated or manual

  // Media
  coverImage?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
    blurhash?: string; // For blur-up placeholder
  };

  // Author
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };

  // Metadata
  publishDate: Date;
  readTime?: number; // Minutes, auto-calculated
  slug?: string; // URL-friendly identifier

  // Categories & Tags
  category?: string;
  tags: string[];

  // SEO
  metaDescription?: string;
  keywords?: string[];
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `content`: Required, minimum 100 characters
- `excerpt`: Optional, max 300 characters
- `tags`: Maximum 10 tags per article

**Example:**
```json
{
  "id": "art-001",
  "type": "markdown",
  "title": "Building Modern Design Systems",
  "content": "# Introduction\n\nDesign systems are...",
  "excerpt": "A deep dive into creating scalable design systems",
  "coverImage": {
    "url": "/images/design-systems.jpg",
    "alt": "Design system components",
    "width": 1200,
    "height": 630
  },
  "author": {
    "name": "Diego Marcos",
    "avatar": "/avatars/diego.jpg"
  },
  "publishDate": "2025-11-18T10:00:00Z",
  "readTime": 8,
  "category": "Design",
  "tags": ["design-systems", "ui-ux", "frontend"],
  "createdAt": "2025-11-18T10:00:00Z",
  "likes": 42,
  "isLiked": false,
  "isBookmarked": true
}
```

---

### 2.3 YouTubeVideo

YouTube video embeds with metadata.

```typescript
interface YouTubeVideo extends BaseFeedItem {
  type: 'youtube';

  // YouTube Data
  videoId: string; // YouTube video ID
  title: string;
  description?: string;

  // Thumbnails (YouTube provides multiple sizes)
  thumbnail: {
    default: string; // 120x90
    medium: string;  // 320x180
    high: string;    // 480x360
    standard?: string; // 640x480
    maxres?: string;  // 1280x720
  };

  // Channel Info
  channel: {
    name: string;
    id: string;
    thumbnail?: string;
  };

  // Video Metadata
  publishDate: Date;
  duration: string; // ISO 8601 format (PT1H2M10S)
  viewCount?: number;
  likeCount?: number;

  // Timestamps (for deep linking)
  startTime?: number; // Seconds

  // User additions
  userComment?: string;
  customTitle?: string; // Override YouTube title
}
```

**Validation Rules:**
- `videoId`: Required, valid YouTube ID format
- `title`: Required
- `duration`: ISO 8601 duration format

**Helper Functions:**
```typescript
// Parse YouTube duration to readable format
function formatDuration(duration: string): string {
  // "PT1H2M10S" → "1:02:10"
}

// Generate YouTube embed URL
function getEmbedUrl(videoId: string, startTime?: number): string {
  return `https://www.youtube.com/embed/${videoId}${startTime ? `?start=${startTime}` : ''}`;
}

// Generate thumbnail URL
function getThumbnailUrl(videoId: string, quality: 'default' | 'hq' | 'maxres'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}
```

**Example:**
```json
{
  "id": "vid-001",
  "type": "youtube",
  "videoId": "dQw4w9WgXcQ",
  "title": "Amazing Web Design Tutorial",
  "thumbnail": {
    "default": "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    "medium": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    "high": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
  },
  "channel": {
    "name": "Fireship",
    "id": "UCsBjURrPoezykLs9EqgamOA"
  },
  "publishDate": "2025-11-15T14:30:00Z",
  "duration": "PT10M25S",
  "userComment": "Great explanation of CSS Grid!",
  "createdAt": "2025-11-18T09:00:00Z",
  "likes": 156,
  "isLiked": true,
  "isBookmarked": false
}
```

---

### 2.4 ExternalArticle

Links to external articles with metadata.

```typescript
interface ExternalArticle extends BaseFeedItem {
  type: 'article';

  // Article Data
  title: string;
  url: string; // Canonical URL
  excerpt?: string;

  // Source
  source: {
    name: string; // "TechCrunch", "Medium", etc.
    domain: string; // "techcrunch.com"
    favicon?: string;
  };

  // Media
  thumbnail?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };

  // Author (if available)
  author?: {
    name: string;
    avatar?: string;
  };

  // Metadata
  publishDate?: Date;
  readTime?: number;

  // Open Graph data (scraped or provided)
  og?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
}
```

**Validation Rules:**
- `url`: Required, valid HTTP/HTTPS URL
- `title`: Required, 1-300 characters
- `source.domain`: Extracted from URL

**URL Metadata Extraction:**
```typescript
interface URLMetadata {
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

// Function to extract metadata from URL
async function fetchURLMetadata(url: string): Promise<URLMetadata> {
  // Use open-graph-scraper or similar
  // Fallback to manual HTML parsing
}
```

**Example:**
```json
{
  "id": "ext-001",
  "type": "article",
  "title": "The Future of CSS in 2025",
  "url": "https://css-tricks.com/future-css-2025/",
  "excerpt": "Exploring upcoming CSS features that will transform web development...",
  "source": {
    "name": "CSS-Tricks",
    "domain": "css-tricks.com",
    "favicon": "https://css-tricks.com/favicon.ico"
  },
  "thumbnail": {
    "url": "https://css-tricks.com/wp-content/uploads/2025/future-css.jpg",
    "alt": "CSS code example"
  },
  "author": {
    "name": "Chris Coyier"
  },
  "publishDate": "2025-11-10T08:00:00Z",
  "readTime": 12,
  "userComment": "Excellent overview of new CSS features",
  "createdAt": "2025-11-18T11:30:00Z",
  "likes": 89,
  "isLiked": false,
  "isBookmarked": true
}
```

---

### 2.5 Tweet

Twitter/X posts with native styling.

```typescript
interface Tweet extends BaseFeedItem {
  type: 'tweet';

  // Tweet Content
  content: string; // Tweet text
  tweetId?: string; // Original tweet ID (for embeds)
  url?: string; // Link to original tweet

  // Author
  author: {
    name: string;
    handle: string; // @username
    avatar?: string;
    verified?: boolean;
  };

  // Engagement (from Twitter)
  twitterEngagement?: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };

  // Media attachments
  media?: Array<{
    type: 'photo' | 'video' | 'gif';
    url: string;
    alt?: string;
    thumbnail?: string; // For videos
  }>;

  // Thread
  isThread?: boolean;
  threadPosition?: number; // Position in thread

  // Quote Tweet
  quotedTweet?: Tweet;

  // Timestamp
  timestamp: Date;

  // Entities (parsed from content)
  entities?: {
    hashtags: string[];
    mentions: string[];
    urls: Array<{
      url: string;
      displayUrl: string;
      expandedUrl: string;
    }>;
  };
}
```

**Validation Rules:**
- `content`: Required, max 280 characters (Twitter limit)
- `handle`: Must start with @
- `media`: Max 4 items

**Example:**
```json
{
  "id": "twt-001",
  "type": "tweet",
  "content": "Just shipped a new design system with @obsidianpurple theme! 🎨✨ Check it out:\n\nhttps://example.com/design-system\n\n#webdesign #glassmorphism",
  "tweetId": "1234567890",
  "url": "https://twitter.com/diegonmarcos/status/1234567890",
  "author": {
    "name": "Diego Marcos",
    "handle": "@diegonmarcos",
    "avatar": "/avatars/diego.jpg",
    "verified": false
  },
  "twitterEngagement": {
    "likes": 1203,
    "retweets": 156,
    "replies": 34
  },
  "timestamp": "2025-11-18T15:22:00Z",
  "entities": {
    "hashtags": ["webdesign", "glassmorphism"],
    "mentions": ["@obsidianpurple"],
    "urls": [{
      "url": "https://t.co/abc123",
      "displayUrl": "example.com/design-system",
      "expandedUrl": "https://example.com/design-system"
    }]
  },
  "createdAt": "2025-11-18T15:25:00Z",
  "likes": 24,
  "isLiked": true,
  "isBookmarked": false
}
```

---

### 2.6 RSSItem

RSS feed items.

```typescript
interface RSSItem extends BaseFeedItem {
  type: 'rss';

  // Item Data
  title: string;
  content: string; // HTML or plain text
  summary?: string; // Short description
  url: string; // Link to original

  // Source Feed
  feed: {
    name: string; // Feed title
    url: string; // Feed URL
    siteUrl?: string; // Website URL
    favicon?: string;
    category?: string; // User-defined category
  };

  // Author (if available in feed)
  author?: {
    name: string;
    email?: string;
  };

  // Dates
  publishDate: Date;

  // Media
  thumbnail?: {
    url: string;
    alt?: string;
  };

  // Enclosures (podcast, video)
  enclosure?: {
    url: string;
    type: string; // MIME type
    length?: number; // Bytes
  };

  // Categories from feed
  categories?: string[];
}
```

**Validation Rules:**
- `url`: Required, valid URL
- `content`: Sanitize HTML to prevent XSS
- `feed.url`: Valid RSS/Atom feed URL

**Example:**
```json
{
  "id": "rss-001",
  "type": "rss",
  "title": "Understanding Modern JavaScript Frameworks",
  "content": "<p>In this article, we explore the evolution of JavaScript frameworks...</p>",
  "summary": "A comprehensive look at React, Vue, and Svelte",
  "url": "https://blog.example.com/modern-js-frameworks",
  "feed": {
    "name": "Frontend Weekly",
    "url": "https://blog.example.com/feed.xml",
    "siteUrl": "https://blog.example.com",
    "category": "Development"
  },
  "author": {
    "name": "Jane Developer"
  },
  "publishDate": "2025-11-17T09:00:00Z",
  "categories": ["JavaScript", "Frontend", "React"],
  "createdAt": "2025-11-18T06:00:00Z",
  "likes": 12,
  "isLiked": false,
  "isBookmarked": false
}
```

---

## 3. API Specifications

### 3.1 REST API Endpoints

Base URL: `/api/v1`

#### Feed Operations

**GET /feed**
Get feed items with pagination and filtering.

```typescript
interface GetFeedRequest {
  // Pagination
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100

  // Filtering
  type?: FeedItem['type'] | 'all'; // Default: 'all'
  tags?: string[]; // Filter by tags
  search?: string; // Search in title/content

  // Sorting
  sortBy?: 'createdAt' | 'publishDate' | 'likes'; // Default: 'createdAt'
  order?: 'asc' | 'desc'; // Default: 'desc'

  // Date range
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
}

interface GetFeedResponse {
  items: FeedItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    appliedType?: string;
    appliedTags?: string[];
  };
}
```

**Example Request:**
```bash
GET /api/v1/feed?page=1&limit=20&type=markdown&sortBy=createdAt&order=desc
```

**Example Response:**
```json
{
  "items": [
    { /* MarkdownArticle */ },
    { /* YouTubeVideo */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "appliedType": "markdown"
  }
}
```

---

**GET /feed/:id**
Get single feed item by ID.

```typescript
interface GetFeedItemResponse {
  item: FeedItem;
}
```

**Example:**
```bash
GET /api/v1/feed/art-001
```

---

**POST /feed**
Create new feed item.

```typescript
interface CreateFeedItemRequest {
  item: Omit<FeedItem, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isLiked' | 'isBookmarked'>;
}

interface CreateFeedItemResponse {
  item: FeedItem;
  message: string;
}
```

**Example:**
```bash
POST /api/v1/feed
Content-Type: application/json

{
  "item": {
    "type": "markdown",
    "title": "My New Article",
    "content": "# Hello World\n\nThis is content..."
  }
}
```

---

**PUT /feed/:id**
Update existing feed item.

```typescript
interface UpdateFeedItemRequest {
  item: Partial<FeedItem>;
}

interface UpdateFeedItemResponse {
  item: FeedItem;
  message: string;
}
```

---

**DELETE /feed/:id**
Delete feed item.

```typescript
interface DeleteFeedItemResponse {
  message: string;
  deletedId: string;
}
```

---

#### Engagement Operations

**POST /feed/:id/like**
Toggle like on feed item.

```typescript
interface LikeResponse {
  isLiked: boolean;
  likes: number;
}
```

---

**POST /feed/:id/bookmark**
Toggle bookmark on feed item.

```typescript
interface BookmarkResponse {
  isBookmarked: boolean;
}
```

---

**POST /feed/:id/comment**
Add/update user comment.

```typescript
interface CommentRequest {
  comment: string; // Max 500 characters
}

interface CommentResponse {
  item: FeedItem;
  message: string;
}
```

---

#### Utility Endpoints

**GET /tags**
Get all available tags.

```typescript
interface GetTagsResponse {
  tags: Array<{
    name: string;
    count: number;
  }>;
}
```

---

**POST /youtube/metadata**
Fetch YouTube video metadata.

```typescript
interface YouTubeMetadataRequest {
  videoId: string;
}

interface YouTubeMetadataResponse {
  title: string;
  thumbnail: YouTubeVideo['thumbnail'];
  channel: YouTubeVideo['channel'];
  duration: string;
  publishDate: string;
}
```

---

**POST /url/metadata**
Scrape metadata from URL.

```typescript
interface URLMetadataRequest {
  url: string;
}

interface URLMetadataResponse {
  title: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  domain: string;
}
```

---

### 3.2 Static JSON Data (Simple Implementation)

For a static site approach, use JSON files:

```
myfeed/2.src/data/
├── feed-items.json       # All feed items
├── tags.json             # Tag index
└── metadata.json         # Site metadata
```

**feed-items.json structure:**
```json
{
  "items": [
    { /* FeedItem 1 */ },
    { /* FeedItem 2 */ }
  ],
  "lastUpdated": "2025-11-18T12:00:00Z"
}
```

**Client-side filtering and sorting:**
```typescript
// utils/feedFilters.ts
function filterFeedItems(
  items: FeedItem[],
  filters: GetFeedRequest
): FeedItem[] {
  let filtered = items;

  // Filter by type
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(item => item.type === filters.type);
  }

  // Filter by tags
  if (filters.tags?.length) {
    filtered = filtered.filter(item =>
      filters.tags!.some(tag => item.tags?.includes(tag))
    );
  }

  // Search
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(item => {
      const title = 'title' in item ? item.title.toLowerCase() : '';
      return title.includes(query);
    });
  }

  // Sort
  filtered.sort((a, b) => {
    const field = filters.sortBy || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;
    return (a[field] > b[field] ? 1 : -1) * order;
  });

  return filtered;
}

function paginateFeedItems(
  items: FeedItem[],
  page: number = 1,
  limit: number = 20
): { items: FeedItem[]; pagination: Pagination } {
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: items.slice(start, end),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: end < items.length,
      hasPrev: page > 1,
    },
  };
}
```

---

## 4. Local Storage Schema

For client-side persistence of user preferences and engagement.

```typescript
interface LocalStorageData {
  // User preferences
  theme: 'dark' | 'light';
  filters: {
    selectedType: FeedItem['type'] | 'all';
    selectedTags: string[];
  };

  // Engagement (keyed by item ID)
  likes: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  comments: Record<string, string>;

  // UI state
  lastScrollPosition: number;
  expandedItems: string[]; // IDs of expanded markdown articles
}

// LocalStorage helper functions
const STORAGE_KEY = 'myfeed-data';

function loadFromStorage(): LocalStorageData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data: Partial<LocalStorageData>): void {
  try {
    const current = loadFromStorage() || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...data }));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}
```

---

## 5. Data Validation

### 5.1 Zod Schemas

Use Zod for runtime validation:

```typescript
import { z } from 'zod';

// Base schema
const BaseFeedItemSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  userComment: z.string().max(500).optional(),
  likes: z.number().int().min(0).default(0),
  isLiked: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
});

// Markdown article schema
const MarkdownArticleSchema = BaseFeedItemSchema.extend({
  type: z.literal('markdown'),
  title: z.string().min(1).max(200),
  content: z.string().min(100),
  excerpt: z.string().max(300).optional(),
  // ... other fields
});

// Discriminated union
const FeedItemSchema = z.discriminatedUnion('type', [
  MarkdownArticleSchema,
  YouTubeVideoSchema,
  ExternalArticleSchema,
  TweetSchema,
  RSSItemSchema,
]);

// Validation function
function validateFeedItem(data: unknown): FeedItem {
  return FeedItemSchema.parse(data);
}
```

---

## 6. Database Schema (Future)

For Phase 2 with backend database:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feed items table
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'markdown', 'youtube', etc.
  data JSONB NOT NULL, -- Flexible JSON storage for type-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  publish_date TIMESTAMP,
  visibility VARCHAR(20) DEFAULT 'public',

  -- Indexes
  INDEX idx_type (type),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_user_id (user_id)
);

-- Engagement table
CREATE TABLE engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES feed_items(id),
  is_liked BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, item_id)
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0
);

-- Item tags junction table
CREATE TABLE item_tags (
  item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);
```

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Status:** Ready for Implementation
