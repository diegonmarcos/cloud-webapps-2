// ============================================
// MYMAPS PRO - LAYER STORE
// ============================================

import { writable, derived } from 'svelte/store';
import type { CustomLayer } from '$lib/services/api/types';
import { browser } from '$app/environment';

const STORAGE_KEY = 'mymaps-custom-layers';

/**
 * Load layers from localStorage (metadata only, not data)
 */
function loadLayerMetadata(): Omit<CustomLayer, 'data'>[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }

  return [];
}

/**
 * Save layer metadata to localStorage
 */
function saveLayerMetadata(layers: CustomLayer[]): void {
  if (!browser) return;

  try {
    // Only save metadata, not the actual data
    const metadata = layers.map(({ id, name, type, visible, style }) => ({
      id, name, type, visible, style
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
  } catch {
    // Ignore errors
  }
}

/**
 * Generate unique layer ID
 */
function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create the layers store
 */
function createLayerStore() {
  // Initialize with metadata only
  const initialLayers: CustomLayer[] = loadLayerMetadata().map(meta => ({
    ...meta,
    data: null
  }));

  const { subscribe, set, update } = writable<CustomLayer[]>(initialLayers);

  return {
    subscribe,

    /**
     * Add a new custom layer
     */
    add(layer: Omit<CustomLayer, 'id'>): string {
      const id = generateLayerId();
      const newLayer: CustomLayer = { id, ...layer };

      update(layers => {
        const updated = [...layers, newLayer];
        saveLayerMetadata(updated);
        return updated;
      });

      return id;
    },

    /**
     * Update a layer
     */
    update(id: string, updates: Partial<CustomLayer>) {
      update(layers => {
        const updated = layers.map(layer =>
          layer.id === id ? { ...layer, ...updates } : layer
        );
        saveLayerMetadata(updated);
        return updated;
      });
    },

    /**
     * Toggle layer visibility
     */
    toggleVisibility(id: string) {
      update(layers => {
        const updated = layers.map(layer =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer
        );
        saveLayerMetadata(updated);
        return updated;
      });
    },

    /**
     * Remove a layer
     */
    remove(id: string) {
      update(layers => {
        const updated = layers.filter(layer => layer.id !== id);
        saveLayerMetadata(updated);
        return updated;
      });
    },

    /**
     * Get a layer by ID
     */
    get(id: string): CustomLayer | undefined {
      let layer: CustomLayer | undefined;
      subscribe(layers => {
        layer = layers.find(l => l.id === id);
      })();
      return layer;
    },

    /**
     * Clear all layers
     */
    clear() {
      set([]);
      saveLayerMetadata([]);
    }
  };
}

export const layerStore = createLayerStore();

// Derived store for visible layers
export const visibleLayers = derived(
  layerStore,
  ($layers) => $layers.filter(layer => layer.visible)
);

// Layers panel visibility
export const showLayersPanel = writable<boolean>(false);

/**
 * Toggle layers panel
 */
export function toggleLayersPanel() {
  showLayersPanel.update(v => !v);
}
