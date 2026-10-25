import "clsx";
import { j as ssr_context, s as store_get, b as attr_class, g as attr_style, c as attr, u as unsubscribe_stores, e as escape_html, i as stringify, a as ensure_array_like, f as derived$1 } from "./index.js";
import "maplibre-gl";
import "@sveltejs/kit/internal";
import { d as derived, w as writable } from "./url.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./exports.js";
import "./state.svelte.js";
import { c as capabilities } from "./configStore.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const defaultState = {
  center: [0, 20],
  // Centered for globe view
  zoom: 2.5,
  // Will be recalculated on load based on viewport
  bearing: 0,
  pitch: 0
};
const mapStyles = [
  {
    id: "carto-dark",
    name: "Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    preview: "https://basemaps.cartocdn.com/dark_all/5/15/12.png"
  },
  {
    id: "osm-positron",
    name: "Positron",
    url: "https://tiles.openfreemap.org/styles/positron",
    preview: "https://basemaps.cartocdn.com/light_all/5/15/12.png"
  },
  {
    id: "carto-light",
    name: "Light",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    preview: "https://basemaps.cartocdn.com/light_all/5/15/12.png"
  },
  {
    id: "carto-voyager",
    name: "Voyager",
    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    preview: "https://basemaps.cartocdn.com/rastertiles/voyager/5/15/12.png"
  },
  {
    id: "osm-liberty",
    name: "Liberty",
    url: "https://tiles.openfreemap.org/styles/liberty",
    preview: "https://tile.openstreetmap.org/5/15/12.png"
  },
  {
    id: "osm-bright",
    name: "Bright",
    url: "https://tiles.openfreemap.org/styles/bright",
    preview: "https://tile.openstreetmap.org/5/15/12.png"
  }
];
function loadState() {
  return defaultState;
}
function createMapStore() {
  const { subscribe, set, update } = writable(loadState());
  return {
    subscribe,
    /**
     * Update map state from MapLibre instance
     */
    syncFromMap(map) {
      const center = map.getCenter();
      const state = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };
      set(state);
    },
    /**
     * Set center coordinates
     */
    setCenter(center) {
      update((state) => {
        const newState = { ...state, center };
        return newState;
      });
    },
    /**
     * Set zoom level
     */
    setZoom(zoom) {
      update((state) => {
        const newState = { ...state, zoom };
        return newState;
      });
    },
    /**
     * Reset bearing to north
     */
    resetBearing() {
      update((state) => {
        const newState = { ...state, bearing: 0 };
        return newState;
      });
    },
    /**
     * Reset to default state
     */
    reset() {
      set(defaultState);
    }
  };
}
const mapStore = createMapStore();
const currentStyleId = writable("osm-bright");
derived(
  currentStyleId,
  ($id) => mapStyles.find((s) => s.id === $id) || mapStyles[0]
);
const userLocation = writable(null);
const isLocating = writable(false);
function loadGlobeState() {
  return true;
}
function loadTerrainState() {
  return false;
}
function loadTerrainLayerState() {
  return true;
}
function loadSatelliteLayerState() {
  return true;
}
const isGlobeView = writable(loadGlobeState());
const is3DTerrain = writable(loadTerrainState());
const isTerrainLayer = writable(loadTerrainLayerState());
const isSatelliteLayer = writable(loadSatelliteLayerState());
const defaultLists = [
  {
    id: "favorites",
    name: "Favorites",
    color: "#ef4444",
    places: [],
    createdAt: Date.now()
  },
  {
    id: "want-to-go",
    name: "Want to go",
    color: "#3b82f6",
    places: [],
    createdAt: Date.now()
  }
];
function loadLists() {
  return defaultLists;
}
function loadTempPins() {
  return [];
}
function createPlaceListsStore() {
  const { subscribe, set, update } = writable(loadLists());
  return {
    subscribe,
    /**
     * Add a new list
     */
    addList(name, color = "#6b7280") {
      const id = `list-${Date.now()}`;
      update((lists) => {
        const newLists = [...lists, {
          id,
          name,
          color,
          places: [],
          createdAt: Date.now()
        }];
        return newLists;
      });
      return id;
    },
    /**
     * Remove a list
     */
    removeList(listId) {
      update((lists) => {
        const newLists = lists.filter((l) => l.id !== listId);
        return newLists;
      });
    },
    /**
     * Rename a list
     */
    renameList(listId, name) {
      update((lists) => {
        const newLists = lists.map(
          (l) => l.id === listId ? { ...l, name } : l
        );
        return newLists;
      });
    },
    /**
     * Add place to a list
     */
    addPlace(listId, place) {
      const placeId = `place-${Date.now()}`;
      update((lists) => {
        const newLists = lists.map((l) => {
          if (l.id === listId) {
            return {
              ...l,
              places: [...l.places, {
                ...place,
                id: placeId,
                addedAt: Date.now()
              }]
            };
          }
          return l;
        });
        return newLists;
      });
      return placeId;
    },
    /**
     * Remove place from a list
     */
    removePlace(listId, placeId) {
      update((lists) => {
        const newLists = lists.map((l) => {
          if (l.id === listId) {
            return {
              ...l,
              places: l.places.filter((p) => p.id !== placeId)
            };
          }
          return l;
        });
        return newLists;
      });
    },
    /**
     * Check if a place is in any list (by coordinates)
     */
    isPlaceInAnyList(coordinates) {
      let found = false;
      const unsubscribe = subscribe((lists) => {
        found = lists.some(
          (l) => l.places.some(
            (p) => p.coordinates[0] === coordinates[0] && p.coordinates[1] === coordinates[1]
          )
        );
      });
      unsubscribe();
      return found;
    },
    /**
     * Get lists containing a place (by coordinates)
     */
    getListsForPlace(coordinates) {
      let result = [];
      const unsubscribe = subscribe((lists) => {
        result = lists.filter(
          (l) => l.places.some(
            (p) => p.coordinates[0] === coordinates[0] && p.coordinates[1] === coordinates[1]
          )
        );
      });
      unsubscribe();
      return result;
    }
  };
}
function createTempPinsStore() {
  const { subscribe, set, update } = writable(loadTempPins());
  return {
    subscribe,
    /**
     * Add a temporary pin from search
     */
    add(pin) {
      const id = `temp-${Date.now()}`;
      update((pins) => {
        const exists = pins.some(
          (p) => p.coordinates[0] === pin.coordinates[0] && p.coordinates[1] === pin.coordinates[1]
        );
        if (exists) return pins;
        const newPins = [...pins, {
          ...pin,
          id,
          createdAt: Date.now()
        }];
        return newPins;
      });
      return id;
    },
    /**
     * Remove a single temp pin
     */
    remove(pinId) {
      update((pins) => {
        const newPins = pins.filter((p) => p.id !== pinId);
        return newPins;
      });
    },
    /**
     * Clear all temporary pins
     */
    clearAll() {
      set([]);
    },
    /**
     * Remove pin by coordinates (when added to a list)
     */
    removeByCoordinates(coordinates) {
      update((pins) => {
        const newPins = pins.filter(
          (p) => p.coordinates[0] !== coordinates[0] || p.coordinates[1] !== coordinates[1]
        );
        return newPins;
      });
    }
  };
}
const placeLists = createPlaceListsStore();
const tempPins = createTempPinsStore();
derived(
  placeLists,
  ($lists) => $lists.reduce((sum, list) => sum + list.places.length, 0)
);
const tempPinsCount = derived(tempPins, ($pins) => $pins.length);
function loadListVisibility() {
  return {};
}
function createListVisibilityStore() {
  const { subscribe, set, update } = writable(loadListVisibility());
  return {
    subscribe,
    toggle(listId) {
      update((v) => {
        const newV = { ...v, [listId]: !v[listId] };
        return newV;
      });
    },
    setVisible(listId, visible) {
      update((v) => {
        const newV = { ...v, [listId]: visible };
        return newV;
      });
    },
    isVisible(listId) {
      let result = false;
      const unsub = subscribe((v) => {
        result = v[listId] ?? false;
      });
      unsub();
      return result;
    }
  };
}
const listVisibility = createListVisibilityStore();
const quickSearchCategories = [
  { id: "supermarket", name: "Supermarkets", emoji: "🛒", query: "supermarket" },
  { id: "park", name: "Parks", emoji: "🌳", query: "park" },
  { id: "gym", name: "Gyms", emoji: "💪", query: "gym fitness" },
  { id: "bar", name: "Bars", emoji: "🍺", query: "bar pub" },
  { id: "hostel", name: "Hostels", emoji: "🛏️", query: "hostel" },
  { id: "restaurant", name: "Restaurants", emoji: "🍽️", query: "restaurant" },
  { id: "cafe", name: "Cafes", emoji: "☕", query: "cafe coffee" },
  { id: "pharmacy", name: "Pharmacies", emoji: "💊", query: "pharmacy" },
  { id: "atm", name: "ATMs", emoji: "🏧", query: "atm bank" },
  { id: "gas", name: "Gas Stations", emoji: "⛽", query: "gas station fuel" }
];
function loadActiveCategories() {
  return [];
}
function createQuickSearchStore() {
  const activeCategories = writable(loadActiveCategories());
  const pins = writable([]);
  const isLoading = writable(false);
  return {
    activeCategories: {
      subscribe: activeCategories.subscribe,
      toggle(categoryId) {
        activeCategories.update((cats) => {
          const newCats = cats.includes(categoryId) ? cats.filter((c) => c !== categoryId) : [...cats, categoryId];
          return newCats;
        });
      },
      isActive(categoryId) {
        let result = false;
        const unsub = activeCategories.subscribe((cats) => {
          result = cats.includes(categoryId);
        });
        unsub();
        return result;
      },
      clear() {
        activeCategories.set([]);
      }
    },
    pins: {
      subscribe: pins.subscribe,
      set(newPins) {
        pins.set(newPins);
      },
      addPins(newPins) {
        pins.update((p) => [...p, ...newPins]);
      },
      clearCategory(categoryId) {
        pins.update((p) => p.filter((pin) => pin.categoryId !== categoryId));
      },
      clearAll() {
        pins.set([]);
      }
    },
    isLoading: {
      subscribe: isLoading.subscribe,
      set: isLoading.set
    }
  };
}
const quickSearch = createQuickSearchStore();
function loadSearchRadius() {
  return 10;
}
function createSearchRadiusStore() {
  const { subscribe, set } = writable(loadSearchRadius());
  return {
    subscribe,
    set(radius) {
      const clamped = Math.max(1, Math.min(100, radius));
      set(clamped);
    }
  };
}
const searchRadius = createSearchRadiusStore();
function MapCanvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="map-canvas"></div>`);
  });
}
const mapEngine = writable("maplibre");
function loadLayerMetadata() {
  return [];
}
function generateLayerId() {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function createLayerStore() {
  const initialLayers = loadLayerMetadata().map((meta) => ({
    ...meta,
    data: null
  }));
  const { subscribe, set, update } = writable(initialLayers);
  return {
    subscribe,
    /**
     * Add a new custom layer
     */
    add(layer) {
      const id = generateLayerId();
      const newLayer = { id, ...layer };
      update((layers) => {
        const updated = [...layers, newLayer];
        return updated;
      });
      return id;
    },
    /**
     * Update a layer
     */
    update(id, updates) {
      update((layers) => {
        const updated = layers.map(
          (layer) => layer.id === id ? { ...layer, ...updates } : layer
        );
        return updated;
      });
    },
    /**
     * Toggle layer visibility
     */
    toggleVisibility(id) {
      update((layers) => {
        const updated = layers.map(
          (layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer
        );
        return updated;
      });
    },
    /**
     * Remove a layer
     */
    remove(id) {
      update((layers) => {
        const updated = layers.filter((layer) => layer.id !== id);
        return updated;
      });
    },
    /**
     * Get a layer by ID
     */
    get(id) {
      let layer;
      subscribe((layers) => {
        layer = layers.find((l) => l.id === id);
      })();
      return layer;
    },
    /**
     * Clear all layers
     */
    clear() {
      set([]);
    }
  };
}
const layerStore = createLayerStore();
derived(
  layerStore,
  ($layers) => $layers.filter((layer) => layer.visible)
);
const showLayersPanel = writable(false);
function MapControls($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let bearingStyle = "";
    bearingStyle = `--bearing: ${-store_get($$store_subs ??= {}, "$mapStore", mapStore).bearing}deg`;
    $$renderer2.push(`<div class="map-controls"><div class="map-control-group"><button class="map-control-btn" aria-label="Zoom in" title="Zoom in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button> <button class="map-control-btn" aria-label="Zoom out" title="Zoom out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button></div> <button${attr_class("map-compass", void 0, {
      "map-compass--rotated": store_get($$store_subs ??= {}, "$mapStore", mapStore).bearing !== 0
    })}${attr_style(bearingStyle)} aria-label="Reset bearing to north" title="Reset north"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L15 10L12 8L9 10L12 2Z" fill="#ef4444" stroke="currentColor" stroke-width="1"></path><path d="M12 22L9 14L12 16L15 14L12 22Z" fill="currentColor" stroke="currentColor" stroke-width="1"></path></svg></button> <button${attr_class("geolocate-btn", void 0, {
      "geolocate-btn--tracking": store_get($$store_subs ??= {}, "$userLocation", userLocation) !== null
    })} aria-label="Find my location" title="My location"${attr("disabled", store_get($$store_subs ??= {}, "$isLocating", isLocating), true)}>`);
    if (store_get($$store_subs ??= {}, "$isLocating", isLocating)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"></animateTransform></circle></svg>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button> <button class="map-control-btn map-control-btn--standalone" aria-label="Reset to world view" title="World view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></button> <button${attr_class("map-control-btn map-control-btn--standalone", void 0, {
      "map-control-btn--active": store_get($$store_subs ??= {}, "$showLayersPanel", showLayersPanel)
    })} aria-label="Toggle layers panel" title="Layers"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></button> <button${attr_class("map-control-btn map-control-btn--standalone", void 0, {
      "map-control-btn--active": store_get($$store_subs ??= {}, "$isGlobeView", isGlobeView)
    })}${attr("aria-label", store_get($$store_subs ??= {}, "$isGlobeView", isGlobeView) ? "Switch to flat map" : "Switch to globe view")}${attr("title", store_get($$store_subs ??= {}, "$isGlobeView", isGlobeView) ? "Flat map" : "Globe view")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></button> <button${attr_class("map-control-btn map-control-btn--standalone", void 0, {
      "map-control-btn--active": store_get($$store_subs ??= {}, "$mapEngine", mapEngine) === "cesium"
    })}${attr("aria-label", store_get($$store_subs ??= {}, "$mapEngine", mapEngine) === "cesium" ? "Switch to MapLibre" : "Switch to Cesium 3D")}${attr("title", store_get($$store_subs ??= {}, "$mapEngine", mapEngine) === "cesium" ? "MapLibre" : "Cesium 3D terrain")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l4-10 4 10M4.5 13.5h5M13 17l4-14 4 14M14 13h6"></path></svg></button></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const MAX_RECENT_SEARCHES = 10;
const searchQuery = writable("");
const isSearching = writable(false);
const searchResults = writable([]);
const selectedResult = writable(null);
const selectedPlace = writable(null);
const isLoadingPlace = writable(false);
function loadRecentSearches() {
  return [];
}
function createRecentSearchesStore() {
  const { subscribe, set, update } = writable(loadRecentSearches());
  return {
    subscribe,
    /**
     * Add a search query to recent searches
     */
    add(query) {
      const trimmed = query.trim();
      if (!trimmed) return;
      update((searches) => {
        const filtered = searches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        return updated;
      });
    },
    /**
     * Remove a search from recent searches
     */
    remove(query) {
      update((searches) => {
        const filtered = searches.filter((s) => s !== query);
        return filtered;
      });
    },
    /**
     * Clear all recent searches
     */
    clear() {
      set([]);
    }
  };
}
const recentSearches = createRecentSearchesStore();
derived(
  searchResults,
  ($results) => $results.length > 0
);
derived(
  [searchQuery, searchResults, isSearching],
  ([$query, $results, $loading]) => {
    return $query.length > 0 && ($results.length > 0 || $loading);
  }
);
const routeOrigin = writable(null);
const routeDestination = writable(null);
const routeMode = writable("driving");
const routes = writable([]);
const selectedRouteIndex = writable(0);
const isCalculatingRoute = writable(false);
const routeError = writable(null);
const showDirectionsPanel = writable(false);
const selectedRoute = derived(
  [routes, selectedRouteIndex],
  ([$routes, $index]) => $routes[$index] || null
);
derived(
  [routeOrigin, routeDestination],
  ([$origin, $destination]) => $origin !== null && $destination !== null
);
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}
function formatDistance(meters) {
  if (meters >= 1e3) {
    const km = meters / 1e3;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
function ProviderBadge($$renderer, $$props) {
  let { source } = $$props;
  const labels = {
    nominatim: "OSM",
    photon: "OSM",
    osm: "OSM",
    overpass: "OSM",
    foursquare: "FSQ",
    google: "Google",
    mapbox: "Mapbox",
    yelp: "Yelp",
    osrm: "OSRM",
    valhalla: "Valhalla"
  };
  $$renderer.push(`<span${attr_class(`provider-badge provider-badge--${stringify(source)}`)}>${escape_html(labels[source] || source)}</span>`);
}
function PlacePanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    function formatCategory(category) {
      if (!category) return "";
      return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    function formatPhone(phone) {
      if (!phone) return "";
      return phone.replace(/\s+/g, " ").trim();
    }
    let place = derived$1(() => store_get($$store_subs ??= {}, "$selectedPlace", selectedPlace) || (store_get($$store_subs ??= {}, "$selectedResult", selectedResult) ? {
      id: store_get($$store_subs ??= {}, "$selectedResult", selectedResult).id,
      name: store_get($$store_subs ??= {}, "$selectedResult", selectedResult).name,
      address: store_get($$store_subs ??= {}, "$selectedResult", selectedResult).address,
      coordinates: store_get($$store_subs ??= {}, "$selectedResult", selectedResult).coordinates,
      source: store_get($$store_subs ??= {}, "$selectedResult", selectedResult).source,
      category: store_get($$store_subs ??= {}, "$selectedResult", selectedResult).category
    } : null));
    let showPanel = derived$1(() => place() !== null);
    if (showPanel() && place()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="place-panel panel"><div class="panel-header"><div class="place-panel-header-content"><h2 class="panel-title">${escape_html(place().name)}</h2> `);
      if (place().category) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="place-category">${escape_html(formatCategory(place().category))}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <button class="panel-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> `);
      if (store_get($$store_subs ??= {}, "$isLoadingPlace", isLoadingPlace)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="place-loading"><div class="search-loading-spinner"></div> <span>Loading details...</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="place-content"><div class="place-info-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="place-info-text">${escape_html(place().address)}</span></div> `);
        if (place().phone) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<a${attr("href", `tel:${stringify(place().phone)}`)} class="place-info-row place-info-row--link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> <span class="place-info-text">${escape_html(formatPhone(place().phone))}</span></a>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (place().website) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<a${attr("href", place().website)} target="_blank" rel="noopener noreferrer" class="place-info-row place-info-row--link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> <span class="place-info-text place-info-text--truncate">${escape_html(place().website.replace(/^https?:\/\/(www\.)?/, ""))}</span></a>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (place().rating) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="place-info-row"><svg viewBox="0 0 24 24" fill="currentColor" class="place-info-icon place-info-icon--star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> <span class="place-info-text">${escape_html(place().rating.toFixed(1))} `);
          if (place().reviewCount) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="place-review-count">(${escape_html(place().reviewCount)} reviews)</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></span></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (place().hours) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="place-hours"><div class="place-hours-header"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span${attr_class("place-hours-status", void 0, { "place-hours-status--open": place().hours.isOpen })}>${escape_html(place().hours.isOpen ? "Open now" : "Closed")}</span></div> `);
          if (place().hours.schedule?.length > 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="place-hours-schedule"><!--[-->`);
            const each_array = ensure_array_like(place().hours.schedule);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let day = each_array[$$index];
              $$renderer2.push(`<div class="place-hours-day"><span>${escape_html(day.day)}</span> <span>${escape_html(day.hours)}</span></div>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (place().attributes && Object.keys(place().attributes).length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="place-attributes"><!--[-->`);
          const each_array_1 = ensure_array_like(Object.entries(place().attributes));
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let [key, value] = each_array_1[$$index_1];
            $$renderer2.push(`<span class="place-attribute">${escape_html(key.replace(/[_:]/g, " "))}: ${escape_html(value)}</span>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (place().photos && place().photos.length > 0 && store_get($$store_subs ??= {}, "$capabilities", capabilities).places.photos) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="place-photos"><!--[-->`);
          const each_array_2 = ensure_array_like(place().photos.slice(0, 4));
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let photo = each_array_2[$$index_2];
            $$renderer2.push(`<div class="place-photo"><img${attr("src", photo.url)}${attr("alt", place().name)} loading="lazy"/></div>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else if (!store_get($$store_subs ??= {}, "$capabilities", capabilities).places.photos) {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<div class="place-premium-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> <span>Add Foursquare or Google API key for photos</span></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (place().reviews && place().reviews.length > 0 && store_get($$store_subs ??= {}, "$capabilities", capabilities).places.reviews) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="place-reviews"><h3 class="place-section-title">Reviews</h3> <!--[-->`);
          const each_array_3 = ensure_array_like(place().reviews.slice(0, 3));
          for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
            let review = each_array_3[$$index_4];
            $$renderer2.push(`<div class="place-review"><div class="place-review-header"><span class="place-review-author">${escape_html(review.author)}</span> <div class="place-review-rating"><!--[-->`);
            const each_array_4 = ensure_array_like(Array(5));
            for (let i = 0, $$length2 = each_array_4.length; i < $$length2; i++) {
              each_array_4[i];
              $$renderer2.push(`<svg viewBox="0 0 24 24"${attr("fill", i < review.rating ? "currentColor" : "none")} stroke="currentColor" stroke-width="2" class="place-review-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`);
            }
            $$renderer2.push(`<!--]--></div></div> <p class="place-review-text">${escape_html(review.text)}</p> <span class="place-review-date">${escape_html(review.date)}</span></div>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="place-source"><span>Data from</span> `);
        ProviderBadge($$renderer2, { source: place().source });
        $$renderer2.push(`<!----></div></div> <div class="place-actions"><button class="glass-button glass-button--primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg> Directions</button> <button class="glass-button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> Share</button></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  placeLists as A,
  listVisibility as B,
  MapControls as C,
  PlacePanel as D,
  mapEngine as E,
  selectedPlace as F,
  isLoadingPlace as G,
  MapCanvas as M,
  ProviderBadge as P,
  selectedResult as a,
  quickSearch as b,
  searchQuery as c,
  formatDistance as d,
  showDirectionsPanel as e,
  formatDuration as f,
  routeMode as g,
  isCalculatingRoute as h,
  isSearching as i,
  routeError as j,
  selectedRoute as k,
  routeOrigin as l,
  routeDestination as m,
  showLayersPanel as n,
  onDestroy as o,
  mapStyles as p,
  quickSearchCategories as q,
  recentSearches as r,
  searchResults as s,
  currentStyleId as t,
  isTerrainLayer as u,
  isSatelliteLayer as v,
  isGlobeView as w,
  is3DTerrain as x,
  searchRadius as y,
  tempPinsCount as z
};
