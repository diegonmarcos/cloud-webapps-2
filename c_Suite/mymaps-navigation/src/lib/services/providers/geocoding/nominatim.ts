// ============================================
// MYMAPS PRO - NOMINATIM GEOCODING PROVIDER
// ============================================
// Free OpenStreetMap geocoding service
// Rate limit: 1 request per second

import type { SearchResult, SearchOptions, LngLat, BoundingBox } from '$lib/services/api/types';

const BASE_URL = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  boundingbox?: [string, string, string, string];
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Search for places using Nominatim
 */
export async function searchNominatim(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(options?.limit || 10),
    'accept-language': options?.language || 'en'
  });

  // Add bounding box if provided
  if (options?.bbox) {
    const { west, south, east, north } = options.bbox;
    params.append('viewbox', `${west},${south},${east},${north}`);
    params.append('bounded', '1');
  }

  // Add country filter if provided
  if (options?.countryCode) {
    params.append('countrycodes', options.countryCode);
  }

  const response = await fetch(`${BASE_URL}/search?${params}`, {
    headers: {
      'User-Agent': 'MyMapsPro/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.statusText}`);
  }

  const results: NominatimResult[] = await response.json();

  return results.map(result => parseNominatimResult(result, options?.proximity));
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseNominatim(
  coordinates: LngLat,
  language = 'en'
): Promise<SearchResult | null> {
  const [lng, lat] = coordinates;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
    'accept-language': language
  });

  const response = await fetch(`${BASE_URL}/reverse?${params}`, {
    headers: {
      'User-Agent': 'MyMapsPro/1.0'
    }
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Nominatim reverse failed: ${response.statusText}`);
  }

  const result: NominatimResult = await response.json();

  if (!result.place_id) return null;

  return parseNominatimResult(result);
}

/**
 * Parse Nominatim result into standard SearchResult
 */
function parseNominatimResult(
  result: NominatimResult,
  proximity?: LngLat
): SearchResult {
  const coordinates: LngLat = [parseFloat(result.lon), parseFloat(result.lat)];

  // Build address from parts
  let address = result.display_name;
  if (result.address) {
    const parts: string[] = [];
    const addr = result.address;

    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }

    const city = addr.city || addr.town || addr.village;
    if (city) parts.push(city);
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);

    if (parts.length > 0) {
      address = parts.join(', ');
    }
  }

  // Calculate distance if proximity provided
  let distance: number | undefined;
  if (proximity) {
    distance = calculateDistance(proximity, coordinates);
  }

  // Parse bounding box
  let bbox: BoundingBox | undefined;
  if (result.boundingbox) {
    const [south, north, west, east] = result.boundingbox.map(parseFloat);
    bbox = { north, south, east, west };
  }

  return {
    id: `nominatim-${result.osm_type}-${result.osm_id}`,
    name: extractName(result),
    address,
    coordinates,
    source: 'nominatim',
    type: result.type,
    category: result.class,
    distance,
    bbox
  };
}

/**
 * Extract a clean name from the result
 */
function extractName(result: NominatimResult): string {
  // Try to get a clean name from the display_name
  const displayParts = result.display_name.split(',');

  // For most results, the first part is the name
  if (displayParts.length > 0) {
    return displayParts[0].trim();
  }

  return result.display_name;
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
