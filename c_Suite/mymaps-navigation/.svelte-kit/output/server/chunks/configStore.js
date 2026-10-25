import { d as derived, w as writable, g as get } from "./url.js";
function detectCapabilities(config) {
  const hasGooglePlaces = !!config.places.keys.google;
  const hasFoursquare = !!config.places.keys.foursquare;
  !!config.places.keys.yelp;
  const hasGoogleRouting = !!config.routing.keys.google;
  const hasMapbox = !!config.tiles.keys.mapbox;
  const hasMapTiler = !!config.tiles.keys.maptiler;
  return {
    search: {
      // Nominatim supports basic autocomplete
      autocomplete: true,
      // Categories require Foursquare or Google
      categories: hasFoursquare || hasGooglePlaces,
      // Photos require Foursquare or Google
      photos: hasFoursquare || hasGooglePlaces
    },
    places: {
      // Basic details always available via OSM
      details: true,
      // Photos require premium providers
      photos: hasFoursquare || hasGooglePlaces,
      // Reviews only from Google
      reviews: hasGooglePlaces,
      // Business hours from Foursquare or Google
      hours: hasFoursquare || hasGooglePlaces
    },
    routing: {
      // OSRM supports these modes
      walking: true,
      cycling: true,
      driving: true,
      // Transit only via Google
      transit: hasGoogleRouting,
      // Alternatives available in OSRM
      alternatives: true
    },
    tiles: {
      // Vector tiles always available via CARTO
      vector: true,
      // Satellite requires Mapbox or MapTiler
      satellite: hasMapbox || hasMapTiler,
      // Terrain requires Mapbox
      terrain: hasMapbox,
      // Traffic requires Google
      traffic: hasGooglePlaces
    }
  };
}
const defaultConfig = {
  tiles: {
    primary: "carto",
    keys: {}
  },
  geocoding: {
    providers: ["nominatim", "photon"],
    keys: {}
  },
  places: {
    providers: ["overpass"],
    keys: {}
  },
  routing: {
    providers: ["osrm", "valhalla"],
    keys: {}
  }
};
function loadConfig() {
  return defaultConfig;
}
function createConfigStore() {
  const { subscribe, set, update } = writable(loadConfig());
  return {
    subscribe,
    /**
     * Update a specific API key
     */
    setApiKey(category, provider, key) {
      update((config) => {
        const newConfig = { ...config };
        const categoryConfig = newConfig[category];
        const keys = { ...categoryConfig.keys };
        if (key) {
          keys[provider] = key;
        } else {
          delete keys[provider];
        }
        if (category === "tiles") {
          newConfig.tiles = {
            ...newConfig.tiles,
            keys
          };
        } else if (category === "geocoding") {
          const providers = [...newConfig.geocoding.providers];
          if (key && !providers.includes(provider)) {
            providers.unshift(provider);
          }
          newConfig.geocoding = {
            ...newConfig.geocoding,
            keys,
            providers
          };
        } else if (category === "places") {
          const providers = [...newConfig.places.providers];
          if (key && !providers.includes(provider)) {
            providers.unshift(provider);
          }
          newConfig.places = {
            ...newConfig.places,
            keys,
            providers
          };
        } else if (category === "routing") {
          const providers = [...newConfig.routing.providers];
          if (key && !providers.includes(provider)) {
            providers.unshift(provider);
          }
          newConfig.routing = {
            ...newConfig.routing,
            keys,
            providers
          };
        }
        return newConfig;
      });
    },
    /**
     * Set the primary tile provider
     */
    setTileProvider(provider) {
      update((config) => {
        const newConfig = {
          ...config,
          tiles: {
            ...config.tiles,
            primary: provider
          }
        };
        return newConfig;
      });
    },
    /**
     * Reset to default configuration
     */
    reset() {
      set(defaultConfig);
    },
    /**
     * Get current config synchronously
     */
    get() {
      return get({ subscribe });
    }
  };
}
const apiConfig = createConfigStore();
const capabilities = derived(
  apiConfig,
  ($config) => detectCapabilities($config)
);
const hasPremiumFeatures = derived(
  apiConfig,
  ($config) => {
    const { tiles, geocoding, places, routing } = $config;
    return Object.keys(tiles.keys).length > 0 || Object.keys(geocoding.keys).length > 0 || Object.keys(places.keys).length > 0 || Object.keys(routing.keys).length > 0;
  }
);
export {
  apiConfig as a,
  capabilities as c,
  hasPremiumFeatures as h
};
