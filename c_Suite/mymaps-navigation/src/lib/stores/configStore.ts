// ============================================
// MYMAPS PRO - CONFIG STORE
// ============================================

import { writable, derived, get } from 'svelte/store';
import type { ApiConfig, Capabilities } from '$lib/services/api/types';
import { detectCapabilities } from '$lib/services/api/capabilities';
import { browser } from '$app/environment';

const STORAGE_KEY = 'mymaps-api-config';

// Default configuration (free providers only)
const defaultConfig: ApiConfig = {
  tiles: {
    primary: 'carto',
    keys: {}
  },
  geocoding: {
    providers: ['nominatim', 'photon'],
    keys: {}
  },
  places: {
    providers: ['overpass'],
    keys: {}
  },
  routing: {
    providers: ['osrm', 'valhalla'],
    keys: {}
  }
};

/**
 * Load configuration from localStorage
 */
function loadConfig(): ApiConfig {
  if (!browser) return defaultConfig;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return {
        tiles: { ...defaultConfig.tiles, ...parsed.tiles },
        geocoding: { ...defaultConfig.geocoding, ...parsed.geocoding },
        places: { ...defaultConfig.places, ...parsed.places },
        routing: { ...defaultConfig.routing, ...parsed.routing }
      };
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e);
  }

  return defaultConfig;
}

/**
 * Save configuration to localStorage
 */
function saveConfig(config: ApiConfig): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save config to localStorage:', e);
  }
}

/**
 * Create the API configuration store
 */
function createConfigStore() {
  const { subscribe, set, update } = writable<ApiConfig>(loadConfig());

  return {
    subscribe,

    /**
     * Update a specific API key
     */
    setApiKey(
      category: 'tiles' | 'geocoding' | 'places' | 'routing',
      provider: string,
      key: string | undefined
    ) {
      update(config => {
        const newConfig = { ...config };
        const categoryConfig = newConfig[category];
        const keys = { ...categoryConfig.keys } as Record<string, string | undefined>;

        if (key) {
          keys[provider] = key;
        } else {
          delete keys[provider];
        }

        if (category === 'tiles') {
          newConfig.tiles = {
            ...newConfig.tiles,
            keys: keys as typeof newConfig.tiles.keys
          };
        } else if (category === 'geocoding') {
          const providers = [...newConfig.geocoding.providers];
          if (key && !providers.includes(provider as typeof providers[number])) {
            providers.unshift(provider as typeof providers[number]);
          }
          newConfig.geocoding = {
            ...newConfig.geocoding,
            keys: keys as typeof newConfig.geocoding.keys,
            providers
          };
        } else if (category === 'places') {
          const providers = [...newConfig.places.providers];
          if (key && !providers.includes(provider as typeof providers[number])) {
            providers.unshift(provider as typeof providers[number]);
          }
          newConfig.places = {
            ...newConfig.places,
            keys: keys as typeof newConfig.places.keys,
            providers
          };
        } else if (category === 'routing') {
          const providers = [...newConfig.routing.providers];
          if (key && !providers.includes(provider as typeof providers[number])) {
            providers.unshift(provider as typeof providers[number]);
          }
          newConfig.routing = {
            ...newConfig.routing,
            keys: keys as typeof newConfig.routing.keys,
            providers
          };
        }

        saveConfig(newConfig);
        return newConfig;
      });
    },

    /**
     * Set the primary tile provider
     */
    setTileProvider(provider: 'carto' | 'stadia' | 'mapbox' | 'maptiler') {
      update(config => {
        const newConfig = {
          ...config,
          tiles: {
            ...config.tiles,
            primary: provider
          }
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    /**
     * Reset to default configuration
     */
    reset() {
      set(defaultConfig);
      saveConfig(defaultConfig);
    },

    /**
     * Get current config synchronously
     */
    get(): ApiConfig {
      return get({ subscribe });
    }
  };
}

// Export the singleton store
export const apiConfig = createConfigStore();

// Derived store for capabilities
export const capabilities = derived(
  apiConfig,
  ($config): Capabilities => detectCapabilities($config)
);

// Derived store checking if any premium features are enabled
export const hasPremiumFeatures = derived(
  apiConfig,
  ($config): boolean => {
    const { tiles, geocoding, places, routing } = $config;
    return (
      Object.keys(tiles.keys).length > 0 ||
      Object.keys(geocoding.keys).length > 0 ||
      Object.keys(places.keys).length > 0 ||
      Object.keys(routing.keys).length > 0
    );
  }
);
