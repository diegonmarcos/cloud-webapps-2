// ============================================
// MYMAPS PRO - PLACE LISTS STORE
// ============================================

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { LngLat } from '$lib/services/api/types';

const STORAGE_KEY = 'mymaps-place-lists';
const TEMP_PINS_KEY = 'mymaps-temp-pins';
const LIST_VISIBILITY_KEY = 'mymaps-list-visibility';
const QUICK_SEARCH_KEY = 'mymaps-quick-search';
const SEARCH_RADIUS_KEY = 'mymaps-search-radius';

// Types
export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  coordinates: LngLat;
  addedAt: number;
}

export interface PlaceList {
  id: string;
  name: string;
  color: string;
  places: SavedPlace[];
  createdAt: number;
}

export interface TempPin {
  id: string;
  name: string;
  address: string;
  coordinates: LngLat;
  createdAt: number;
}

// Default lists
const defaultLists: PlaceList[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    color: '#ef4444',
    places: [],
    createdAt: Date.now()
  },
  {
    id: 'want-to-go',
    name: 'Want to go',
    color: '#3b82f6',
    places: [],
    createdAt: Date.now()
  }
];

// Load from localStorage
function loadLists(): PlaceList[] {
  if (!browser) return defaultLists;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return defaultLists;
}

function saveLists(lists: PlaceList[]): void {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // Ignore errors
  }
}

function loadTempPins(): TempPin[] {
  if (!browser) return [];
  try {
    const stored = localStorage.getItem(TEMP_PINS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return [];
}

function saveTempPins(pins: TempPin[]): void {
  if (!browser) return;
  try {
    localStorage.setItem(TEMP_PINS_KEY, JSON.stringify(pins));
  } catch {
    // Ignore errors
  }
}

// Create place lists store
function createPlaceListsStore() {
  const { subscribe, set, update } = writable<PlaceList[]>(loadLists());

  return {
    subscribe,

    /**
     * Add a new list
     */
    addList(name: string, color: string = '#6b7280'): string {
      const id = `list-${Date.now()}`;
      update(lists => {
        const newLists = [...lists, {
          id,
          name,
          color,
          places: [],
          createdAt: Date.now()
        }];
        saveLists(newLists);
        return newLists;
      });
      return id;
    },

    /**
     * Remove a list
     */
    removeList(listId: string) {
      update(lists => {
        const newLists = lists.filter(l => l.id !== listId);
        saveLists(newLists);
        return newLists;
      });
    },

    /**
     * Rename a list
     */
    renameList(listId: string, name: string) {
      update(lists => {
        const newLists = lists.map(l =>
          l.id === listId ? { ...l, name } : l
        );
        saveLists(newLists);
        return newLists;
      });
    },

    /**
     * Add place to a list
     */
    addPlace(listId: string, place: Omit<SavedPlace, 'id' | 'addedAt'>): string {
      const placeId = `place-${Date.now()}`;
      update(lists => {
        const newLists = lists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              places: [...l.places, {
                ...place,
                id: placeId,
                addedAt: Date.now()
              }]
            };
          }
          return l;
        });
        saveLists(newLists);
        return newLists;
      });
      return placeId;
    },

    /**
     * Remove place from a list
     */
    removePlace(listId: string, placeId: string) {
      update(lists => {
        const newLists = lists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              places: l.places.filter(p => p.id !== placeId)
            };
          }
          return l;
        });
        saveLists(newLists);
        return newLists;
      });
    },

    /**
     * Check if a place is in any list (by coordinates)
     */
    isPlaceInAnyList(coordinates: LngLat): boolean {
      let found = false;
      const unsubscribe = subscribe(lists => {
        found = lists.some(l =>
          l.places.some(p =>
            p.coordinates[0] === coordinates[0] &&
            p.coordinates[1] === coordinates[1]
          )
        );
      });
      unsubscribe();
      return found;
    },

    /**
     * Get lists containing a place (by coordinates)
     */
    getListsForPlace(coordinates: LngLat): PlaceList[] {
      let result: PlaceList[] = [];
      const unsubscribe = subscribe(lists => {
        result = lists.filter(l =>
          l.places.some(p =>
            p.coordinates[0] === coordinates[0] &&
            p.coordinates[1] === coordinates[1]
          )
        );
      });
      unsubscribe();
      return result;
    }
  };
}

// Create temp pins store
function createTempPinsStore() {
  const { subscribe, set, update } = writable<TempPin[]>(loadTempPins());

  return {
    subscribe,

    /**
     * Add a temporary pin from search
     */
    add(pin: Omit<TempPin, 'id' | 'createdAt'>): string {
      const id = `temp-${Date.now()}`;
      update(pins => {
        // Check if pin already exists at these coordinates
        const exists = pins.some(p =>
          p.coordinates[0] === pin.coordinates[0] &&
          p.coordinates[1] === pin.coordinates[1]
        );
        if (exists) return pins;

        const newPins = [...pins, {
          ...pin,
          id,
          createdAt: Date.now()
        }];
        saveTempPins(newPins);
        return newPins;
      });
      return id;
    },

    /**
     * Remove a single temp pin
     */
    remove(pinId: string) {
      update(pins => {
        const newPins = pins.filter(p => p.id !== pinId);
        saveTempPins(newPins);
        return newPins;
      });
    },

    /**
     * Clear all temporary pins
     */
    clearAll() {
      set([]);
      saveTempPins([]);
    },

    /**
     * Remove pin by coordinates (when added to a list)
     */
    removeByCoordinates(coordinates: LngLat) {
      update(pins => {
        const newPins = pins.filter(p =>
          p.coordinates[0] !== coordinates[0] ||
          p.coordinates[1] !== coordinates[1]
        );
        saveTempPins(newPins);
        return newPins;
      });
    }
  };
}

export const placeLists = createPlaceListsStore();
export const tempPins = createTempPinsStore();

// Derived store for total saved places count
export const totalSavedPlaces = derived(placeLists, $lists =>
  $lists.reduce((sum, list) => sum + list.places.length, 0)
);

// Derived store for temp pins count
export const tempPinsCount = derived(tempPins, $pins => $pins.length);

// ============================================
// LIST VISIBILITY STORE
// ============================================

function loadListVisibility(): Record<string, boolean> {
  if (!browser) return {};
  try {
    const stored = localStorage.getItem(LIST_VISIBILITY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore errors
  }
  return {};
}

function saveListVisibility(visibility: Record<string, boolean>): void {
  if (!browser) return;
  try {
    localStorage.setItem(LIST_VISIBILITY_KEY, JSON.stringify(visibility));
  } catch {
    // Ignore errors
  }
}

function createListVisibilityStore() {
  const { subscribe, set, update } = writable<Record<string, boolean>>(loadListVisibility());

  return {
    subscribe,

    toggle(listId: string) {
      update(v => {
        const newV = { ...v, [listId]: !v[listId] };
        saveListVisibility(newV);
        return newV;
      });
    },

    setVisible(listId: string, visible: boolean) {
      update(v => {
        const newV = { ...v, [listId]: visible };
        saveListVisibility(newV);
        return newV;
      });
    },

    isVisible(listId: string): boolean {
      let result = false;
      const unsub = subscribe(v => { result = v[listId] ?? false; });
      unsub();
      return result;
    }
  };
}

export const listVisibility = createListVisibilityStore();

// ============================================
// QUICK SEARCH CATEGORIES STORE
// ============================================

export interface QuickSearchCategory {
  id: string;
  name: string;
  emoji: string;
  query: string; // OSM/search query
}

export const quickSearchCategories: QuickSearchCategory[] = [
  { id: 'supermarket', name: 'Supermarkets', emoji: '🛒', query: 'supermarket' },
  { id: 'park', name: 'Parks', emoji: '🌳', query: 'park' },
  { id: 'gym', name: 'Gyms', emoji: '💪', query: 'gym fitness' },
  { id: 'bar', name: 'Bars', emoji: '🍺', query: 'bar pub' },
  { id: 'hostel', name: 'Hostels', emoji: '🛏️', query: 'hostel' },
  { id: 'restaurant', name: 'Restaurants', emoji: '🍽️', query: 'restaurant' },
  { id: 'cafe', name: 'Cafes', emoji: '☕', query: 'cafe coffee' },
  { id: 'pharmacy', name: 'Pharmacies', emoji: '💊', query: 'pharmacy' },
  { id: 'atm', name: 'ATMs', emoji: '🏧', query: 'atm bank' },
  { id: 'gas', name: 'Gas Stations', emoji: '⛽', query: 'gas station fuel' }
];

export interface QuickSearchPin {
  id: string;
  categoryId: string;
  name: string;
  address: string;
  coordinates: LngLat;
}

function loadActiveCategories(): string[] {
  if (!browser) return [];
  try {
    const stored = localStorage.getItem(QUICK_SEARCH_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore errors
  }
  return [];
}

function saveActiveCategories(categories: string[]): void {
  if (!browser) return;
  try {
    localStorage.setItem(QUICK_SEARCH_KEY, JSON.stringify(categories));
  } catch {
    // Ignore errors
  }
}

function createQuickSearchStore() {
  const activeCategories = writable<string[]>(loadActiveCategories());
  const pins = writable<QuickSearchPin[]>([]);
  const isLoading = writable<boolean>(false);

  return {
    activeCategories: {
      subscribe: activeCategories.subscribe,

      toggle(categoryId: string) {
        activeCategories.update(cats => {
          const newCats = cats.includes(categoryId)
            ? cats.filter(c => c !== categoryId)
            : [...cats, categoryId];
          saveActiveCategories(newCats);
          return newCats;
        });
      },

      isActive(categoryId: string): boolean {
        let result = false;
        const unsub = activeCategories.subscribe(cats => {
          result = cats.includes(categoryId);
        });
        unsub();
        return result;
      },

      clear() {
        activeCategories.set([]);
        saveActiveCategories([]);
      }
    },

    pins: {
      subscribe: pins.subscribe,

      set(newPins: QuickSearchPin[]) {
        pins.set(newPins);
      },

      addPins(newPins: QuickSearchPin[]) {
        pins.update(p => [...p, ...newPins]);
      },

      clearCategory(categoryId: string) {
        pins.update(p => p.filter(pin => pin.categoryId !== categoryId));
      },

      clearAll() {
        pins.set([]);
      }
    },

    isLoading: {
      subscribe: isLoading.subscribe,
      set: isLoading.set
    }
  };
}

export const quickSearch = createQuickSearchStore();

// ============================================
// SEARCH RADIUS STORE
// ============================================

function loadSearchRadius(): number {
  if (!browser) return 10;
  try {
    const stored = localStorage.getItem(SEARCH_RADIUS_KEY);
    if (stored) return parseFloat(stored);
  } catch {
    // Ignore errors
  }
  return 10; // Default 10km
}

function saveSearchRadius(radius: number): void {
  if (!browser) return;
  try {
    localStorage.setItem(SEARCH_RADIUS_KEY, String(radius));
  } catch {
    // Ignore errors
  }
}

function createSearchRadiusStore() {
  const { subscribe, set } = writable<number>(loadSearchRadius());

  return {
    subscribe,

    set(radius: number) {
      const clamped = Math.max(1, Math.min(100, radius));
      set(clamped);
      saveSearchRadius(clamped);
    }
  };
}

export const searchRadius = createSearchRadiusStore();
