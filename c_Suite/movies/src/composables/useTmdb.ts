import { ref, computed } from 'vue'
import axios from 'axios'

const TMDB_BASE = 'https://api.themoviedb.org/3'

// In-memory cache: imdbID → tmdbId
const tmdbCache = ref<Record<string, number>>({})

export function useTmdb() {
  const tmdbApiKey = ref(localStorage.getItem('tmdb_api_key') || '')
  const tempTmdbKey = ref('')

  const hasTmdbKey = computed(() => !!tmdbApiKey.value)

  const saveTmdbKey = () => {
    if (!tempTmdbKey.value) return
    tmdbApiKey.value = tempTmdbKey.value.trim()
    localStorage.setItem('tmdb_api_key', tmdbApiKey.value)
    tempTmdbKey.value = ''
  }

  const clearTmdbKey = () => {
    tmdbApiKey.value = ''
    localStorage.removeItem('tmdb_api_key')
  }

  const fetchTmdbId = async (imdbId: string, mediaType: 'movie' | 'series' | 'episode'): Promise<number | undefined> => {
    if (tmdbCache.value[imdbId]) return tmdbCache.value[imdbId]
    if (!tmdbApiKey.value) return undefined

    try {
      const res = await axios.get(`${TMDB_BASE}/find/${imdbId}`, {
        params: {
          api_key: tmdbApiKey.value,
          external_source: 'imdb_id'
        }
      })

      let tmdbId: number | undefined

      if (mediaType === 'movie' && res.data.movie_results?.length > 0) {
        tmdbId = res.data.movie_results[0].id
      } else if ((mediaType === 'series' || mediaType === 'episode') && res.data.tv_results?.length > 0) {
        tmdbId = res.data.tv_results[0].id
      }

      // Fallback: check both arrays
      if (!tmdbId) {
        tmdbId = res.data.movie_results?.[0]?.id ?? res.data.tv_results?.[0]?.id
      }

      if (tmdbId) {
        tmdbCache.value[imdbId] = tmdbId
      }

      return tmdbId
    } catch (err) {
      console.error(`[useTmdb] Failed to fetch TMDB ID for ${imdbId}:`, err)
      return undefined
    }
  }

  const getCachedTmdbId = (imdbId: string): number | undefined => {
    return tmdbCache.value[imdbId]
  }

  return {
    tmdbApiKey,
    tempTmdbKey,
    hasTmdbKey,
    saveTmdbKey,
    clearTmdbKey,
    fetchTmdbId,
    getCachedTmdbId,
    tmdbCache
  }
}
