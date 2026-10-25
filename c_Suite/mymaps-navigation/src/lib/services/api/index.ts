// ============================================
// MYMAPS PRO - API ORCHESTRATOR
// ============================================

import { get } from 'svelte/store';
import { apiConfig } from '$lib/stores/configStore';
import type {
  SearchResult,
  SearchOptions,
  PlaceDetails,
  Route,
  RoutingMode,
  LngLat
} from './types';

// Import providers
import { searchNominatim, reverseNominatim } from '$lib/services/providers/geocoding/nominatim';
import { searchPhoton } from '$lib/services/providers/geocoding/photon';
import { getOSRMDirections } from '$lib/services/providers/routing/osrm';
import { getOverpassDetails } from '$lib/services/providers/places/overpass';

/**
 * Search for places using all configured providers
 */
export async function search(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const config = get(apiConfig);
  const providers = config.geocoding.providers;

  // Query all configured providers in parallel
  const promises = providers.map(async provider => {
    try {
      switch (provider) {
        case 'nominatim':
          return await searchNominatim(query, options);
        case 'photon':
          return await searchPhoton(query, options);
        case 'google':
          if (config.geocoding.keys.google) {
            // TODO: Implement Google geocoding
            console.warn('Google geocoding not yet implemented');
          }
          return [];
        case 'mapbox':
          if (config.geocoding.keys.mapbox) {
            // TODO: Implement Mapbox geocoding
            console.warn('Mapbox geocoding not yet implemented');
          }
          return [];
        default:
          return [];
      }
    } catch (error) {
      console.warn(`${provider} search failed:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);

  // Flatten and merge results
  const allResults = results.flat();

  // Dedupe by coordinates (within ~100m)
  const deduped = deduplicateResults(allResults);

  // Sort by relevance (distance if available, otherwise by source priority)
  return sortResults(deduped, options?.proximity);
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  coordinates: LngLat
): Promise<SearchResult | null> {
  try {
    return await reverseNominatim(coordinates);
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return null;
  }
}

/**
 * Get detailed place information
 */
export async function getPlaceDetails(
  placeId: string,
  source: string
): Promise<PlaceDetails | null> {
  const config = get(apiConfig);

  try {
    switch (source) {
      case 'nominatim':
      case 'photon':
      case 'osm':
      case 'overpass':
        return await getOverpassDetails(placeId);

      case 'foursquare':
        if (config.places.keys.foursquare) {
          // TODO: Implement Foursquare details
          console.warn('Foursquare details not yet implemented');
        }
        return null;

      case 'google':
        if (config.places.keys.google) {
          // TODO: Implement Google details
          console.warn('Google details not yet implemented');
        }
        return null;

      default:
        return await getOverpassDetails(placeId);
    }
  } catch (error) {
    console.warn(`Failed to get place details from ${source}:`, error);
    return null;
  }
}

/**
 * Get directions between two points
 */
export async function getDirections(
  origin: LngLat,
  destination: LngLat,
  mode: RoutingMode = 'driving',
  alternatives = true
): Promise<Route[]> {
  const config = get(apiConfig);

  // Transit requires Google
  if (mode === 'transit') {
    if (!config.routing.keys.google) {
      throw new Error('Transit routing requires Google Maps API key');
    }
    // TODO: Implement Google Directions
    throw new Error('Google transit routing not yet implemented');
  }

  // Try providers in order of preference
  const providers = config.routing.providers;

  for (const provider of providers) {
    try {
      switch (provider) {
        case 'osrm':
          return await getOSRMDirections(origin, destination, mode, alternatives);

        case 'valhalla':
          // TODO: Implement Valhalla routing
          console.warn('Valhalla routing not yet implemented, falling back...');
          continue;

        case 'google':
          if (config.routing.keys.google) {
            // TODO: Implement Google Directions
            console.warn('Google routing not yet implemented, falling back...');
          }
          continue;

        case 'mapbox':
          if (config.routing.keys.mapbox) {
            // TODO: Implement Mapbox Directions
            console.warn('Mapbox routing not yet implemented, falling back...');
          }
          continue;
      }
    } catch (error) {
      console.warn(`${provider} routing failed:`, error);
      continue;
    }
  }

  throw new Error('All routing providers failed');
}

/**
 * Deduplicate results by proximity
 */
function deduplicateResults(
  results: SearchResult[],
  thresholdMeters = 100
): SearchResult[] {
  const deduped: SearchResult[] = [];

  for (const result of results) {
    const isDupe = deduped.some(existing => {
      const distance = calculateDistance(existing.coordinates, result.coordinates);
      return distance < thresholdMeters;
    });

    if (!isDupe) {
      deduped.push(result);
    }
  }

  return deduped;
}

/**
 * Sort results by relevance
 */
function sortResults(
  results: SearchResult[],
  proximity?: LngLat
): SearchResult[] {
  return results.sort((a, b) => {
    // If we have proximity, sort by distance
    if (proximity) {
      const distA = a.distance ?? calculateDistance(proximity, a.coordinates);
      const distB = b.distance ?? calculateDistance(proximity, b.coordinates);
      return distA - distB;
    }

    // Otherwise, prefer premium sources
    const sourcePriority: Record<string, number> = {
      google: 1,
      foursquare: 2,
      mapbox: 3,
      photon: 4,
      nominatim: 5
    };

    const priorityA = sourcePriority[a.source] ?? 10;
    const priorityB = sourcePriority[b.source] ?? 10;

    return priorityA - priorityB;
  });
}

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistance(from: LngLat, to: LngLat): number {
  const R = 6371000; // Earth's radius in meters
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
