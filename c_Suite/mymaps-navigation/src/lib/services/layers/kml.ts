// ============================================
// MYMAPS PRO - KML/KMZ PARSER
// ============================================

import type { CustomLayer, LayerStyle } from '$lib/services/api/types';
import * as toGeoJSON from '@mapbox/togeojson';
import JSZip from 'jszip';

/**
 * Parse KML content string
 */
export function parseKML(kmlString: string): GeoJSON.FeatureCollection {
  const parser = new DOMParser();
  const kml = parser.parseFromString(kmlString, 'text/xml');

  // Check for parse errors
  const parseError = kml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid KML format');
  }

  // Convert to GeoJSON
  const geojson = toGeoJSON.kml(kml);

  return geojson;
}

/**
 * Parse KMZ file (compressed KML)
 */
export async function parseKMZ(arrayBuffer: ArrayBuffer): Promise<GeoJSON.FeatureCollection> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find the doc.kml file (standard location)
  const kmlFile = zip.file(/\.kml$/i)[0];

  if (!kmlFile) {
    throw new Error('No KML file found in KMZ archive');
  }

  const kmlString = await kmlFile.async('string');
  return parseKML(kmlString);
}

/**
 * Load KML/KMZ from URL
 */
export async function loadKMLFromURL(url: string): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isKMZ = url.toLowerCase().endsWith('.kmz') ||
    contentType.includes('application/vnd.google-earth.kmz');

  if (isKMZ) {
    const arrayBuffer = await response.arrayBuffer();
    return parseKMZ(arrayBuffer);
  }

  const kmlString = await response.text();
  return parseKML(kmlString);
}

/**
 * Load KML/KMZ from file
 */
export async function loadKMLFromFile(file: File): Promise<GeoJSON.FeatureCollection> {
  const isKMZ = file.name.toLowerCase().endsWith('.kmz') ||
    file.type === 'application/vnd.google-earth.kmz';

  if (isKMZ) {
    const arrayBuffer = await file.arrayBuffer();
    return parseKMZ(arrayBuffer);
  }

  const kmlString = await file.text();
  return parseKML(kmlString);
}

/**
 * Extract style information from KML features
 */
export function extractKMLStyles(
  geojson: GeoJSON.FeatureCollection
): Map<string, LayerStyle> {
  const styles = new Map<string, LayerStyle>();

  for (const feature of geojson.features) {
    const props = feature.properties || {};

    // Check for style URL reference
    const styleUrl = props.styleUrl as string | undefined;
    if (!styleUrl) continue;

    // Extract style ID from URL
    const styleId = styleUrl.replace('#', '');

    if (styles.has(styleId)) continue;

    // Try to extract style properties
    const style: LayerStyle = {};

    // Icon styles
    if (props['icon-href'] || props.icon) {
      style.iconUrl = props['icon-href'] || props.icon;
    }

    // Line styles
    if (props.stroke) {
      style.strokeColor = props.stroke;
    }
    if (props['stroke-width']) {
      style.strokeWidth = parseFloat(props['stroke-width']);
    }

    // Fill styles
    if (props.fill) {
      style.fillColor = props.fill;
    }
    if (props['fill-opacity']) {
      style.fillOpacity = parseFloat(props['fill-opacity']);
    }

    if (Object.keys(style).length > 0) {
      styles.set(styleId, style);
    }
  }

  return styles;
}

/**
 * Create a CustomLayer from KML/KMZ file
 */
export async function createLayerFromKML(
  file: File
): Promise<Omit<CustomLayer, 'id'>> {
  const geojson = await loadKMLFromFile(file);

  // Extract name from file
  const name = file.name.replace(/\.(kml|kmz)$/i, '');

  return {
    name,
    type: 'kml',
    visible: true,
    data: geojson
  };
}

/**
 * Get feature count by geometry type
 */
export function getFeatureCounts(
  geojson: GeoJSON.FeatureCollection
): Record<string, number> {
  const counts: Record<string, number> = {
    Point: 0,
    LineString: 0,
    Polygon: 0,
    MultiPoint: 0,
    MultiLineString: 0,
    MultiPolygon: 0
  };

  for (const feature of geojson.features) {
    const type = feature.geometry.type;
    counts[type] = (counts[type] || 0) + 1;
  }

  return counts;
}

/**
 * Get bounding box for GeoJSON
 */
export function getBounds(
  geojson: GeoJSON.FeatureCollection
): [[number, number], [number, number]] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processCoord(coord: number[]) {
    const [lng, lat] = coord;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  function processCoords(coords: unknown) {
    if (!Array.isArray(coords)) return;

    if (typeof coords[0] === 'number') {
      processCoord(coords as number[]);
    } else {
      for (const c of coords) {
        processCoords(c);
      }
    }
  }

  for (const feature of geojson.features) {
    const geom = feature.geometry as GeoJSON.Geometry;
    if ('coordinates' in geom) {
      processCoords(geom.coordinates);
    }
  }

  if (minLng === Infinity) return null;

  return [[minLng, minLat], [maxLng, maxLat]];
}
