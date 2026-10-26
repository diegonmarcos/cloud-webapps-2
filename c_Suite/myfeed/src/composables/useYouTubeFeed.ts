import { ref, onMounted } from 'vue'
import type { YouTubeVideo } from '@/types/feed'

// Configuration options
export interface YouTubeFeedOptions {
  // Feed source (use one of these)
  channelHandle?: string      // e.g., 'diegonmarcos1' (without @)
  channelId?: string          // e.g., 'UCxxxxxx'
  playlistId?: string         // e.g., 'PLxxxxxx'

  // Display options
  maxItems?: number           // Limit number of videos
  autoFetch?: boolean         // Auto-fetch on mount (default: true)
  label?: string              // Custom label for the feed source (e.g., 'MUSIC', 'CS_NEWS')
}

// Default configuration
const DEFAULT_OPTIONS: YouTubeFeedOptions = {
  channelHandle: 'diegonmarcos1',
  maxItems: 15,
  autoFetch: true,
}

// CORS proxies to try (in order)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

interface YouTubeRSSEntry {
  id: string
  videoId: string
  title: string
  published: string
  updated: string
  author: string
  description: string
  thumbnail: string
}

export function useYouTubeFeed(options: YouTubeFeedOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const videos = ref<YouTubeVideo[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const channelId = ref<string | null>(config.channelId || null)
  const playlistId = ref<string | null>(config.playlistId || null)

  // Extract channel ID from channel page (only needed if using channelHandle)
  async function getChannelId(): Promise<string | null> {
    if (!config.channelHandle) return null

    const channelUrl = `https://www.youtube.com/@${config.channelHandle}`

    for (const proxy of CORS_PROXIES) {
      try {
        const response = await fetch(proxy + encodeURIComponent(channelUrl))
        const html = await response.text()

        // Extract channel ID from page HTML
        const channelIdMatch = html.match(/channel_id=([a-zA-Z0-9_-]+)/)
        if (channelIdMatch) {
          return channelIdMatch[1]
        }

        // Alternative pattern
        const browseIdMatch = html.match(/"browseId":"(UC[a-zA-Z0-9_-]+)"/)
        if (browseIdMatch) {
          return browseIdMatch[1]
        }

        // Try external channel ID pattern
        const externalIdMatch = html.match(/"externalChannelId":"(UC[a-zA-Z0-9_-]+)"/)
        if (externalIdMatch) {
          return externalIdMatch[1]
        }
      } catch (e) {
        console.warn(`Failed to get channel ID via proxy ${proxy}:`, e)
        continue
      }
    }

    return null
  }

  // Build the RSS feed URL based on config
  function buildFeedUrl(): string | null {
    // Priority: playlist > channelId > channelHandle (requires lookup)
    if (config.playlistId) {
      return `https://www.youtube.com/feeds/videos.xml?playlist_id=${config.playlistId}`
    }

    if (channelId.value) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId.value}`
    }

    return null
  }

  // Parse YouTube RSS XML
  function parseYouTubeRSS(xmlText: string): YouTubeRSSEntry[] {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const entries = xmlDoc.querySelectorAll('entry')
    const items: YouTubeRSSEntry[] = []

    entries.forEach((entry) => {
      const id = entry.querySelector('id')?.textContent || ''
      const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent ||
                      id.replace('yt:video:', '')
      const title = entry.querySelector('title')?.textContent || ''
      const published = entry.querySelector('published')?.textContent || ''
      const updated = entry.querySelector('updated')?.textContent || ''
      const author = entry.querySelector('author > name')?.textContent || ''

      // Get description from media:group > media:description
      const description = entry.querySelector('media\\:group media\\:description, group description')?.textContent || ''

      // Get thumbnail from media:group > media:thumbnail
      const thumbnailUrl = entry.querySelector('media\\:group media\\:thumbnail, group thumbnail')?.getAttribute('url') ||
                          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`

      if (videoId) {
        items.push({
          id: videoId,
          videoId,
          title,
          published,
          updated,
          author,
          description,
          thumbnail: thumbnailUrl
        })
      }
    })

    return items
  }

  // Convert RSS entries to YouTubeVideo type
  function convertToFeedItems(entries: YouTubeRSSEntry[], channelName: string, channelIdVal: string): YouTubeVideo[] {
    // Use label if provided, otherwise use channel name
    const displayName = config.label
      ? `${config.label}`
      : channelName

    return entries.map((entry, index) => ({
      id: `yt-${config.playlistId || 'channel'}-${entry.videoId}`,
      type: 'youtube' as const,
      _type: 'youtubeVideo' as const,
      _createdAt: entry.published,

      videoId: entry.videoId,
      title: entry.title,
      description: entry.description.substring(0, 200) + (entry.description.length > 200 ? '...' : ''),
      thumbnail: entry.thumbnail,

      channel: {
        name: displayName,
        id: channelIdVal,
        thumbnail: undefined
      },

      publishDate: entry.published,
      duration: '', // Not available from RSS

      likes: 0,
      isLiked: false,
      isBookmarked: false,
    }))
  }

  // Fetch YouTube RSS feed
  async function fetchYouTubeFeed() {
    isLoading.value = true
    error.value = null

    try {
      // If using playlist, we can fetch directly
      // If using channelHandle without channelId, we need to look it up first
      if (!config.playlistId && !channelId.value && config.channelHandle) {
        const cId = await getChannelId()
        if (cId) {
          channelId.value = cId
        }
      }

      const feedUrl = buildFeedUrl()

      if (!feedUrl) {
        error.value = 'Could not determine feed URL (no playlist, channel ID, or channel handle)'
        useFallbackData()
        return
      }

      let xmlText: string | null = null

      for (const proxy of CORS_PROXIES) {
        try {
          const response = await fetch(proxy + encodeURIComponent(feedUrl))
          if (response.ok) {
            xmlText = await response.text()
            break
          }
        } catch (e) {
          console.warn(`Failed with proxy ${proxy}:`, e)
          continue
        }
      }

      if (!xmlText) {
        throw new Error('Failed to fetch YouTube feed from all proxies')
      }

      let entries = parseYouTubeRSS(xmlText)

      // Apply maxItems limit
      if (config.maxItems && entries.length > config.maxItems) {
        entries = entries.slice(0, config.maxItems)
      }

      if (entries.length > 0) {
        const sourceName = config.playlistId
          ? `Playlist ${config.playlistId}`
          : entries[0].author || config.channelHandle || 'YouTube'
        const sourceId = config.playlistId || channelId.value || ''
        videos.value = convertToFeedItems(entries, sourceName, sourceId)
      } else {
        error.value = 'No videos found in feed'
        useFallbackData()
      }
    } catch (e) {
      console.error('Failed to fetch YouTube feed:', e)
      error.value = 'Could not fetch YouTube feed'
      useFallbackData()
    } finally {
      isLoading.value = false
    }
  }

  // Fallback/example data - 10 videos about CS, Music, Buddhism
  function useFallbackData() {
    videos.value = [
      // Computer Science
      {
        id: 'yt-example-001',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-01-15T10:00:00Z',
        videoId: 'aircAruvnKk',
        title: 'But what is a neural network? | Deep learning chapter 1',
        description: '3Blue1Brown explains neural networks visually',
        thumbnail: 'https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg',
        channel: { name: '3Blue1Brown', id: 'UCYO_jab_esuFRV4b17AJtAw' },
        publishDate: '2017-10-05T00:00:00Z',
        duration: '19:13',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-002',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-01-20T14:30:00Z',
        videoId: '8jLOx1hD3_o',
        title: 'CS50 2023 - Lecture 0 - Scratch',
        description: 'Harvard CS50 Introduction to Computer Science',
        thumbnail: 'https://i.ytimg.com/vi/8jLOx1hD3_o/mqdefault.jpg',
        channel: { name: 'CS50', id: 'UCcabW7890RKJzL968QWEykA' },
        publishDate: '2023-09-01T00:00:00Z',
        duration: '2:05:20',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-003',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-01-25T09:15:00Z',
        videoId: 'rfscVS0vtbw',
        title: 'Learn Python - Full Course for Beginners',
        description: 'freeCodeCamp Python tutorial for beginners',
        thumbnail: 'https://i.ytimg.com/vi/rfscVS0vtbw/mqdefault.jpg',
        channel: { name: 'freeCodeCamp.org', id: 'UC8butISFwT-Wl7EV0hUK0BQ' },
        publishDate: '2018-07-11T00:00:00Z',
        duration: '4:26:52',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-004',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-02-01T11:00:00Z',
        videoId: 'HGOBQPFzWKo',
        title: 'Intro to Algorithms: Crash Course Computer Science #13',
        description: 'Crash Course explains algorithms fundamentals',
        thumbnail: 'https://i.ytimg.com/vi/HGOBQPFzWKo/mqdefault.jpg',
        channel: { name: 'CrashCourse', id: 'UCX6b17PVsYBQ0ip5gyeme-Q' },
        publishDate: '2017-05-24T00:00:00Z',
        duration: '11:44',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      // Music
      {
        id: 'yt-example-005',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-02-05T16:00:00Z',
        videoId: 'kOkQ4T5WO9E',
        title: 'Jacob Collier: Tiny Desk Concert',
        description: 'NPR Music Tiny Desk performance by Jacob Collier',
        thumbnail: 'https://i.ytimg.com/vi/kOkQ4T5WO9E/mqdefault.jpg',
        channel: { name: 'NPR Music', id: 'UC4eYXhJI4-7wSWc8UNRwD4A' },
        publishDate: '2019-08-13T00:00:00Z',
        duration: '18:35',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-006',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-02-10T12:00:00Z',
        videoId: 'eRkgK4jfi6M',
        title: 'Beethoven - Moonlight Sonata (FULL)',
        description: 'Beethoven\'s Piano Sonata No. 14 in C-sharp minor',
        thumbnail: 'https://i.ytimg.com/vi/eRkgK4jfi6M/mqdefault.jpg',
        channel: { name: 'Rousseau', id: 'UCPZUQqtVDmcjm4NY5FkzqLA' },
        publishDate: '2019-03-17T00:00:00Z',
        duration: '15:00',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-007',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-02-15T09:00:00Z',
        videoId: 'rYEDA3JcQqw',
        title: 'How Music Works: Melody',
        description: 'Adam Neely explains melody in music theory',
        thumbnail: 'https://i.ytimg.com/vi/rYEDA3JcQqw/mqdefault.jpg',
        channel: { name: 'Adam Neely', id: 'UCnkp4xDOwqqJD7sSM3xdUiQ' },
        publishDate: '2018-04-20T00:00:00Z',
        duration: '12:47',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      // Buddhism
      {
        id: 'yt-example-008',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-02-20T14:00:00Z',
        videoId: 'mMRrCYPxD0I',
        title: 'Thich Nhat Hanh: The Art of Mindful Living',
        description: 'Talk on mindfulness and meditation by Zen master',
        thumbnail: 'https://i.ytimg.com/vi/mMRrCYPxD0I/mqdefault.jpg',
        channel: { name: 'Plum Village', id: 'UCcflMGx-VSrcqQMGKmKzKHA' },
        publishDate: '2014-06-15T00:00:00Z',
        duration: '2:28:44',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-009',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-02-25T11:00:00Z',
        videoId: 'aAVPDYhW_nw',
        title: 'Alan Watts - The Real You',
        description: 'Alan Watts philosophical talk on identity and consciousness',
        thumbnail: 'https://i.ytimg.com/vi/aAVPDYhW_nw/mqdefault.jpg',
        channel: { name: 'After Skool', id: 'UC1KmNKYC1l0stjctkGswl6g' },
        publishDate: '2018-09-12T00:00:00Z',
        duration: '8:51',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'yt-example-010',
        type: 'youtube',
        _type: 'youtubeVideo',
        _createdAt: '2024-03-01T18:00:00Z',
        videoId: 'ukTaodQfYRQ',
        title: 'Dalai Lama: Happiness and Inner Peace',
        description: 'His Holiness the Dalai Lama on finding inner peace',
        thumbnail: 'https://i.ytimg.com/vi/ukTaodQfYRQ/mqdefault.jpg',
        channel: { name: 'Dalai Lama', id: 'UCqWbKxpXU3wKlnpQnwvX8Kw' },
        publishDate: '2020-03-10T00:00:00Z',
        duration: '1:15:30',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
    ]
  }

  // Auto-fetch on mount (if enabled)
  onMounted(() => {
    if (config.autoFetch) {
      fetchYouTubeFeed()
    }
  })

  return {
    videos,
    isLoading,
    error,
    fetchYouTubeFeed,
    channelId,
    playlistId,
    config
  }
}
