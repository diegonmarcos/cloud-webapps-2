// ============================================
// MYMAPS PRO - OSRM ROUTING PROVIDER
// ============================================
// Free Open Source Routing Machine
// Public demo server (fair use policy)

import type { Route, RouteStep, RoutingMode, LngLat } from '$lib/services/api/types';

const BASE_URL = 'https://router.project-osrm.org';

interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: OSRMWaypoint[];
}

interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: string; // polyline encoded
  legs: OSRMLeg[];
}

interface OSRMLeg {
  distance: number;
  duration: number;
  steps: OSRMStep[];
  summary: string;
}

interface OSRMStep {
  distance: number;
  duration: number;
  geometry: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
  name: string;
  mode: string;
}

interface OSRMWaypoint {
  name: string;
  location: [number, number];
}

// Map our routing modes to OSRM profiles
const PROFILE_MAP: Record<RoutingMode, string> = {
  driving: 'car',
  walking: 'foot',
  cycling: 'bike',
  transit: 'car' // OSRM doesn't support transit
};

/**
 * Get directions using OSRM
 */
export async function getOSRMDirections(
  origin: LngLat,
  destination: LngLat,
  mode: RoutingMode,
  alternatives = true
): Promise<Route[]> {
  // OSRM doesn't support transit
  if (mode === 'transit') {
    throw new Error('OSRM does not support transit routing');
  }

  const profile = PROFILE_MAP[mode];
  const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;

  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'true',
    alternatives: String(alternatives)
  });

  const response = await fetch(
    `${BASE_URL}/route/v1/${profile}/${coordinates}?${params}`
  );

  if (!response.ok) {
    throw new Error(`OSRM routing failed: ${response.statusText}`);
  }

  const data: OSRMResponse = await response.json();

  if (data.code !== 'Ok') {
    throw new Error(`OSRM error: ${data.code}`);
  }

  return data.routes.map(route => parseOSRMRoute(route));
}

/**
 * Parse OSRM route into standard Route format
 */
function parseOSRMRoute(route: OSRMRoute): Route {
  // Collect all steps from all legs
  const steps: RouteStep[] = [];
  let summary = '';

  for (const leg of route.legs) {
    if (leg.summary) {
      summary = summary ? `${summary}, ${leg.summary}` : leg.summary;
    }

    for (const step of leg.steps) {
      steps.push({
        instruction: formatInstruction(step),
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver.type,
        coordinates: step.maneuver.location as LngLat
      });
    }
  }

  // Parse geometry (OSRM returns GeoJSON when geometries=geojson)
  const geometry = parseGeometry(route.geometry);

  return {
    distance: route.distance,
    duration: route.duration,
    geometry,
    steps,
    source: 'osrm',
    summary
  };
}

/**
 * Parse GeoJSON geometry or decode polyline
 */
function parseGeometry(geometry: string | { type: string; coordinates: number[][] }): LngLat[] {
  // If it's already GeoJSON
  if (typeof geometry === 'object' && geometry.coordinates) {
    return geometry.coordinates.map(coord => [coord[0], coord[1]] as LngLat);
  }

  // Decode polyline (shouldn't happen with geometries=geojson but fallback)
  return decodePolyline(geometry as string);
}

/**
 * Decode Google polyline format
 */
function decodePolyline(encoded: string): LngLat[] {
  const coordinates: LngLat[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

/**
 * Format instruction from OSRM step
 */
function formatInstruction(step: OSRMStep): string {
  const { maneuver, name } = step;
  const type = maneuver.type;
  const modifier = maneuver.modifier;

  // Build instruction based on maneuver type
  let instruction = '';

  switch (type) {
    case 'depart':
      instruction = name ? `Start on ${name}` : 'Start';
      break;
    case 'arrive':
      instruction = 'Arrive at destination';
      break;
    case 'turn':
      instruction = modifier
        ? `Turn ${modifier}${name ? ` onto ${name}` : ''}`
        : `Turn${name ? ` onto ${name}` : ''}`;
      break;
    case 'continue':
      instruction = name ? `Continue on ${name}` : 'Continue straight';
      break;
    case 'merge':
      instruction = name ? `Merge onto ${name}` : 'Merge';
      break;
    case 'on ramp':
    case 'off ramp':
      instruction = name ? `Take ramp onto ${name}` : 'Take ramp';
      break;
    case 'fork':
      instruction = modifier
        ? `Keep ${modifier}${name ? ` onto ${name}` : ''}`
        : `Fork${name ? ` onto ${name}` : ''}`;
      break;
    case 'end of road':
      instruction = modifier
        ? `Turn ${modifier}${name ? ` onto ${name}` : ''}`
        : `End of road${name ? `, continue on ${name}` : ''}`;
      break;
    case 'roundabout':
    case 'rotary':
      instruction = name
        ? `Take the roundabout, exit onto ${name}`
        : 'Take the roundabout';
      break;
    case 'new name':
      instruction = name ? `Continue onto ${name}` : 'Continue';
      break;
    default:
      instruction = name ? `Continue on ${name}` : 'Continue';
  }

  return instruction;
}
