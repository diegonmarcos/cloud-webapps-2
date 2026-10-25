// ============================================
// MYMAPS PRO - CAPABILITY DETECTION
// ============================================

import type { ApiConfig, Capabilities } from './types';

/**
 * Detect available features based on configured API keys
 */
export function detectCapabilities(config: ApiConfig): Capabilities {
  const hasGooglePlaces = !!config.places.keys.google;
  const hasFoursquare = !!config.places.keys.foursquare;
  const hasYelp = !!config.places.keys.yelp;
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

/**
 * Get a user-friendly description of missing features
 */
export function getMissingFeatureHint(
  capability: keyof Capabilities,
  feature: string
): string {
  const hints: Record<string, Record<string, string>> = {
    search: {
      categories: 'Add a Foursquare or Google API key to enable category filtering',
      photos: 'Add a Foursquare or Google API key to see place photos'
    },
    places: {
      photos: 'Add a Foursquare or Google API key to view photos',
      reviews: 'Add a Google Places API key to see reviews',
      hours: 'Add a Foursquare or Google API key to see business hours'
    },
    routing: {
      transit: 'Add a Google Maps API key to enable transit directions'
    },
    tiles: {
      satellite: 'Add a Mapbox or MapTiler API key for satellite imagery',
      terrain: 'Add a Mapbox API key for terrain view',
      traffic: 'Add a Google Maps API key for traffic layer'
    }
  };

  return hints[capability]?.[feature] || 'This feature requires an API key';
}

/**
 * Check if a specific provider is available
 */
export function isProviderAvailable(
  config: ApiConfig,
  category: 'geocoding' | 'places' | 'routing',
  provider: string
): boolean {
  const cfg = config[category];

  // Free providers are always available
  const freeProviders: Record<string, string[]> = {
    geocoding: ['nominatim', 'photon'],
    places: ['overpass'],
    routing: ['osrm', 'valhalla']
  };

  if (freeProviders[category]?.includes(provider)) {
    return true;
  }

  // Check for API key
  const keys = cfg.keys as Record<string, string | undefined>;
  return !!keys[provider];
}

/**
 * Get the best available provider for a category
 */
export function getBestProvider(
  config: ApiConfig,
  category: 'geocoding' | 'places' | 'routing'
): string {
  const cfg = config[category];

  // Prefer premium providers if available
  for (const provider of cfg.providers) {
    if (isProviderAvailable(config, category, provider)) {
      return provider;
    }
  }

  // Fallback to first free provider
  const fallbacks: Record<string, string> = {
    geocoding: 'nominatim',
    places: 'overpass',
    routing: 'osrm'
  };

  return fallbacks[category];
}
