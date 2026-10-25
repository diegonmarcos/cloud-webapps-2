// ============================================
// MYMAPS PRO - MAP STORE
// ============================================

import { writable, derived } from 'svelte/store';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapState, MapStyle, LngLat } from '$lib/services/api/types';
import { browser } from '$app/environment';

const STORAGE_KEY = 'mymaps-map-state';
const GLOBE_STORAGE_KEY = 'mymaps-globe-view';
const TERRAIN_STORAGE_KEY = 'mymaps-terrain-3d';
const TERRAIN_LAYER_STORAGE_KEY = 'mymaps-terrain-layer';
const SATELLITE_LAYER_STORAGE_KEY = 'mymaps-satellite-layer';

// Default map state (world view)
const defaultState: MapState = {
  center: [0, 20], // Centered for globe view
  zoom: 2.5, // Will be recalculated on load based on viewport
  bearing: 0,
  pitch: 0
};

// Available map styles (ordered from dark to light)
export const mapStyles: MapStyle[] = [
  {
    id: 'carto-dark',
    name: 'Dark',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    preview: 'https://basemaps.cartocdn.com/dark_all/5/15/12.png'
  },
  {
    id: 'osm-positron',
    name: 'Positron',
    url: 'https://tiles.openfreemap.org/styles/positron',
    preview: 'https://basemaps.cartocdn.com/light_all/5/15/12.png'
  },
  {
    id: 'carto-light',
    name: 'Light',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    preview: 'https://basemaps.cartocdn.com/light_all/5/15/12.png'
  },
  {
    id: 'carto-voyager',
    name: 'Voyager',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    preview: 'https://basemaps.cartocdn.com/rastertiles/voyager/5/15/12.png'
  },
  {
    id: 'osm-liberty',
    name: 'Liberty',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    preview: 'https://tile.openstreetmap.org/5/15/12.png'
  },
  {
    id: 'osm-bright',
    name: 'Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
    preview: 'https://tile.openstreetmap.org/5/15/12.png'
  }
];

/**
 * Load map state from localStorage
 */
function loadState(): MapState {
  if (!browser) return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore errors
  }

  return defaultState;
}

/**
 * Save map state to localStorage
 */
function saveState(state: MapState): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

/**
 * Create the map state store
 */
function createMapStore() {
  const { subscribe, set, update } = writable<MapState>(loadState());

  return {
    subscribe,

    /**
     * Update map state from MapLibre instance
     */
    syncFromMap(map: MapLibreMap) {
      const center = map.getCenter();
      const state: MapState = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };
      set(state);
      saveState(state);
    },

    /**
     * Set center coordinates
     */
    setCenter(center: LngLat) {
      update(state => {
        const newState = { ...state, center };
        saveState(newState);
        return newState;
      });
    },

    /**
     * Set zoom level
     */
    setZoom(zoom: number) {
      update(state => {
        const newState = { ...state, zoom };
        saveState(newState);
        return newState;
      });
    },

    /**
     * Reset bearing to north
     */
    resetBearing() {
      update(state => {
        const newState = { ...state, bearing: 0 };
        saveState(newState);
        return newState;
      });
    },

    /**
     * Reset to default state
     */
    reset() {
      set(defaultState);
      saveState(defaultState);
    }
  };
}

// Map instance reference (not reactive, just a reference)
let mapInstance: MapLibreMap | null = null;

export const mapStore = createMapStore();

// Current style store
export const currentStyleId = writable<string>('osm-bright');

// Derived store for current style object
export const currentStyle = derived(
  currentStyleId,
  ($id) => mapStyles.find(s => s.id === $id) || mapStyles[0]
);

// User location store
export const userLocation = writable<LngLat | null>(null);
export const isLocating = writable<boolean>(false);

// Globe view persistence helpers (defaults to true)
function loadGlobeState(): boolean {
  if (!browser) return true;
  try {
    const stored = localStorage.getItem(GLOBE_STORAGE_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function saveGlobeState(enabled: boolean): void {
  if (!browser) return;
  try {
    localStorage.setItem(GLOBE_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore errors
  }
}

// 3D Terrain persistence helpers (defaults to false)
function loadTerrainState(): boolean {
  if (!browser) return false;
  try {
    return localStorage.getItem(TERRAIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveTerrainState(enabled: boolean): void {
  if (!browser) return;
  try {
    localStorage.setItem(TERRAIN_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore errors
  }
}

// Terrain Layer (hillshade) persistence helpers (defaults to true)
function loadTerrainLayerState(): boolean {
  if (!browser) return true;
  try {
    const stored = localStorage.getItem(TERRAIN_LAYER_STORAGE_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function saveTerrainLayerState(enabled: boolean): void {
  if (!browser) return;
  try {
    localStorage.setItem(TERRAIN_LAYER_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore errors
  }
}

// Satellite Layer persistence helpers (defaults to true)
function loadSatelliteLayerState(): boolean {
  if (!browser) return true;
  try {
    const stored = localStorage.getItem(SATELLITE_LAYER_STORAGE_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function saveSatelliteLayerState(enabled: boolean): void {
  if (!browser) return;
  try {
    localStorage.setItem(SATELLITE_LAYER_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore errors
  }
}

// Globe view store (persisted)
export const isGlobeView = writable<boolean>(loadGlobeState());

// 3D Terrain store (persisted)
export const is3DTerrain = writable<boolean>(loadTerrainState());

// Terrain layer (hillshade) store (persisted)
export const isTerrainLayer = writable<boolean>(loadTerrainLayerState());

// Satellite layer store (persisted)
export const isSatelliteLayer = writable<boolean>(loadSatelliteLayerState());

/**
 * Toggle between globe and mercator projection
 */
export function toggleGlobeView() {
  console.log('[GLOBE DEBUG] toggleGlobeView called');
  isGlobeView.update(v => {
    const newValue = !v;
    console.log('[GLOBE DEBUG] Toggling from', v, 'to', newValue);
    saveGlobeState(newValue);
    // Note: actual projection change happens via $effect in MapCanvas
    return newValue;
  });
}

/**
 * Set globe view state
 */
export function setGlobeView(enabled: boolean) {
  console.log('[GLOBE DEBUG] setGlobeView called with:', enabled);
  isGlobeView.set(enabled);
  saveGlobeState(enabled);
  // Note: actual projection change happens via $effect in MapCanvas
}

/**
 * Toggle 3D terrain
 */
export function toggle3DTerrain() {
  is3DTerrain.update(v => {
    const newValue = !v;
    console.log('[TERRAIN] Toggling 3D terrain to:', newValue);
    saveTerrainState(newValue);
    return newValue;
  });
}

/**
 * Set 3D terrain state
 */
export function set3DTerrain(enabled: boolean) {
  console.log('[TERRAIN] Setting 3D terrain to:', enabled);
  is3DTerrain.set(enabled);
  saveTerrainState(enabled);
}

/**
 * Toggle terrain layer (hillshade)
 */
export function toggleTerrainLayer() {
  console.log('[TERRAIN DEBUG] toggleTerrainLayer() called');
  isTerrainLayer.update(v => {
    const newValue = !v;
    console.log('[TERRAIN DEBUG] Toggling terrain layer from', v, 'to', newValue);
    saveTerrainLayerState(newValue);
    return newValue;
  });
}

/**
 * Set terrain layer state
 */
export function setTerrainLayer(enabled: boolean) {
  console.log('[TERRAIN] Setting terrain layer to:', enabled);
  isTerrainLayer.set(enabled);
  saveTerrainLayerState(enabled);
}

/**
 * Toggle satellite layer
 */
export function toggleSatelliteLayer() {
  console.log('[SATELLITE DEBUG] toggleSatelliteLayer() called');
  isSatelliteLayer.update(v => {
    const newValue = !v;
    console.log('[SATELLITE DEBUG] Toggling satellite layer from', v, 'to', newValue);
    saveSatelliteLayerState(newValue);
    return newValue;
  });
}

/**
 * Set satellite layer state
 */
export function setSatelliteLayer(enabled: boolean) {
  console.log('[SATELLITE] Setting satellite layer to:', enabled);
  isSatelliteLayer.set(enabled);
  saveSatelliteLayerState(enabled);
}

/**
 * Set the map instance reference
 */
export function setMapInstance(map: MapLibreMap | null) {
  mapInstance = map;
}

/**
 * Get the current map instance
 */
export function getMapInstance(): MapLibreMap | null {
  return mapInstance;
}

/**
 * Fly to a location on the map
 */
export function flyTo(center: LngLat, zoom?: number) {
  if (mapInstance) {
    mapInstance.flyTo({
      center,
      zoom: zoom ?? mapInstance.getZoom(),
      duration: 1500
    });
  }
}

/**
 * Fit map to bounds
 */
export function fitBounds(
  bounds: [[number, number], [number, number]],
  padding = 50
) {
  if (mapInstance) {
    mapInstance.fitBounds(bounds, {
      padding,
      duration: 1500
    });
  }
}
