// ============================================
// MYMAPS PRO - URL STATE SYNC
// ============================================

import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import type { MapState, LngLat } from '$lib/services/api/types';

/**
 * Encode map state to URL hash
 */
export function encodeMapState(state: MapState): string {
  const { center, zoom, bearing, pitch } = state;
  const [lng, lat] = center;

  // Format: #map=zoom/lat/lng/bearing/pitch
  let hash = `#map=${zoom.toFixed(2)}/${lat.toFixed(6)}/${lng.toFixed(6)}`;

  if (bearing !== 0 || pitch !== 0) {
    hash += `/${bearing.toFixed(1)}/${pitch.toFixed(1)}`;
  }

  return hash;
}

/**
 * Decode map state from URL hash
 */
export function decodeMapState(hash: string): Partial<MapState> | null {
  if (!hash.startsWith('#map=')) return null;

  const parts = hash.slice(5).split('/');
  if (parts.length < 3) return null;

  const zoom = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  const lng = parseFloat(parts[2]);
  const bearing = parts[3] ? parseFloat(parts[3]) : 0;
  const pitch = parts[4] ? parseFloat(parts[4]) : 0;

  if (isNaN(zoom) || isNaN(lat) || isNaN(lng)) return null;

  return {
    center: [lng, lat],
    zoom,
    bearing,
    pitch
  };
}

/**
 * Encode place ID to URL
 */
export function encodePlaceUrl(placeId: string): string {
  return `/place/${encodeURIComponent(placeId)}`;
}

/**
 * Encode directions to URL
 */
export function encodeDirectionsUrl(
  origin: LngLat,
  destination: LngLat
): string {
  const originStr = `${origin[1]},${origin[0]}`;
  const destStr = `${destination[1]},${destination[0]}`;
  return `?dir=${originStr}/${destStr}`;
}

/**
 * Decode directions from URL
 */
export function decodeDirectionsUrl(
  search: string
): { origin: LngLat; destination: LngLat } | null {
  const params = new URLSearchParams(search);
  const dir = params.get('dir');

  if (!dir) return null;

  const parts = dir.split('/');
  if (parts.length !== 2) return null;

  const [originStr, destStr] = parts;
  const [originLat, originLng] = originStr.split(',').map(parseFloat);
  const [destLat, destLng] = destStr.split(',').map(parseFloat);

  if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
    return null;
  }

  return {
    origin: [originLng, originLat],
    destination: [destLng, destLat]
  };
}

/**
 * Update URL without navigation
 */
export function updateUrl(hash: string): void {
  if (!browser) return;

  // Use replaceState to avoid adding to history
  const url = new URL(window.location.href);
  url.hash = hash;

  window.history.replaceState({}, '', url.toString());
}

/**
 * Navigate to place
 */
export function navigateToPlace(placeId: string): void {
  if (!browser) return;
  goto(encodePlaceUrl(placeId));
}

/**
 * Get current hash
 */
export function getCurrentHash(): string {
  if (!browser) return '';
  return window.location.hash;
}
