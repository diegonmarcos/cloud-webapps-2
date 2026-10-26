<script setup lang="ts">
import { watch } from 'vue'
import { useMovies } from '@/composables/useMovies'
import { usePlayer } from '@/composables/usePlayer'
import { useTmdb } from '@/composables/useTmdb'
import AppHeader from '@/components/AppHeader.vue'
import MovieCard from '@/components/MovieCard.vue'
import WebPlayer from '@/components/WebPlayer.vue'
import PrestigeInfo from '@/components/PrestigeInfo.vue'
import type { Movie } from '@/types/movie'

const {
  tempApiKey,
  hasApiKey,
  movies,
  loading,
  error,
  searchQuery,
  view,
  bulkInput,
  showBulkInput,
  saveApiKey,
  clearApiKey,
  setView,
  debouncedSearch,
  toggleBulkInput,
  fetchBulk
} = useMovies()

const {
  showPlayer,
  currentMovie,
  openTrailer,
  openWebPlayer,
  closeWebPlayer
} = usePlayer()

const {
  tempTmdbKey,
  hasTmdbKey,
  saveTmdbKey,
  clearTmdbKey,
  fetchTmdbId
} = useTmdb()

// Resolve TMDB IDs for visible movies when TMDB key is available
const resolveTmdbIds = async () => {
  if (!hasTmdbKey.value) return
  for (const movie of movies.value) {
    if (!movie.tmdbId) {
      const id = await fetchTmdbId(movie.imdbID, movie.Type)
      if (id) movie.tmdbId = id
    }
  }
}

watch([movies, hasTmdbKey], resolveTmdbIds, { immediate: true })

const handleWatch = (movie: Movie) => {
  openTrailer(movie)
}

const handleWebPlayer = async (movie: Movie) => {
  if (!movie.tmdbId && hasTmdbKey.value) {
    movie.tmdbId = await fetchTmdbId(movie.imdbID, movie.Type)
  }
  openWebPlayer(movie)
}

// Popular movie IMDb IDs for random selection
const popularMovieIds = [
  'tt0111161', // The Shawshank Redemption
  'tt0068646', // The Godfather
  'tt0468569', // The Dark Knight
  'tt0071562', // The Godfather Part II
  'tt0050083', // 12 Angry Men
  'tt0108052', // Schindler's List
  'tt0167260', // The Lord of the Rings: The Return of the King
  'tt0110912', // Pulp Fiction
  'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
  'tt0109830', // Forrest Gump
  'tt1375666', // Inception
  'tt0167261', // The Lord of the Rings: The Two Towers
  'tt0073486', // One Flew Over the Cuckoo's Nest
  'tt0099685', // Goodfellas
  'tt0133093', // The Matrix
  'tt0047478', // Seven Samurai
  'tt0114369', // Se7en
  'tt0317248', // City of God
  'tt0102926', // The Silence of the Lambs
  'tt0038650', // It's a Wonderful Life
]

const handleOpenWebPlayerFromHeader = () => {
  const randomId = popularMovieIds[Math.floor(Math.random() * popularMovieIds.length)]
  const dummyMovie: Movie = {
    imdbID: randomId,
    Title: 'Random Movie',
    Year: '2024',
    Type: 'movie',
    Poster: 'N/A'
  }
  openWebPlayer(dummyMovie)
}
</script>

<template>
  <!-- Scorsese Noir Animated Background -->
  <div class="scene-bg">
    <div class="city-silhouette"></div>
    <div class="spotlight"></div>
    <div class="spotlight-2"></div>
    <div class="blinds"></div>
    <div class="rain"></div>
    <div class="rain-2"></div>
    <div class="fog"></div>
    <div class="fog-2"></div>
    <div class="neon-glow"></div>
    <div class="neon-glow-2"></div>
    <div class="neon-glow-3"></div>
    <div class="window-lights"></div>
  </div>

  <div id="app">
    <AppHeader
      :hasApiKey="hasApiKey"
      :hasTmdbKey="hasTmdbKey"
      :tempApiKey="tempApiKey"
      :tempTmdbKey="tempTmdbKey"
      :view="view"
      :searchQuery="searchQuery"
      :bulkInput="bulkInput"
      :showBulkInput="showBulkInput"
      @update:tempApiKey="tempApiKey = $event"
      @update:tempTmdbKey="tempTmdbKey = $event"
      @update:searchQuery="searchQuery = $event"
      @update:bulkInput="bulkInput = $event"
      @saveKey="saveApiKey"
      @clearKey="clearApiKey"
      @saveTmdbKey="saveTmdbKey"
      @clearTmdbKey="clearTmdbKey"
      @setView="setView"
      @search="debouncedSearch"
      @openWebPlayer="handleOpenWebPlayerFromHeader"
      @toggleBulkInput="toggleBulkInput"
      @fetchBulk="fetchBulk"
    />

    <main>
      <!-- Prestige Table (above grid for prestige views) -->
      <PrestigeInfo
        v-if="view === 'prestige20m' || view === 'prestigepre22' || view === 'prestigetier2'"
        :view="view"
      />

      <!-- Loading State -->
      <div v-if="loading" class="status-msg loading">
        <div class="spinner"></div>
        <p>LOADING...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="status-msg error">
        <p>{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="movies.length === 0 && !loading" class="status-msg empty">
        <p>NO RESULTS FOUND</p>
        <span class="hint">Try a different search or select a category</span>
      </div>

      <!-- Content Grid -->
      <div v-else class="media-grid">
        <MovieCard
          v-for="movie in movies"
          :key="movie.imdbID"
          :movie="movie"
          @watch="handleWatch"
          @webplayer="handleWebPlayer"
        />
      </div>
    </main>

    <!-- Web Player Overlay -->
    <WebPlayer
      v-if="showPlayer && currentMovie"
      :imdbId="currentMovie.imdbID"
      :tmdbId="currentMovie.tmdbId"
      :movieType="currentMovie.Type"
      :title="currentMovie.Title"
      :year="currentMovie.Year"
      @close="closeWebPlayer"
    />
  </div>
</template>

<style lang="scss">
// Global styles imported in main.ts
</style>

<style lang="scss" scoped>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px;
  position: relative;
  z-index: 1;
}

main {
  min-height: 50vh;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.status-msg {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  p {
    font-family: 'Bebas Neue', 'Oswald', sans-serif;
    font-size: 1.5rem;
    letter-spacing: 3px;
    color: var(--text-secondary);
    margin: 0;
  }

  &.loading p {
    color: var(--noir-silver);
  }

  &.error p {
    color: var(--noir-crimson);
  }

  &.empty .hint {
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 0.9rem;
    color: var(--text-muted);
    letter-spacing: 1px;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 2px solid var(--noir-smoke);
  border-top-color: var(--noir-red);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  #app {
    padding: 0 16px 24px;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}
</style>
