import { ref, onMounted } from 'vue'

// Tidal track/album item for the feed
export interface TidalItem {
  id: string
  type: 'tidal'
  _type: 'tidalTrack'
  _createdAt: string

  title: string
  artist: string
  album?: string
  duration?: string
  coverUrl?: string
  tidalUrl: string

  likes: number
  isLiked: boolean
  isBookmarked: boolean
}

export interface TidalFeedOptions {
  username: string
  maxItems?: number
  autoFetch?: boolean
  label?: string
}

const DEFAULT_OPTIONS: TidalFeedOptions = {
  username: 'diegonmarcos',
  maxItems: 10,
  autoFetch: true,
  label: '🎧 TIDAL'
}

// CORS proxies to try
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

export function useTidalFeed(options: TidalFeedOptions = { username: 'diegonmarcos' }) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const tracks = ref<TidalItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Parse Tidal profile page for track data
  function parseTidalPage(html: string): TidalItem[] {
    const items: TidalItem[] = []

    try {
      // Try to find JSON-LD data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          try {
            const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '')
            const data = JSON.parse(jsonStr)
            if (data.track || data.tracks || data['@type'] === 'MusicPlaylist') {
              console.log('Found Tidal JSON-LD:', data)
            }
          } catch (e) {
            // Continue
          }
        }
      }

      // Try to find __NEXT_DATA__ (Next.js initial state)
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1])
          const pageProps = nextData?.props?.pageProps

          // Extract tracks from various possible locations
          const tracksData = pageProps?.tracks ||
                           pageProps?.playlist?.tracks ||
                           pageProps?.favorites?.tracks ||
                           pageProps?.user?.favorites?.tracks ||
                           []

          if (Array.isArray(tracksData)) {
            for (const track of tracksData.slice(0, config.maxItems)) {
              items.push(convertToFeedItem(track))
            }
          }

          // Also check for albums
          const albumsData = pageProps?.albums || pageProps?.favorites?.albums || []
          if (Array.isArray(albumsData) && items.length < (config.maxItems || 10)) {
            for (const album of albumsData.slice(0, (config.maxItems || 10) - items.length)) {
              items.push(convertAlbumToFeedItem(album))
            }
          }
        } catch (e) {
          console.warn('Failed to parse __NEXT_DATA__:', e)
        }
      }

      // Don't use meta tag fallback - let it use the proper fallback data with 10 songs
    } catch (e) {
      console.error('Failed to parse Tidal page:', e)
    }

    return items
  }

  // Convert Tidal track data to feed item
  function convertToFeedItem(track: any): TidalItem {
    return {
      id: `tidal-${track.id || track.uuid || Math.random().toString(36)}`,
      type: 'tidal',
      _type: 'tidalTrack',
      _createdAt: track.dateAdded || track.streamStartDate || new Date().toISOString(),
      title: track.title || track.name || 'Unknown Track',
      artist: track.artist?.name || track.artists?.[0]?.name || 'Unknown Artist',
      album: track.album?.title || track.album?.name || undefined,
      duration: track.duration ? formatDuration(track.duration) : undefined,
      coverUrl: track.album?.cover
        ? `https://resources.tidal.com/images/${track.album.cover.replace(/-/g, '/')}/320x320.jpg`
        : undefined,
      tidalUrl: track.url || `https://tidal.com/track/${track.id}`,
      likes: 0,
      isLiked: false,
      isBookmarked: false,
    }
  }

  // Convert Tidal album data to feed item
  function convertAlbumToFeedItem(album: any): TidalItem {
    return {
      id: `tidal-album-${album.id || album.uuid || Math.random().toString(36)}`,
      type: 'tidal',
      _type: 'tidalTrack',
      _createdAt: album.releaseDate || album.streamStartDate || new Date().toISOString(),
      title: album.title || album.name || 'Unknown Album',
      artist: album.artist?.name || album.artists?.[0]?.name || 'Unknown Artist',
      album: 'Album',
      coverUrl: album.cover
        ? `https://resources.tidal.com/images/${album.cover.replace(/-/g, '/')}/320x320.jpg`
        : undefined,
      tidalUrl: album.url || `https://tidal.com/album/${album.id}`,
      likes: 0,
      isLiked: false,
      isBookmarked: false,
    }
  }

  // Format duration from seconds
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Fetch Tidal profile
  async function fetchTidalFeed() {
    isLoading.value = true
    error.value = null

    const profileUrl = `https://tidal.com/@${config.username}`

    try {
      let html: string | null = null

      for (const proxy of CORS_PROXIES) {
        try {
          const response = await fetch(proxy + encodeURIComponent(profileUrl))
          if (response.ok) {
            html = await response.text()
            break
          }
        } catch (e) {
          console.warn(`Failed with proxy ${proxy}:`, e)
          continue
        }
      }

      if (!html) {
        throw new Error('Failed to fetch Tidal profile from all proxies')
      }

      const items = parseTidalPage(html)

      if (items.length > 0) {
        tracks.value = items
      } else {
        // Use fallback data
        useFallbackData()
      }
    } catch (e) {
      console.error('Failed to fetch Tidal feed:', e)
      error.value = 'Could not fetch Tidal profile'
      useFallbackData()
    } finally {
      isLoading.value = false
    }
  }

  // Fallback/example data with 10 tracks
  function useFallbackData() {
    tracks.value = [
      {
        id: 'tidal-example-001',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-10T08:00:00Z',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: '3:20',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        tidalUrl: 'https://tidal.com/track/123456789',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-002',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-12T14:30:00Z',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: '5:55',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273e319baafd16e84f0408af2a0',
        tidalUrl: 'https://tidal.com/track/987654321',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-003',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-15T20:00:00Z',
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin IV',
        duration: '8:02',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69',
        tidalUrl: 'https://tidal.com/track/456789123',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-004',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-18T10:00:00Z',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        album: 'Thriller',
        duration: '4:54',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b27351c02a77d09dfcd53c8676d0',
        tidalUrl: 'https://tidal.com/track/111222333',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-005',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-20T16:00:00Z',
        title: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        album: 'Nevermind',
        duration: '5:01',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2739180218ecd0b92a8a67d79c1',
        tidalUrl: 'https://tidal.com/track/444555666',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-006',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-22T12:00:00Z',
        title: 'Hotel California',
        artist: 'Eagles',
        album: 'Hotel California',
        duration: '6:30',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2734637341b9f507521afa9a778',
        tidalUrl: 'https://tidal.com/track/777888999',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-007',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-25T09:00:00Z',
        title: 'Lose Yourself',
        artist: 'Eminem',
        album: '8 Mile Soundtrack',
        duration: '5:26',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273726d48d93d02e1271774f023',
        tidalUrl: 'https://tidal.com/track/101112131',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-008',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-01-28T14:00:00Z',
        title: 'Imagine',
        artist: 'John Lennon',
        album: 'Imagine',
        duration: '3:04',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b27399581550ef9746ca582bb3cc',
        tidalUrl: 'https://tidal.com/track/141516171',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-009',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-02-01T11:00:00Z',
        title: 'Sweet Child O\' Mine',
        artist: 'Guns N\' Roses',
        album: 'Appetite for Destruction',
        duration: '5:56',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273e44963b8bb127552ac761873',
        tidalUrl: 'https://tidal.com/track/181920212',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: 'tidal-example-010',
        type: 'tidal',
        _type: 'tidalTrack',
        _createdAt: '2024-02-05T18:00:00Z',
        title: 'Like a Rolling Stone',
        artist: 'Bob Dylan',
        album: 'Highway 61 Revisited',
        duration: '6:13',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273d52bfb90ee8dfeda8378b99a',
        tidalUrl: 'https://tidal.com/track/222324252',
        likes: 0,
        isLiked: false,
        isBookmarked: false,
      },
    ]
  }

  // Auto-fetch on mount
  onMounted(() => {
    if (config.autoFetch) {
      fetchTidalFeed()
    }
  })

  return {
    tracks,
    isLoading,
    error,
    fetchTidalFeed,
    config
  }
}
