// Loads/saves the Movies config (sources-core.mjs::MOVIE_CONFIG) in this browser only.
import * as Core from '@/lib/sources-core.mjs'

export const MOVIE_CONFIG_KEY = 'movies_sources_v1'
export const USER_SOURCES_KEY = 'movies_user_sources_v1'

export function loadMovieConfig(): any {
  let raw: any = {}
  try { raw = JSON.parse(localStorage.getItem(MOVIE_CONFIG_KEY) || '{}') } catch { raw = {} }
  try { raw.tmdb_key = raw.tmdb_key || localStorage.getItem('tmdb_api_key') || '' } catch { /* storage blocked */ }
  return Core.normalizeMovieConfig(raw, navigator.language)
}
export function saveMovieConfig(cfg: any): boolean {
  try {
    localStorage.setItem(MOVIE_CONFIG_KEY, JSON.stringify(cfg))
    if (cfg.tmdb_key) localStorage.setItem('tmdb_api_key', cfg.tmdb_key)
    return true
  } catch { return false }
}
