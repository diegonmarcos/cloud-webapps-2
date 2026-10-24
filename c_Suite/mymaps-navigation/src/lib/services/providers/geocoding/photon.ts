// ============================================
// MYMAPS PRO - PHOTON GEOCODING PROVIDER
// ============================================
// Free geocoding service by Komoot (based on OSM data)
// Faster autocomplete than Nominatim

import type { SearchResult, SearchOptions, LngLat } from '$lib/services/api/types';

const BASE_URL = 'https://photon.komoot.io';

interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key: string;
    osm_value: string;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    type?: string;
    extent?: [number, number, number, number]; // [west, south, east, north]
  };
}

interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

/**
 * Search for places using Photon
 */
export async function searchPhoton(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(options?.limit || 10),
    lang: options?.language || 'en'
  });

  // Add location bias if proximity provided
  if (options?.proximity) {
    const [lng, lat] = options.proximity;
    params.append('lat', String(lat));
    params.append('lon', String(lng));
  }

  // Add bounding box filter
  if (options?.bbox) {
    const { west, south, east, north } = options.bbox;
    params.append('bbox', `${west},${south},${east},${north}`);
  }

  const response = await fetch(`${BASE_URL}/api?${params}`);

  if (!response.ok) {
    throw new Error(`Photon search failed: ${response.statusText}`);
  }

  const data: PhotonResponse = await response.json();

  return data.features.map(feature => parsePhotonFeature(feature, options?.proximity));
}

/**
 * Parse Photon feature into standard SearchResult
 */
function parsePhotonFeature(
  feature: PhotonFeature,
  proximity?: LngLat
): SearchResult {
  const { properties, geometry } = feature;
  const coordinates: LngLat = geometry.coordinates;

  // Build name
  const name = properties.name ||
    (properties.street && properties.housenumber
      ? `${properties.housenumber} ${properties.street}`
      : properties.street) ||
    properties.city ||
    'Unknown';

  // Build address
  const addressParts: string[] = [];

  if (properties.housenumber && properties.street) {
    addressParts.push(`${properties.housenumber} ${properties.street}`);
  } else if (properties.street) {
    addressParts.push(properties.street);
  }

  if (properties.city) addressParts.push(properties.city);
  if (properties.state) addressParts.push(properties.state);
  if (properties.country) addressParts.push(properties.country);

  const address = addressParts.join(', ') || properties.country || 'Unknown';

  // Calculate distance if proximity provided
  let distance: number | undefined;
  if (proximity) {
    distance = calculateDistance(proximity, coordinates);
  }

  // Parse bounding box if available
  let bbox: { north: number; south: number; east: number; west: number } | undefined;
  if (properties.extent) {
    const [west, south, east, north] = properties.extent;
    bbox = { north, south, east, west };
  }

  return {
    id: `photon-${properties.osm_type}-${properties.osm_id}`,
    name,
    address,
    coordinates,
    source: 'photon',
    type: properties.osm_value,
    category: properties.osm_key,
    distance,
    bbox
  };
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
