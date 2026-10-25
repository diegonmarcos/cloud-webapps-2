// ============================================
// MYMAPS PRO - API TYPES
// ============================================

// ----------------
// PROVIDER TYPES
// ----------------

export type TileProvider = 'carto' | 'stadia' | 'mapbox' | 'maptiler';
export type GeocodingProvider = 'nominatim' | 'photon' | 'google' | 'mapbox';
export type PlacesProvider = 'overpass' | 'foursquare' | 'google' | 'yelp';
export type RoutingProvider = 'osrm' | 'valhalla' | 'google' | 'mapbox';

export type ProviderSource =
  | 'nominatim' | 'photon' | 'osm' | 'overpass'
  | 'foursquare' | 'google' | 'mapbox' | 'yelp'
  | 'osrm' | 'valhalla';

// ----------------
// CONFIGURATION
// ----------------

export interface ApiConfig {
  tiles: {
    primary: TileProvider;
    keys: {
      stadia?: string;
      mapbox?: string;
      maptiler?: string;
    };
  };
  geocoding: {
    providers: GeocodingProvider[];
    keys: {
      google?: string;
      mapbox?: string;
    };
  };
  places: {
    providers: PlacesProvider[];
    keys: {
      foursquare?: string;
      google?: string;
      yelp?: string;
    };
  };
  routing: {
    providers: RoutingProvider[];
    keys: {
      google?: string;
      mapbox?: string;
    };
  };
}

// ----------------
// CAPABILITIES
// ----------------

export interface Capabilities {
  search: {
    autocomplete: boolean;
    categories: boolean;
    photos: boolean;
  };
  places: {
    details: boolean;
    photos: boolean;
    reviews: boolean;
    hours: boolean;
  };
  routing: {
    walking: boolean;
    cycling: boolean;
    driving: boolean;
    transit: boolean;
    alternatives: boolean;
  };
  tiles: {
    vector: boolean;
    satellite: boolean;
    terrain: boolean;
    traffic: boolean;
  };
}

// ----------------
// COORDINATES
// ----------------

export type LngLat = [number, number]; // [longitude, latitude]

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ----------------
// SEARCH
// ----------------

export interface SearchOptions {
  limit?: number;
  bbox?: BoundingBox;
  proximity?: LngLat;
  language?: string;
  countryCode?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: LngLat;
  source: ProviderSource;
  type?: string;
  category?: string;
  distance?: number;
  bbox?: BoundingBox;
}

// ----------------
// PLACES
// ----------------

export interface PlacePhoto {
  url: string;
  width?: number;
  height?: number;
  attribution?: string;
}

export interface PlaceHours {
  isOpen: boolean;
  schedule: {
    day: string;
    hours: string;
  }[];
}

export interface PlaceReview {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  coordinates: LngLat;
  source: ProviderSource;
  category?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  hours?: PlaceHours;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  attributes?: Record<string, string>;
}

// ----------------
// ROUTING
// ----------------

export type RoutingMode = 'driving' | 'walking' | 'cycling' | 'transit';

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
  coordinates: LngLat;
}

export interface Route {
  distance: number;
  duration: number;
  geometry: LngLat[];
  steps: RouteStep[];
  source: ProviderSource;
  summary?: string;
}

export interface RouteOptions {
  mode: RoutingMode;
  alternatives?: boolean;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

// ----------------
// LAYERS
// ----------------

export interface CustomLayer {
  id: string;
  name: string;
  type: 'kml' | 'geojson' | 'markers';
  visible: boolean;
  data: GeoJSON.FeatureCollection | null;
  style?: LayerStyle;
}

export interface LayerStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  iconUrl?: string;
  iconSize?: number;
}

// ----------------
// MAP STATE
// ----------------

export interface MapState {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  preview?: string;
}
