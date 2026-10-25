// ============================================
// MYMAPS PRO - ROUTE STORE
// ============================================

import { writable, derived } from 'svelte/store';
import type { Route, RoutingMode, LngLat } from '$lib/services/api/types';

// Route endpoints
export const routeOrigin = writable<{ name: string; coordinates: LngLat } | null>(null);
export const routeDestination = writable<{ name: string; coordinates: LngLat } | null>(null);

// Route settings
export const routeMode = writable<RoutingMode>('driving');

// Route state
export const routes = writable<Route[]>([]);
export const selectedRouteIndex = writable<number>(0);
export const isCalculatingRoute = writable<boolean>(false);
export const routeError = writable<string | null>(null);

// Directions panel visibility
export const showDirectionsPanel = writable<boolean>(false);

// Derived store for selected route
export const selectedRoute = derived(
  [routes, selectedRouteIndex],
  ([$routes, $index]) => $routes[$index] || null
);

// Derived store to check if we have both endpoints
export const canCalculateRoute = derived(
  [routeOrigin, routeDestination],
  ([$origin, $destination]) => $origin !== null && $destination !== null
);

/**
 * Set route origin
 */
export function setOrigin(name: string, coordinates: LngLat) {
  routeOrigin.set({ name, coordinates });
}

/**
 * Set route destination
 */
export function setDestination(name: string, coordinates: LngLat) {
  routeDestination.set({ name, coordinates });
}

/**
 * Swap origin and destination
 */
export function swapEndpoints() {
  let origin: { name: string; coordinates: LngLat } | null = null;
  let destination: { name: string; coordinates: LngLat } | null = null;

  routeOrigin.subscribe(v => origin = v)();
  routeDestination.subscribe(v => destination = v)();

  routeOrigin.set(destination);
  routeDestination.set(origin);
}

/**
 * Clear route state
 */
export function clearRoute() {
  routeOrigin.set(null);
  routeDestination.set(null);
  routes.set([]);
  selectedRouteIndex.set(0);
  routeError.set(null);
  showDirectionsPanel.set(false);
}

/**
 * Open directions panel
 */
export function openDirections(destination?: { name: string; coordinates: LngLat }) {
  if (destination) {
    routeDestination.set(destination);
  }
  showDirectionsPanel.set(true);
}

/**
 * Close directions panel
 */
export function closeDirections() {
  showDirectionsPanel.set(false);
}

/**
 * Format duration in human readable form
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

/**
 * Format distance in human readable form
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
