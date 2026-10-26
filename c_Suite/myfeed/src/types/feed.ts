// Base interface shared by all feed items
export interface BaseFeedItem {
  id: string
  _createdAt: string
  _updatedAt?: string
  userComment?: string

  // Engagement (stored in localStorage)
  likes: number
  isLiked: boolean
  isBookmarked: boolean

  // Metadata
  tags?: string[]
  visibility?: 'public' | 'private' | 'unlisted'
}

// Markdown Article
export interface MarkdownArticle extends BaseFeedItem {
  type: 'markdown'
  _type: 'markdownArticle'

  // Content
  title: string
  content: string // Raw markdown
  excerpt?: string

  // Media
  coverImage?: {
    asset: {
      _ref: string
      _type: string
    }
    alt?: string
    hotspot?: any
  }

  // Author
  author: {
    name: string
    avatar?: {
      asset: {
        _ref: string
        _type: string
      }
    }
    bio?: string
  }

  // Metadata
  publishDate: string
  readTime?: number // Minutes
  slug: {
    current: string
    _type: 'slug'
  }
  category?: string
  tags: string[]

  // SEO
  metaDescription?: string
  keywords?: string[]
}

// YouTube Video
export interface YouTubeVideo extends BaseFeedItem {
  type: 'youtube'
  _type: 'youtubeVideo'

  // YouTube Data
  videoId: string
  title: string
  description?: string
  thumbnail?: string

  // Channel Info
  channel: {
    name: string
    id: string
    thumbnail?: string
  }

  // Video Metadata
  publishDate: string
  duration: string // e.g., "10:25"
  viewCount?: number
  likeCount?: number

  // Timestamps
  startTime?: number // Seconds

  // User additions
  userComment?: string
  customTitle?: string
}

// External Article
export interface ExternalArticle extends BaseFeedItem {
  type: 'article'
  _type: 'externalArticle'

  // Article Data
  title: string
  url: string
  excerpt?: string

  // Source
  source: {
    name: string
    domain: string
    favicon?: string
  }

  // Media
  thumbnail?: {
    asset: {
      _ref: string
      _type: string
    }
  }

  // Author
  author?: {
    name: string
    avatar?: {
      asset: {
        _ref: string
        _type: string
      }
    }
  }

  // Metadata
  publishDate?: string
  readTime?: number

  // Open Graph data
  og?: {
    title?: string
    description?: string
    image?: string
    siteName?: string
  }
}

// Tweet
export interface Tweet extends BaseFeedItem {
  type: 'tweet'
  _type: 'tweet'

  // Tweet Content
  content: string
  tweetId?: string
  url?: string

  // Author
  author: {
    name: string
    handle: string // @username
    avatar?: {
      asset: {
        _ref: string
        _type: string
      }
    }
    verified?: boolean
  }

  // Engagement (from Twitter)
  twitterEngagement?: {
    likes: number
    retweets: number
    replies: number
    views?: number
  }

  // Media attachments
  media?: Array<{
    type: 'photo' | 'video' | 'gif'
    url: string
    alt?: string
    thumbnail?: string
  }>

  // Thread
  isThread?: boolean
  threadPosition?: number

  // Quote Tweet
  quotedTweet?: Tweet

  // Timestamp
  timestamp: string

  // Entities
  entities?: {
    hashtags: string[]
    mentions: string[]
    urls: Array<{
      url: string
      displayUrl: string
      expandedUrl: string
    }>
  }
}

// RSS Item
export interface RSSItem extends BaseFeedItem {
  type: 'rss'
  _type: 'rssItem'

  // Item Data
  title: string
  content: string // HTML or plain text
  summary?: string
  url: string

  // Source Feed
  feed: {
    name: string
    url: string
    siteUrl?: string
    favicon?: string
    category?: string
  }

  // Author
  author?: {
    name: string
    email?: string
  }

  // Dates
  publishDate: string

  // Media
  thumbnail?: {
    asset: {
      _ref: string
      _type: string
    }
  }

  // Enclosures (podcast, video)
  enclosure?: {
    url: string
    type: string // MIME type
    length?: number // Bytes
  }

  // Categories
  categories?: string[]
}

// Tidal Track
export interface TidalTrack extends BaseFeedItem {
  type: 'tidal'
  _type: 'tidalTrack'

  // Track Data
  title: string
  artist: string
  album?: string
  duration?: string
  coverUrl?: string
  tidalUrl: string
}

// Discriminated union of all feed item types
export type FeedItem =
  | MarkdownArticle
  | YouTubeVideo
  | ExternalArticle
  | Tweet
  | RSSItem
  | TidalTrack

// Type guards
export function isMarkdownArticle(item: FeedItem): item is MarkdownArticle {
  return item.type === 'markdown'
}

export function isYouTubeVideo(item: FeedItem): item is YouTubeVideo {
  return item.type === 'youtube'
}

export function isExternalArticle(item: FeedItem): item is ExternalArticle {
  return item.type === 'article'
}

export function isTweet(item: FeedItem): item is Tweet {
  return item.type === 'tweet'
}

export function isRSSItem(item: FeedItem): item is RSSItem {
  return item.type === 'rss'
}

export function isTidalTrack(item: FeedItem): item is TidalTrack {
  return item.type === 'tidal'
}

// Filter/Sort types
export type FeedFilterType = 'all' | 'markdown' | 'youtube' | 'article' | 'tweet' | 'rss' | 'tidal'

export type SortBy = 'createdAt' | 'publishDate' | 'likes'
export type SortOrder = 'asc' | 'desc'

export interface FeedFilters {
  type: FeedFilterType
  tags?: string[]
  search?: string
  sortBy: SortBy
  order: SortOrder
  startDate?: Date
  endDate?: Date
}

// Pagination
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// API Response types
export interface GetFeedResponse {
  items: FeedItem[]
  pagination: Pagination
  filters: Partial<FeedFilters>
}

// Local Storage types
export interface LocalStorageData {
  theme: 'dark' | 'light'
  filters: Partial<FeedFilters>
  likes: Record<string, boolean>
  bookmarks: Record<string, boolean>
  comments: Record<string, string>
  lastScrollPosition: number
  expandedItems: string[]
}

// Search result type
export interface SearchResult {
  item: FeedItem
  score: number
  matches: Array<{
    field: string
    value: string
    indices: number[][]
  }>
}
