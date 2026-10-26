import type { FeedItem } from '@/types/feed'

export const sampleFeed: FeedItem[] = [
  // Markdown Article 1
  {
    id: 'md-001',
    type: 'markdown',
    _type: 'markdownArticle',
    _createdAt: '2025-11-18T10:00:00Z',
    title: 'Building MyFeed: A Modern Content Aggregation Platform',
    content: `# Welcome to MyFeed

MyFeed is a modern content aggregation platform that combines the best features of social media feeds and blog platforms.

## Key Features

- **Multi-Format Content**: Support for Markdown articles, YouTube videos, external links, tweets, and RSS feeds
- **Glass Morphism Design**: Beautiful obsidian purple theme with translucent glass effects
- **Full-Text Search**: Powered by Orama for instant, typo-tolerant search
- **Virtual Scrolling**: Handle 1000+ items smoothly

## Technical Stack

\`\`\`typescript
const stack = {
  framework: 'Vue 3',
  styling: 'Tailwind CSS',
  state: 'Pinia',
  cms: 'Sanity.io'
}
\`\`\`

### Performance Optimizations

1. **Auto-Animate** - Zero-config animations (4KB)
2. **lite-youtube-embed** - Saves 500KB per video
3. **Orama Search** - 4KB full-text search engine

> This is a blockquote showcasing the beautiful prose styling with obsidian purple accents.

The result is a lightning-fast, beautiful feed experience! ✨`,
    excerpt: 'MyFeed is a modern content aggregation platform combining social feeds and blogs with an obsidian purple theme.',
    coverImage: {
      asset: {
        _ref: 'image-cover',
        _type: 'image',
      },
      alt: 'MyFeed cover image',
    },
    author: {
      name: 'Diego Marcos',
      avatar: {
        asset: {
          _ref: 'avatar-diego',
          _type: 'image',
        },
      },
    },
    publishDate: '2025-11-18T10:00:00Z',
    readTime: 5,
    slug: {
      current: 'building-myfeed',
      _type: 'slug',
    },
    category: 'Development',
    tags: ['vue', 'design', 'glassmorphism', 'web-development'],
    likes: 42,
    isLiked: false,
    isBookmarked: true,
    userComment: 'Excited to share this project! Built with Vue 3 and an obsidian purple design system.',
  },

  // External Article 1
  {
    id: 'ext-001',
    type: 'article',
    _type: 'externalArticle',
    _createdAt: '2025-11-18T08:00:00Z',
    title: 'The Future of CSS: New Features Coming in 2025',
    url: 'https://css-tricks.com/future-css-2025/',
    excerpt: 'Exploring upcoming CSS features including container queries, :has() selector, and cascade layers that will transform web development...',
    source: {
      name: 'CSS-Tricks',
      domain: 'css-tricks.com',
    },
    author: {
      name: 'Chris Coyier',
    },
    publishDate: '2025-11-10T08:00:00Z',
    readTime: 12,
    likes: 89,
    isLiked: false,
    isBookmarked: true,
    userComment: 'Excellent overview of new CSS features! Container queries will be game-changing.',
  },

  // Tweet 1
  {
    id: 'twt-001',
    type: 'tweet',
    _type: 'tweet',
    _createdAt: '2025-11-18T07:30:00Z',
    content: `Just shipped MyFeed with @vuejs! 🎨✨

The obsidian purple + glass morphism combo looks absolutely stunning. Built with:
- Vue 3 Composition API
- Tailwind CSS
- Auto-Animate
- Orama search

Check it out! #webdev #vue #design`,
    author: {
      name: 'Diego Marcos',
      handle: '@diegonmarcos',
      verified: false,
    },
    timestamp: '2025-11-18T07:30:00Z',
    twitterEngagement: {
      likes: 1203,
      retweets: 156,
      replies: 34,
      views: 15230,
    },
    likes: 24,
    isLiked: true,
    isBookmarked: false,
    userComment: 'Proud of this launch! The design system turned out even better than expected.',
  },

  // RSS Item 1
  {
    id: 'rss-001',
    type: 'rss',
    _type: 'rssItem',
    _createdAt: '2025-11-18T06:00:00Z',
    title: 'Understanding Modern JavaScript Frameworks in 2025',
    content: '<p>A comprehensive look at React, Vue, and Svelte in 2025. Each framework has evolved significantly...</p>',
    summary: 'Comprehensive comparison of modern JavaScript frameworks with performance benchmarks and use cases.',
    url: 'https://blog.example.com/modern-js-frameworks',
    feed: {
      name: 'Frontend Weekly',
      url: 'https://blog.example.com/feed.xml',
      siteUrl: 'https://blog.example.com',
      category: 'Development',
    },
    author: {
      name: 'Jane Developer',
    },
    publishDate: '2025-11-17T09:00:00Z',
    categories: ['JavaScript', 'Frontend', 'React', 'Vue'],
    likes: 12,
    isLiked: false,
    isBookmarked: false,
  },

  // Markdown Article 2
  {
    id: 'md-002',
    type: 'markdown',
    _type: 'markdownArticle',
    _createdAt: '2025-11-17T15:00:00Z',
    title: 'Glass Morphism: The Design Trend Taking Over 2025',
    content: `# Glass Morphism Design

Glass morphism is a design trend that creates a frosted glass effect using:
- Semi-transparent backgrounds
- Backdrop blur filters
- Subtle borders
- Layered shadows

## Implementation in CSS

\`\`\`css
.glass-card {
  background: rgba(45, 27, 78, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
\`\`\`

## Why It Works

The frosted glass effect creates depth and hierarchy while maintaining visual clarity. It's particularly effective for:
- Dashboard interfaces
- Card-based layouts
- Modal dialogs
- Navigation bars

Perfect for modern web applications!`,
    excerpt: 'Exploring the glass morphism design trend with practical implementation examples.',
    author: {
      name: 'Diego Marcos',
    },
    publishDate: '2025-11-17T15:00:00Z',
    readTime: 3,
    slug: {
      current: 'glass-morphism-design',
      _type: 'slug',
    },
    category: 'Design',
    tags: ['design', 'css', 'glassmorphism', 'ui'],
    likes: 67,
    isLiked: false,
    isBookmarked: false,
  },

  // External Article 2
  {
    id: 'ext-002',
    type: 'article',
    _type: 'externalArticle',
    _createdAt: '2025-11-17T12:00:00Z',
    title: 'TypeScript 5.4: What\'s New and Exciting',
    url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/',
    excerpt: 'TypeScript 5.4 brings exciting new features including improved type inference, better error messages, and performance enhancements.',
    source: {
      name: 'TypeScript Blog',
      domain: 'devblogs.microsoft.com',
    },
    publishDate: '2025-11-16T08:00:00Z',
    likes: 45,
    isLiked: false,
    isBookmarked: false,
  },

  // Tweet 2
  {
    id: 'twt-002',
    type: 'tweet',
    _type: 'tweet',
    _createdAt: '2025-11-17T11:00:00Z',
    content: `Hot take: Glass morphism is the new skeuomorphism 🔥

But done right, it creates beautiful depth without the kitsch. The key is subtlety:
- Low opacity backgrounds (10-20%)
- Minimal blur (10-20px)
- Soft borders

What do you think? #webdesign #ui`,
    author: {
      name: 'Diego Marcos',
      handle: '@diegonmarcos',
    },
    timestamp: '2025-11-17T11:00:00Z',
    twitterEngagement: {
      likes: 567,
      retweets: 89,
      replies: 23,
    },
    likes: 15,
    isLiked: false,
    isBookmarked: false,
  },

  // RSS Item 2
  {
    id: 'rss-002',
    type: 'rss',
    _type: 'rssItem',
    _createdAt: '2025-11-17T09:00:00Z',
    title: 'Vite 5.0 Released: Faster Than Ever',
    content: '<p>Vite 5.0 brings major performance improvements with faster cold starts and HMR updates...</p>',
    summary: 'Vite 5.0 announcement with performance benchmarks and new features.',
    url: 'https://vitejs.dev/blog/announcing-vite-5',
    feed: {
      name: 'Vite Blog',
      url: 'https://vitejs.dev/blog/feed.xml',
      siteUrl: 'https://vitejs.dev',
      category: 'Tools',
    },
    publishDate: '2025-11-16T10:00:00Z',
    categories: ['Vite', 'Build Tools', 'Performance'],
    likes: 8,
    isLiked: false,
    isBookmarked: true,
    userComment: 'Vite keeps getting better! The HMR speed is unmatched.',
  },
]
