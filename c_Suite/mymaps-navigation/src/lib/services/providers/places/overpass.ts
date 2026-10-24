// ============================================
// MYMAPS PRO - OVERPASS PLACES PROVIDER
// ============================================
// Free OpenStreetMap data query service

import type { PlaceDetails, LngLat, BoundingBox } from '$lib/services/api/types';

const BASE_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassResponse {
  elements: OverpassElement[];
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Common OSM amenity categories
export const OSM_CATEGORIES: Record<string, string[]> = {
  food: ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court'],
  shopping: ['supermarket', 'convenience', 'mall', 'clothes', 'electronics'],
  lodging: ['hotel', 'hostel', 'guest_house', 'motel'],
  transport: ['bus_station', 'train_station', 'airport', 'parking'],
  health: ['hospital', 'pharmacy', 'doctors', 'dentist', 'clinic'],
  entertainment: ['cinema', 'theatre', 'nightclub', 'museum', 'gallery'],
  services: ['bank', 'atm', 'post_office', 'police', 'fire_station']
};

/**
 * Get place details from OSM via Overpass
 */
export async function getOverpassDetails(
  osmId: string
): Promise<PlaceDetails | null> {
  // Parse OSM ID format: "nominatim-node-12345" or "photon-way-67890"
  const match = osmId.match(/-(node|way|relation)-(\d+)$/);
  if (!match) {
    console.warn('Invalid OSM ID format:', osmId);
    return null;
  }

  const [, type, id] = match;

  const query = `
    [out:json][timeout:10];
    ${type}(${id});
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch(BASE_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error(`Overpass query failed: ${response.statusText}`);
  }

  const data: OverpassResponse = await response.json();

  if (data.elements.length === 0) {
    return null;
  }

  return parseOverpassElement(data.elements[0]);
}

/**
 * Search for POIs in a bounding box
 */
export async function searchOverpassPOIs(
  bbox: BoundingBox,
  category?: string,
  limit = 50
): Promise<PlaceDetails[]> {
  const { south, west, north, east } = bbox;

  // Build query based on category
  let amenityFilter = '';
  if (category && OSM_CATEGORIES[category]) {
    const amenities = OSM_CATEGORIES[category].map(a => `"amenity"="${a}"`).join('|');
    amenityFilter = `[${amenities}]`;
  } else if (category) {
    amenityFilter = `["amenity"="${category}"]`;
  } else {
    // Default: get all amenities
    amenityFilter = '["amenity"]';
  }

  const query = `
    [out:json][timeout:25];
    (
      node${amenityFilter}(${south},${west},${north},${east});
      way${amenityFilter}(${south},${west},${north},${east});
    );
    out center ${limit};
  `;

  const response = await fetch(BASE_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error(`Overpass query failed: ${response.statusText}`);
  }

  const data: OverpassResponse = await response.json();

  return data.elements
    .map(parseOverpassElement)
    .filter((p): p is PlaceDetails => p !== null);
}

/**
 * Search for POIs near a point
 */
export async function searchOverpassNearby(
  center: LngLat,
  radiusMeters = 500,
  category?: string,
  limit = 20
): Promise<PlaceDetails[]> {
  const [lng, lat] = center;

  let amenityFilter = '';
  if (category && OSM_CATEGORIES[category]) {
    const amenities = OSM_CATEGORIES[category].map(a => `"amenity"="${a}"`).join('|');
    amenityFilter = `[${amenities}]`;
  } else if (category) {
    amenityFilter = `["amenity"="${category}"]`;
  } else {
    amenityFilter = '["amenity"]';
  }

  const query = `
    [out:json][timeout:25];
    (
      node${amenityFilter}(around:${radiusMeters},${lat},${lng});
      way${amenityFilter}(around:${radiusMeters},${lat},${lng});
    );
    out center ${limit};
  `;

  const response = await fetch(BASE_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error(`Overpass query failed: ${response.statusText}`);
  }

  const data: OverpassResponse = await response.json();

  return data.elements
    .map(parseOverpassElement)
    .filter((p): p is PlaceDetails => p !== null);
}

/**
 * Parse Overpass element into PlaceDetails
 */
function parseOverpassElement(element: OverpassElement): PlaceDetails | null {
  const tags = element.tags || {};

  // Get coordinates
  let lat: number | undefined;
  let lng: number | undefined;

  if (element.lat !== undefined && element.lon !== undefined) {
    lat = element.lat;
    lng = element.lon;
  } else if (element.center) {
    lat = element.center.lat;
    lng = element.center.lon;
  }

  if (lat === undefined || lng === undefined) {
    return null;
  }

  // Get name
  const name = tags.name || tags['name:en'] || 'Unnamed';

  // Build address
  const addressParts: string[] = [];
  if (tags['addr:housenumber'] && tags['addr:street']) {
    addressParts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    addressParts.push(tags['addr:street']);
  }
  if (tags['addr:city']) addressParts.push(tags['addr:city']);
  if (tags['addr:country']) addressParts.push(tags['addr:country']);

  const address = addressParts.length > 0
    ? addressParts.join(', ')
    : tags.address || 'No address';

  // Get category
  const category = tags.amenity || tags.shop || tags.tourism || tags.leisure;

  // Build attributes from relevant tags
  const attributes: Record<string, string> = {};
  const relevantTags = [
    'cuisine', 'wheelchair', 'outdoor_seeding', 'smoking',
    'diet:vegan', 'diet:vegetarian', 'internet_access', 'takeaway'
  ];

  for (const tag of relevantTags) {
    if (tags[tag]) {
      attributes[tag] = tags[tag];
    }
  }

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    address,
    coordinates: [lng, lat],
    source: 'overpass',
    category,
    phone: tags.phone || tags['contact:phone'],
    website: tags.website || tags['contact:website'] || tags.url,
    attributes
  };
}
