import { ref, computed } from 'vue'

export interface NewsItem {
  id: string
  title: string
  description?: string
  source: string
  sourceUrl?: string
  url: string
  publishedAt: string
  category?: string
  thumbnail?: string
}

// CORS proxies for fetching RSS feeds
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

// Google News RSS URLs
const GOOGLE_NEWS_FEEDS: Record<string, string> = {
  headlines: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
  world: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
  tech: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
  science: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
  markets: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
}

// Cache for RSS feeds
const cache = new Map<string, { data: NewsItem[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function fetchWithProxy(url: string): Promise<string | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url))
      if (response.ok) {
        return await response.text()
      }
    } catch (e) {
      console.warn(`Proxy ${proxy} failed for ${url}`)
    }
  }
  return null
}

function parseRSSItem(item: Element, source: string): NewsItem {
  const title = item.querySelector('title')?.textContent || 'No title'
  const link = item.querySelector('link')?.textContent || ''
  const description = item.querySelector('description')?.textContent || ''
  const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString()
  const guid = item.querySelector('guid')?.textContent || link

  // Clean up Google News title (remove source suffix)
  const cleanTitle = title.replace(/ - [^-]+$/, '')

  // Extract source from Google News title if available
  const sourceMatch = title.match(/ - ([^-]+)$/)
  const itemSource = sourceMatch ? sourceMatch[1] : source

  // Google News RSS doesn't include images, so we use placeholder based on source
  // Generate a consistent placeholder color/image based on the source name
  const sourceHash = itemSource.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 10
  const placeholderImages = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&h=100&fit=crop', // newspaper
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=100&h=100&fit=crop', // news
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=100&h=100&fit=crop', // reading
    'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=100&h=100&fit=crop', // world
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop', // business
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop', // tech
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', // politics
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop', // science
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop', // markets
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=100&h=100&fit=crop', // general
  ]
  const thumbnail = placeholderImages[sourceHash]

  // Clean description (remove HTML)
  const cleanDescription = description
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .slice(0, 200)

  return {
    id: guid || `${link}-${Date.now()}`,
    title: cleanTitle,
    description: cleanDescription || undefined,
    source: itemSource,
    url: link,
    publishedAt: pubDate,
    thumbnail,
  }
}

async function fetchRSSFeed(category: string): Promise<NewsItem[]> {
  const url = GOOGLE_NEWS_FEEDS[category]
  if (!url) {
    console.warn(`Unknown category: ${category}`)
    return []
  }

  // Check cache
  const cached = cache.get(category)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const xml = await fetchWithProxy(url)
    if (!xml) {
      console.warn(`Failed to fetch RSS for ${category}`)
      return cached?.data || []
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items = doc.querySelectorAll('item')

    const newsItems: NewsItem[] = []
    items.forEach((item, index) => {
      if (index < 30) { // Limit to 30 items
        newsItems.push(parseRSSItem(item, 'Google News'))
      }
    })

    // Update cache
    cache.set(category, { data: newsItems, timestamp: Date.now() })

    return newsItems
  } catch (e) {
    console.error(`Error fetching RSS for ${category}:`, e)
    return cached?.data || []
  }
}

export function useRSSFeed(initialCategory: string = 'headlines') {
  const category = ref(initialCategory)
  const items = ref<NewsItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const categories = [
    { id: 'headlines', label: 'Headlines' },
    { id: 'world', label: 'World' },
    { id: 'tech', label: 'Tech' },
    { id: 'science', label: 'Science' },
    { id: 'markets', label: 'Markets' },
  ]

  // Example/fallback data with images
  function useFallbackData() {
    items.value = [
      {
        id: 'news-example-001',
        title: 'Tech Giants Report Strong Quarterly Earnings',
        description: 'Major technology companies exceeded analyst expectations with impressive revenue growth.',
        source: 'Reuters',
        url: 'https://reuters.com',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop',
      },
      {
        id: 'news-example-002',
        title: 'Climate Summit Reaches Historic Agreement',
        description: 'World leaders commit to ambitious carbon reduction targets at international conference.',
        source: 'BBC News',
        url: 'https://bbc.com',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        thumbnail: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=200&h=200&fit=crop',
      },
      {
        id: 'news-example-003',
        title: 'New AI Model Breaks Performance Records',
        description: 'Researchers unveil breakthrough in artificial intelligence capabilities.',
        source: 'TechCrunch',
        url: 'https://techcrunch.com',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop',
      },
      {
        id: 'news-example-004',
        title: 'Space Agency Announces Mars Mission Update',
        description: 'Latest developments in the ongoing exploration of the red planet.',
        source: 'Space.com',
        url: 'https://space.com',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        thumbnail: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=200&h=200&fit=crop',
      },
      {
        id: 'news-example-005',
        title: 'Global Markets Rally on Economic Data',
        description: 'Stock indices surge following positive employment and inflation reports.',
        source: 'Bloomberg',
        url: 'https://bloomberg.com',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop',
      },
    ]
  }

  async function loadFeed(cat?: string) {
    if (cat) {
      category.value = cat
    }

    loading.value = true
    error.value = null

    try {
      const fetchedItems = await fetchRSSFeed(category.value)
      if (fetchedItems.length > 0) {
        items.value = fetchedItems
      } else {
        useFallbackData()
      }
    } catch (e) {
      error.value = 'Failed to load news feed'
      console.error(e)
      useFallbackData()
    } finally {
      loading.value = false
    }
  }

  // Group items by time
  const groupedItems = computed(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)

    const groups: { label: string; items: NewsItem[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier', items: [] },
    ]

    items.value.forEach((item) => {
      const itemDate = new Date(item.publishedAt)
      if (itemDate >= today) {
        groups[0].items.push(item)
      } else if (itemDate >= yesterday) {
        groups[1].items.push(item)
      } else {
        groups[2].items.push(item)
      }
    })

    return groups.filter((g) => g.items.length > 0)
  })

  // Load initial feed
  loadFeed()

  return {
    category,
    categories,
    items,
    groupedItems,
    loading,
    error,
    loadFeed,
  }
}
