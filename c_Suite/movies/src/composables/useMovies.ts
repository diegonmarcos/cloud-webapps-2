import { ref, computed } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash-es'
import type { Movie, OmdbSearchResponse, OmdbDetailResponse, ViewType, MovieDatabase, CategoryDatabase } from '@/types/movie'
import moviesDb from '@/data/movies.json'
import categoriesDb from '@/data/categories.json'

// Secret key (reversed)
const _vault = '96e992d2'

const loadLocalList = (key: string): Movie[] => {
  const ids = (categoriesDb as Record<string, string[]>)[key] || []
  return ids
    .map(id => (moviesDb as MovieDatabase)[id])
    .filter((m): m is Movie => m !== undefined)
}

export function useMovies() {
  const apiKey = ref(localStorage.getItem('omdb_api_key') || '')
  const tempApiKey = ref('')
  const movies = ref<Movie[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const view = ref<ViewType>('home')
  const bulkInput = ref('')
  const showBulkInput = ref(false)

  // Cache for all lists - stores fetched movies by list name
  const cache = ref<Record<string, Movie[]>>({})
  const isCacheLoaded = ref(false)

  const hasApiKey = computed(() => !!apiKey.value)

  const api = axios.create({
    baseURL: 'https://www.omdbapi.com/'
  })

  api.interceptors.request.use(config => {
    if (apiKey.value) {
      config.params = { ...config.params, apikey: apiKey.value }
    }
    return config
  })

  // Load curated lists from local JSON (synchronous, no API calls)
  const initializeLocalData = () => {
    console.log('[useMovies] Loading local data...')
    for (const key of Object.keys(categoriesDb)) {
      cache.value[key] = loadLocalList(key)
      console.debug(`[useMovies] Loaded ${key}: ${cache.value[key].length} movies`)
    }
    isCacheLoaded.value = true
    movies.value = cache.value.home || []
    console.log(`[useMovies] Initialized with ${Object.keys(categoriesDb).length} categories, showing ${movies.value.length} home movies`)
  }

  const saveApiKey = () => {
    if (!tempApiKey.value) return

    // Easter egg: check for secret password
    if (tempApiKey.value.toLowerCase().trim() === 'popcorn') {
      apiKey.value = _vault.split('').reverse().join('')
    } else {
      apiKey.value = tempApiKey.value.trim()
    }

    localStorage.setItem('omdb_api_key', apiKey.value)
    tempApiKey.value = ''
  }

  const clearApiKey = () => {
    apiKey.value = ''
    localStorage.removeItem('omdb_api_key')
    // Keep locally-loaded curated data, only clear bulk
    cache.value.bulk = []
    if (view.value === 'bulk' || view.value === 'search') {
      view.value = 'home'
      movies.value = cache.value.home || []
    }
  }

  const setView = (newView: ViewType) => {
    view.value = newView
    error.value = null
    searchQuery.value = ''

    // Use cached data for curated views
    if (newView !== 'search') {
      movies.value = cache.value[newView] || []
    }
  }

  const fetchByIds = async (ids: string[]): Promise<Movie[]> => {
    if (!apiKey.value) return []

    try {
      const results: Movie[] = []

      for (const id of ids) {
        try {
          const res = await api.get<OmdbDetailResponse>('', { params: { i: id } })
          if (res.data.Response === 'True') {
            results.push(res.data)
          }
        } catch (e) {
          console.error(`Error fetching ${id}:`, e)
        }
      }

      return results
    } catch (err) {
      console.error('Error fetching by IDs:', err)
      return []
    }
  }

  const searchMovies = async () => {
    if (!searchQuery.value.trim() || !apiKey.value) return

    loading.value = true
    error.value = null

    try {
      const res = await api.get<OmdbSearchResponse>('', {
        params: { s: searchQuery.value }
      })

      if (res.data.Response === 'True' && res.data.Search) {
        movies.value = res.data.Search
      } else {
        movies.value = []
        if (res.data.Error && res.data.Error !== 'Movie not found!') {
          error.value = res.data.Error
        }
      }
    } catch (err) {
      error.value = 'Search failed. Please try again.'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const debouncedSearch = debounce(() => {
    if (searchQuery.value) searchMovies()
  }, 500)

  const toggleBulkInput = () => {
    showBulkInput.value = !showBulkInput.value
    if (!showBulkInput.value) {
      bulkInput.value = ''
    }
  }

  const fetchBulk = async () => {
    if (!bulkInput.value.trim() || !apiKey.value) return

    // Parse comma-separated IMDb IDs
    const ids = bulkInput.value
      .split(',')
      .map(id => id.trim())
      .filter(id => id.startsWith('tt') || /^\d+$/.test(id))
      .map(id => id.startsWith('tt') ? id : `tt${id}`)

    if (ids.length === 0) {
      error.value = 'No valid IMDb IDs found. Use format: tt1234567, tt7654321'
      return
    }

    loading.value = true
    error.value = null
    view.value = 'bulk'
    showBulkInput.value = false

    try {
      const results = await fetchByIds(ids)
      cache.value.bulk = results
      movies.value = results

      if (results.length === 0) {
        error.value = 'No movies found for the provided IDs'
      }
    } catch (err) {
      error.value = 'Failed to fetch movies. Please try again.'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Initialize local data immediately (no API key needed)
  initializeLocalData()

  return {
    apiKey,
    tempApiKey,
    hasApiKey,
    movies,
    loading,
    error,
    searchQuery,
    view,
    isCacheLoaded,
    bulkInput,
    showBulkInput,
    saveApiKey,
    clearApiKey,
    setView,
    searchMovies,
    debouncedSearch,
    toggleBulkInput,
    fetchBulk
  }
}
