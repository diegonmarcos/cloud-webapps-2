// ============================================
// MYMAPS PRO - SEARCH STORE
// ============================================

import { writable, derived } from 'svelte/store';
import type { SearchResult, PlaceDetails } from '$lib/services/api/types';
import { browser } from '$app/environment';

const RECENT_SEARCHES_KEY = 'mymaps-recent-searches';
const MAX_RECENT_SEARCHES = 10;

// Search query state
export const searchQuery = writable<string>('');
export const isSearching = writable<boolean>(false);
export const searchError = writable<string | null>(null);

// Results
export const searchResults = writable<SearchResult[]>([]);
export const selectedResult = writable<SearchResult | null>(null);

// Place details
export const selectedPlace = writable<PlaceDetails | null>(null);
export const isLoadingPlace = writable<boolean>(false);

/**
 * Load recent searches from localStorage
 */
function loadRecentSearches(): string[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }

  return [];
}

/**
 * Save recent searches to localStorage
 */
function saveRecentSearches(searches: string[]): void {
  if (!browser) return;

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore errors
  }
}

/**
 * Recent searches store
 */
function createRecentSearchesStore() {
  const { subscribe, set, update } = writable<string[]>(loadRecentSearches());

  return {
    subscribe,

    /**
     * Add a search query to recent searches
     */
    add(query: string) {
      const trimmed = query.trim();
      if (!trimmed) return;

      update(searches => {
        // Remove if already exists
        const filtered = searches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
        // Add to beginning
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        saveRecentSearches(updated);
        return updated;
      });
    },

    /**
     * Remove a search from recent searches
     */
    remove(query: string) {
      update(searches => {
        const filtered = searches.filter(s => s !== query);
        saveRecentSearches(filtered);
        return filtered;
      });
    },

    /**
     * Clear all recent searches
     */
    clear() {
      set([]);
      saveRecentSearches([]);
    }
  };
}

export const recentSearches = createRecentSearchesStore();

// Has results derived store
export const hasResults = derived(
  searchResults,
  ($results) => $results.length > 0
);

// Show results panel derived store
export const showResultsPanel = derived(
  [searchQuery, searchResults, isSearching],
  ([$query, $results, $loading]) => {
    return $query.length > 0 && ($results.length > 0 || $loading);
  }
);

/**
 * Clear search state
 */
export function clearSearch() {
  searchQuery.set('');
  searchResults.set([]);
  selectedResult.set(null);
  searchError.set(null);
}

/**
 * Clear selected place
 */
export function clearSelectedPlace() {
  selectedPlace.set(null);
  selectedResult.set(null);
}
