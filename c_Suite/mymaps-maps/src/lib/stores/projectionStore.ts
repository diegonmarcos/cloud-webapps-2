import { writable, derived } from 'svelte/store';
import * as d3Geo from 'd3-geo';

// Available projection types
export type ProjectionType =
  | 'orthographic'   // Globe (3D-like)
  | 'mercator'       // Standard web mercator
  | 'equalEarth'     // Equal-area, good compromise
  | 'naturalEarth1'  // Nice for world maps
  | 'equirectangular'; // Simple plate carrée

export interface ProjectionConfig {
  id: ProjectionType;
  name: string;
  description: string;
  preserves: string;
  factory: () => d3Geo.GeoProjection;
}

// Projection configurations
export const projections: ProjectionConfig[] = [
  {
    id: 'orthographic',
    name: 'Globe',
    description: '3D spherical view',
    preserves: 'True shape (no distortion)',
    factory: () => d3Geo.geoOrthographic()
  },
  {
    id: 'mercator',
    name: 'Mercator',
    description: 'Standard web map',
    preserves: 'Angles & shapes',
    factory: () => d3Geo.geoMercator()
  },
  {
    id: 'equalEarth',
    name: 'Equal Earth',
    description: 'Modern equal-area',
    preserves: 'Area (sizes)',
    factory: () => d3Geo.geoEqualEarth()
  },
  {
    id: 'naturalEarth1',
    name: 'Natural Earth',
    description: 'Balanced compromise',
    preserves: 'Nothing perfectly',
    factory: () => d3Geo.geoNaturalEarth1()
  },
  {
    id: 'equirectangular',
    name: 'Plate Carrée',
    description: 'Simple lat/lon grid',
    preserves: 'Distances on meridians',
    factory: () => d3Geo.geoEquirectangular()
  }
];

// Current projection type
export const currentProjectionType = writable<ProjectionType>('orthographic');

// Rotation state (for interactive globe)
export const rotation = writable<[number, number, number]>([0, -20, 0]);

// Scale/zoom level
export const scale = writable<number>(1);

// Pan offset for flat maps (in pixels)
export const panOffset = writable<[number, number]>([0, 0]);

// Auto-rotate toggle
export const autoRotate = writable<boolean>(true);

// Get current projection config
export const currentProjectionConfig = derived(
  currentProjectionType,
  ($type) => projections.find(p => p.id === $type) || projections[0]
);

// Helper to check if current projection is a globe
export const isGlobe = derived(
  currentProjectionType,
  ($type) => $type === 'orthographic'
);
