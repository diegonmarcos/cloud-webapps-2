import { ref } from 'vue'
import type { Movie } from '@/types/movie'

export function usePlayer() {
  const showPlayer = ref(false)
  const currentMovie = ref<Movie | null>(null)

  const openTrailer = (item: Movie) => {
    if (!item.imdbID) {
      alert('Cannot find trailer: No IMDb ID found.')
      return
    }

    // Open IMDB video gallery page for this title
    // This shows all available trailers and clips on IMDB
    const imdbVideoUrl = `https://www.imdb.com/title/${item.imdbID}/videogallery/`
    window.open(imdbVideoUrl, '_blank')
  }

  const openWebPlayer = (item: Movie) => {
    if (!item.imdbID) {
      alert('Cannot watch: No IMDb ID found.')
      return
    }

    currentMovie.value = item
    showPlayer.value = true
  }

  const closeWebPlayer = () => {
    showPlayer.value = false
    currentMovie.value = null
  }

  return {
    showPlayer,
    currentMovie,
    openTrailer,
    openWebPlayer,
    closeWebPlayer
  }
}
