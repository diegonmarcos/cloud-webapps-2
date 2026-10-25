import { e as escape_html, s as store_get, a as ensure_array_like, b as attr_class, c as attr, u as unsubscribe_stores, d as bind_props, f as derived, g as attr_style, i as stringify, h as head } from "../../chunks/index.js";
import { o as onDestroy, P as ProviderBadge, s as searchResults, a as selectedResult, q as quickSearchCategories, b as quickSearch, i as isSearching, c as searchQuery, r as recentSearches, f as formatDuration, d as formatDistance, e as showDirectionsPanel, g as routeMode, h as isCalculatingRoute, j as routeError, k as selectedRoute, l as routeOrigin, m as routeDestination, n as showLayersPanel, p as mapStyles, t as currentStyleId, u as isTerrainLayer, v as isSatelliteLayer, w as isGlobeView, x as is3DTerrain, y as searchRadius, z as tempPinsCount, A as placeLists, B as listVisibility, M as MapCanvas, C as MapControls, D as PlacePanel, E as mapEngine } from "../../chunks/PlacePanel.js";
import "clsx";
import { c as capabilities } from "../../chunks/configStore.js";
import "maplibre-gl";
import "@mapbox/togeojson";
import "jszip";
import { b as base } from "../../chunks/server.js";
import "../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
function CesiumCanvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let viewer;
    onDestroy(() => {
      viewer?.destroy();
      viewer = void 0;
    });
    $$renderer2.push(`<div class="cesium-container svelte-wkkdor"></div>`);
  });
}
function SearchResults($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let contextMenuState = {
      show: false,
      x: 0,
      y: 0,
      coordinates: [0, 0],
      placeName: "",
      placeAddress: ""
    };
    function getContextMenuState() {
      return contextMenuState;
    }
    function closeContextMenu() {
      contextMenuState.show = false;
    }
    function formatDistance2(meters) {
      if (!meters) return "";
      if (meters < 1e3) return `${Math.round(meters)} m`;
      return `${(meters / 1e3).toFixed(1)} km`;
    }
    function getCategoryIcon(category) {
      const icons = {
        amenity: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
        building: "M12 3L2 12h3v8h14v-8h3L12 3zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
        place: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
        highway: "M12 2L4 7v15h16V7l-8-5zm0 2.5L18 8v11H6V8l6-3.5z",
        shop: "M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"
      };
      return icons[category || ""] || icons.place;
    }
    $$renderer2.push(`<div class="search-results"><div class="search-results-header"><span>${escape_html(store_get($$store_subs ??= {}, "$searchResults", searchResults).length)} result${escape_html(store_get($$store_subs ??= {}, "$searchResults", searchResults).length !== 1 ? "s" : "")}</span></div> <!--[-->`);
    const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$searchResults", searchResults));
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let result = each_array[$$index];
      $$renderer2.push(`<div${attr_class("search-result", void 0, {
        "search-result--selected": store_get($$store_subs ??= {}, "$selectedResult", selectedResult)?.id === result.id
      })} role="button" tabindex="0"><div class="search-result-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path${attr("d", getCategoryIcon(result.category))}></path></svg></div> <div class="search-result-content"><div class="search-result-name"><span class="search-result-title">${escape_html(result.name)}</span> `);
      ProviderBadge($$renderer2, { source: result.source });
      $$renderer2.push(`<!----></div> <div class="search-result-address">${escape_html(result.address)}</div> `);
      if (result.distance || result.type) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="search-result-meta">`);
        if (result.distance) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="search-result-distance">${escape_html(formatDistance2(result.distance))}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (result.type) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span>${escape_html(result.type)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <button class="search-result-directions glass-button glass-button--icon glass-button--small" aria-label="Get directions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg></button></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { getContextMenuState, closeContextMenu });
  });
}
function QuickSearchBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const { activeCategories, isLoading } = quickSearch;
    $$renderer2.push(`<div class="quick-search-bar"><!--[-->`);
    const each_array = ensure_array_like(
      // Debounce re-search
      // Re-search all active categories
      quickSearchCategories
    );
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      $$renderer2.push(`<button${attr_class("quick-search-btn", void 0, {
        "quick-search-btn--active": store_get($$store_subs ??= {}, "$activeCategories", activeCategories).includes(category.id)
      })}${attr("title", category.name)}${attr("disabled", store_get($$store_subs ??= {}, "$isLoading", isLoading), true)}><span class="quick-search-emoji">${escape_html(category.emoji)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SearchBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isFocused = false;
    let showDropdown = derived(() => isFocused);
    let hasResults = derived(() => store_get($$store_subs ??= {}, "$searchResults", searchResults).length > 0);
    $$renderer2.push(`<div class="search-container"><div${attr_class("search-bar", void 0, {
      "search-bar--focused": isFocused,
      "search-bar--has-results": showDropdown() && (hasResults() || store_get($$store_subs ??= {}, "$isSearching", isSearching))
    })}><span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span> <input type="text" class="search-input" placeholder="Search places..."${attr("value", store_get($$store_subs ??= {}, "$searchQuery", searchQuery))} autocomplete="off" spellcheck="false"/> <button${attr_class("search-clear", void 0, {
      "search-clear--visible": store_get($$store_subs ??= {}, "$searchQuery", searchQuery).length > 0
    })} aria-label="Clear search"${attr("tabindex", store_get($$store_subs ??= {}, "$searchQuery", searchQuery).length > 0 ? 0 : -1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> `);
    if (showDropdown()) {
      $$renderer2.push("<!--[0-->");
      if (store_get($$store_subs ??= {}, "$isSearching", isSearching)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="search-results"><div class="search-loading"><div class="search-loading-spinner"></div> <span>Searching...</span></div></div>`);
      } else if (hasResults()) {
        $$renderer2.push("<!--[1-->");
        SearchResults($$renderer2, {});
      } else if (store_get($$store_subs ??= {}, "$searchQuery", searchQuery).length > 1 && !store_get($$store_subs ??= {}, "$isSearching", isSearching)) {
        $$renderer2.push("<!--[2-->");
        $$renderer2.push(`<div class="search-results"><div class="search-no-results"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 15s1.5-2 4-2 4 2 4 2"></path><circle cx="9" cy="9" r="1" fill="currentColor"></circle><circle cx="15" cy="9" r="1" fill="currentColor"></circle></svg> <p>No results found</p> <span>Try a different search term</span></div></div>`);
      } else if (store_get($$store_subs ??= {}, "$recentSearches", recentSearches).length > 0) {
        $$renderer2.push("<!--[3-->");
        $$renderer2.push(`<div class="search-results"><div class="recent-searches"><div class="recent-searches-header"><span>Recent</span> <button>Clear</button></div> <!--[-->`);
        const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$recentSearches", recentSearches));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let query = each_array[$$index];
          $$renderer2.push(`<button class="recent-search-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span>${escape_html(query)}</span></button>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    QuickSearchBar($$renderer2);
    $$renderer2.push(`<!----></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function DirectionsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let originInput = "";
    let destinationInput = "";
    const modeIcons = {
      driving: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
      walking: "M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7",
      cycling: "M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z",
      transit: "M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"
    };
    if (store_get($$store_subs ??= {}, "$showDirectionsPanel", showDirectionsPanel)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="directions-panel panel"><div class="panel-header"><h2 class="panel-title">Directions</h2> <button class="panel-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="directions-inputs"><div class="directions-input-row"><span class="directions-dot directions-dot--origin"></span> <input type="text" class="directions-input" placeholder="Choose starting point..."${attr("value", originInput)} readonly=""/> <button class="directions-swap" aria-label="Use my location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path></svg></button></div> <div class="directions-input-row"><span class="directions-dot directions-dot--destination"></span> <input type="text" class="directions-input" placeholder="Choose destination..."${attr("value", destinationInput)} readonly=""/> <button class="directions-swap" aria-label="Swap origin and destination"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 16 3 12 7 8"></polyline><polyline points="17 8 21 12 17 16"></polyline><line x1="3" y1="12" x2="21" y2="12"></line></svg></button></div></div> <div class="directions-modes"><!--[-->`);
      const each_array = ensure_array_like(["driving", "walking", "cycling", "transit"]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let mode = each_array[$$index];
        $$renderer2.push(`<button${attr_class("directions-mode", void 0, {
          "directions-mode--active": store_get($$store_subs ??= {}, "$routeMode", routeMode) === mode,
          "directions-mode--disabled": mode === "transit" && !store_get($$store_subs ??= {}, "$capabilities", capabilities).routing.transit
        })}${attr("disabled", mode === "transit" && !store_get($$store_subs ??= {}, "$capabilities", capabilities).routing.transit, true)}${attr("aria-label", mode)}><svg viewBox="0 0 24 24" fill="currentColor"><path${attr("d", modeIcons[mode])}></path></svg> ${escape_html(mode.charAt(0).toUpperCase() + mode.slice(1))}</button>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (store_get($$store_subs ??= {}, "$isCalculatingRoute", isCalculatingRoute)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="directions-loading"><div class="search-loading-spinner"></div> <span>Calculating route...</span></div>`);
      } else if (store_get($$store_subs ??= {}, "$routeError", routeError)) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="search-no-results"><p>${escape_html(store_get($$store_subs ??= {}, "$routeError", routeError))}</p></div>`);
      } else if (store_get($$store_subs ??= {}, "$selectedRoute", selectedRoute)) {
        $$renderer2.push("<!--[2-->");
        $$renderer2.push(`<div class="directions-summary"><div><div class="directions-duration">${escape_html(formatDuration(store_get($$store_subs ??= {}, "$selectedRoute", selectedRoute).duration))}</div> <div class="directions-distance">${escape_html(formatDistance(store_get($$store_subs ??= {}, "$selectedRoute", selectedRoute).distance))}</div></div> `);
        ProviderBadge($$renderer2, {
          source: store_get($$store_subs ??= {}, "$selectedRoute", selectedRoute).source
        });
        $$renderer2.push(`<!----></div> <div class="directions-steps"><!--[-->`);
        const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$selectedRoute", selectedRoute).steps);
        for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
          let step = each_array_1[i];
          $$renderer2.push(`<div class="directions-step"><div class="directions-step-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">`);
          if (i === 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<circle cx="12" cy="12" r="6"></circle>`);
          } else if (i === store_get($$store_subs ??= {}, "$selectedRoute", selectedRoute).steps.length - 1) {
            $$renderer2.push("<!--[1-->");
            $$renderer2.push(`<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path>`);
          }
          $$renderer2.push(`<!--]--></svg></div> <div class="directions-step-content"><div class="directions-step-instruction">${escape_html(step.instruction)}</div> <div class="directions-step-meta">${escape_html(formatDistance(step.distance))} · ${escape_html(formatDuration(step.duration))}</div></div></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else if (store_get($$store_subs ??= {}, "$routeOrigin", routeOrigin) && store_get($$store_subs ??= {}, "$routeDestination", routeDestination)) {
        $$renderer2.push("<!--[3-->");
        $$renderer2.push(`<div class="directions-calculate"><button class="glass-button glass-button--primary">Get Directions</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg> <p>Select origin and destination</p></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function LayersPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let sectionsOpen = {
      style: true,
      layers: true,
      options: true,
      places: true,
      custom: false
    };
    if (store_get($$store_subs ??= {}, "$showLayersPanel", showLayersPanel)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="layers-panel panel"><div class="panel-header"><h2 class="panel-title">Layers</h2> <button class="panel-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div> <div class="layers-section"><button class="layers-section-header"><h3 class="layers-section-title">Map Style</h3> <svg${attr_class("layers-section-chevron", void 0, { "layers-section-chevron--open": sectionsOpen.style })} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="layers-section-content"><!--[-->`);
        const each_array = ensure_array_like(mapStyles);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let style = each_array[$$index];
          $$renderer2.push(`<button class="layer-option"><div${attr_class("layer-preview", void 0, {
            "layer-preview--active": store_get($$store_subs ??= {}, "$currentStyleId", currentStyleId) === style.id
          })}>`);
          if (style.preview) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<img${attr("src", style.preview)}${attr("alt", style.name)}/>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<div class="layer-preview-placeholder"></div>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="layer-info"><div class="layer-name">${escape_html(style.name)}</div></div></button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="layers-section"><button class="layers-section-header"><h3 class="layers-section-title">Layers</h3> <svg${attr_class("layers-section-chevron", void 0, { "layers-section-chevron--open": sectionsOpen.layers })} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="layers-section-content"><button class="layer-option"><div${attr_class("layer-preview", void 0, {
          "layer-preview--active": !store_get($$store_subs ??= {}, "$isTerrainLayer", isTerrainLayer) && !store_get($$store_subs ??= {}, "$isSatelliteLayer", isSatelliteLayer)
        })}><div class="layer-preview-placeholder layer-preview-placeholder--none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg></div></div> <div class="layer-info"><div class="layer-name">None</div></div></button> <button class="layer-option"><div${attr_class("layer-preview", void 0, {
          "layer-preview--active": store_get($$store_subs ??= {}, "$isTerrainLayer", isTerrainLayer)
        })}><div class="layer-preview-placeholder layer-preview-placeholder--terrain"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M3 17l4-4 4 4 6-6 4 4"></path><path d="M3 21h18"></path><path d="M8 13l-2 2"></path><path d="M17 11l-3 3"></path></svg></div></div> <div class="layer-info"><div class="layer-name">Terrain</div></div></button> <button class="layer-option"><div${attr_class("layer-preview", void 0, {
          "layer-preview--active": store_get($$store_subs ??= {}, "$isSatelliteLayer", isSatelliteLayer)
        })}><div class="layer-preview-placeholder layer-preview-placeholder--satellite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div></div> <div class="layer-info"><div class="layer-name">Satellite</div></div></button></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="layers-section"><button class="layers-section-header"><h3 class="layers-section-title">Options</h3> <svg${attr_class("layers-section-chevron", void 0, { "layers-section-chevron--open": sectionsOpen.options })} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="layers-section-content"><label class="layer-toggle" for="globe-view"><input type="checkbox" id="globe-view"${attr("checked", store_get($$store_subs ??= {}, "$isGlobeView", isGlobeView), true)}/> <span class="toggle-switch"></span> <span class="toggle-label">Globe View</span></label> <label class="layer-toggle" for="terrain-3d"><input type="checkbox" id="terrain-3d"${attr("checked", store_get($$store_subs ??= {}, "$is3DTerrain", is3DTerrain), true)}/> <span class="toggle-switch"></span> <span class="toggle-label">3D Elevation</span></label> <div class="option-input-row"><label class="option-label" for="search-radius">Search Radius</label> <div class="option-input-group"><input type="number" id="search-radius" class="option-input"${attr("value", store_get($$store_subs ??= {}, "$searchRadius", searchRadius))} min="1" max="100" step="1"/> <span class="option-input-suffix">km</span></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="layers-section"><button class="layers-section-header"><h3 class="layers-section-title">Lists of Places `);
      if (store_get($$store_subs ??= {}, "$tempPinsCount", tempPinsCount) > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="layers-section-badge">${escape_html(store_get($$store_subs ??= {}, "$tempPinsCount", tempPinsCount))} pins</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></h3> <svg${attr_class("layers-section-chevron", void 0, { "layers-section-chevron--open": sectionsOpen.places })} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="layers-section-content">`);
        if (store_get($$store_subs ??= {}, "$tempPinsCount", tempPinsCount) > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="places-temp-section"><div class="places-temp-header"><span class="places-temp-label">Search pins (${escape_html(store_get($$store_subs ??= {}, "$tempPinsCount", tempPinsCount))})</span> <button class="places-clear-btn">Clear all</button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <!--[-->`);
        const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$placeLists", placeLists));
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let list = each_array_1[$$index_1];
          $$renderer2.push(`<button${attr_class("places-list-btn", void 0, {
            "places-list-btn--active": store_get($$store_subs ??= {}, "$listVisibility", listVisibility)[list.id]
          })}><span class="places-list-color"${attr_style(`background-color: ${stringify(list.color)}`)}></span> <span class="places-list-name">${escape_html(list.name)}</span> <span class="places-list-count">${escape_html(list.places.length)}</span></button>`);
        }
        $$renderer2.push(`<!--]--> `);
        if (store_get($$store_subs ??= {}, "$placeLists", placeLists).length === 0 && store_get($$store_subs ??= {}, "$tempPinsCount", tempPinsCount) === 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="layers-empty-text">No saved places yet</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="layers-section"><button class="layers-section-header"><h3 class="layers-section-title">Custom Layers</h3> <svg${attr_class("layers-section-chevron", void 0, { "layers-section-chevron--open": sectionsOpen.custom })} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SideMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isOpen = false;
    const menuSections = [
      {
        id: "list",
        name: "Places",
        icon: "M4 6h16M4 12h16M4 18h16",
        description: "View saved places"
      },
      {
        id: "maps",
        name: "Maps",
        icon: "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7",
        description: "Map projections"
      },
      {
        id: "chronology",
        name: "Chronology",
        icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
        description: "Location history"
      },
      {
        id: "mytrips",
        name: "MyTrips",
        icon: "M3 17l6-6 4 4 8-8M17 7h4v4",
        description: "Travel journal"
      }
    ];
    const tripPages = [
      { id: "home", label: "Home", icon: "🏠", hash: "" },
      { id: "atlas", label: "Atlas", icon: "🗺️", hash: "#atlas" },
      {
        id: "collections",
        label: "Collections",
        icon: "🃏",
        hash: "#themes"
      },
      { id: "stats", label: "Stats", icon: "📊", hash: "#analytics" },
      {
        id: "timeline",
        label: "Timeline",
        icon: "⏱️",
        hash: "#timeline"
      },
      {
        id: "roadtrip",
        label: "Cultural Regions",
        icon: "🌎",
        path: "/myroadtrip.html"
      }
    ];
    const mapProjections = [
      { id: "orthographic", name: "Globe", icon: "🌍" },
      { id: "mercator", name: "Mercator", icon: "🗺️" },
      { id: "equalEarth", name: "Equal Earth", icon: "🌐" },
      { id: "naturalEarth1", name: "Natural Earth", icon: "🗾" },
      { id: "equirectangular", name: "Plate Carrée", icon: "📊" }
    ];
    let activeSection = null;
    $$renderer2.push(`<button${attr_class("menu-toggle", void 0, { "menu-toggle--open": isOpen })}${attr("aria-label", "Open menu")}${attr("aria-expanded", isOpen)}><span class="menu-toggle-bar"></span> <span class="menu-toggle-bar"></span> <span class="menu-toggle-bar"></span></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <nav${attr_class("side-menu", void 0, { "side-menu--open": isOpen })} aria-label="Main menu"><div class="side-menu-header"><h2 class="side-menu-title">MyMaps</h2></div> <div class="side-menu-content"><!--[-->`);
    const each_array = ensure_array_like(menuSections);
    for (let $$index_4 = 0, $$length = each_array.length; $$index_4 < $$length; $$index_4++) {
      let section = each_array[$$index_4];
      $$renderer2.push(`<button${attr_class("menu-section", void 0, { "menu-section--active": activeSection === section.id })}><div class="menu-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path${attr("d", section.icon)}></path></svg></div> <div class="menu-section-info"><span class="menu-section-name">${escape_html(section.name)}</span> <span class="menu-section-desc">${escape_html(section.description)}</span></div> <svg class="menu-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button> `);
      if (activeSection === section.id) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="menu-section-content">`);
        if (section.id === "list") {
          $$renderer2.push("<!--[0-->");
          if (store_get($$store_subs ??= {}, "$placeLists", placeLists).length === 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="menu-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> <p>No saved places yet</p> <span>Search and save places to see them here</span></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<!--[-->`);
            const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$placeLists", placeLists));
            for (let $$index_1 = 0, $$length2 = each_array_1.length; $$index_1 < $$length2; $$index_1++) {
              let list = each_array_1[$$index_1];
              $$renderer2.push(`<div class="menu-list-item"><button${attr_class("menu-list-header", void 0, {
                "menu-list-header--active": store_get($$store_subs ??= {}, "$listVisibility", listVisibility)[list.id]
              })}><span class="menu-list-color"${attr_style(`background-color: ${stringify(list.color)}`)}></span> <span class="menu-list-name">${escape_html(list.name)}</span> <span class="menu-list-count">${escape_html(list.places.length)}</span></button> `);
              if (list.places.length > 0) {
                $$renderer2.push("<!--[0-->");
                $$renderer2.push(`<div class="menu-list-places"><!--[-->`);
                const each_array_2 = ensure_array_like(list.places);
                for (let $$index = 0, $$length3 = each_array_2.length; $$index < $$length3; $$index++) {
                  let place = each_array_2[$$index];
                  $$renderer2.push(`<button class="menu-place-item">${escape_html(place.name)}</button>`);
                }
                $$renderer2.push(`<!--]--></div>`);
              } else {
                $$renderer2.push("<!--[-1-->");
              }
              $$renderer2.push(`<!--]--></div>`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        } else if (section.id === "maps") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<div class="menu-maps-list"><a href="https://diegonmarcos.github.io/maps" class="menu-map-item" target="_blank" rel="noopener noreferrer"><span class="menu-map-icon">🏠</span> <span class="menu-map-name">Home</span></a> <!--[-->`);
          const each_array_3 = ensure_array_like(mapProjections);
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let projection = each_array_3[$$index_2];
            $$renderer2.push(`<a${attr("href", `/maps/?projection=${stringify(projection.id)}`)} class="menu-map-item"><span class="menu-map-icon">${escape_html(projection.icon)}</span> <span class="menu-map-name">${escape_html(projection.name)}</span></a>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else if (section.id === "chronology") {
          $$renderer2.push("<!--[2-->");
          $$renderer2.push(`<div class="menu-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <p>No location history</p> <span>Your visited places will appear here</span></div>`);
        } else if (section.id === "mytrips") {
          $$renderer2.push("<!--[3-->");
          $$renderer2.push(`<div class="menu-maps-list"><!--[-->`);
          const each_array_4 = ensure_array_like(tripPages);
          for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
            let trip = each_array_4[$$index_3];
            $$renderer2.push(`<a${attr("href", `https://diegonmarcos.github.io/mymaps-mytrips${stringify(trip.path || "/")}${stringify(trip.hash || "")}`)} class="menu-map-item" target="_blank" rel="noopener noreferrer"><span class="menu-map-icon">${escape_html(trip.icon)}</span> <span class="menu-map-name">${escape_html(trip.label)}</span></a>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <div class="side-menu-footer"><a href="/maps/" class="menu-footer-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span>Classic Maps</span></a> <a${attr("href", `${stringify(base)}/settings`)} class="menu-footer-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> <span>Settings</span></a></div></nav>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>My Maps</title>`);
      });
    });
    $$renderer2.push(`<div id="app"><div class="app-map">`);
    if (store_get($$store_subs ??= {}, "$mapEngine", mapEngine) === "cesium") {
      $$renderer2.push("<!--[0-->");
      CesiumCanvas($$renderer2);
    } else {
      $$renderer2.push("<!--[-1-->");
      MapCanvas($$renderer2);
    }
    $$renderer2.push(`<!--]--></div> <div${attr_class("starfield", void 0, {
      "starfield--visible": store_get($$store_subs ??= {}, "$isGlobeView", isGlobeView)
    })}></div> <div class="app-ui">`);
    SideMenu($$renderer2);
    $$renderer2.push(`<!----> `);
    SearchBar($$renderer2);
    $$renderer2.push(`<!----> `);
    MapControls($$renderer2);
    $$renderer2.push(`<!----> `);
    PlacePanel($$renderer2);
    $$renderer2.push(`<!----> `);
    DirectionsPanel($$renderer2);
    $$renderer2.push(`<!----> `);
    LayersPanel($$renderer2);
    $$renderer2.push(`<!----></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
