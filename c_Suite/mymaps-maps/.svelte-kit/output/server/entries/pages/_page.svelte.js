import { s as ssr_context, a as attr_style, b as attr_class, c as attr, e as ensure_array_like, d as store_get, f as escape_html, u as unsubscribe_stores, h as head } from "../../chunks/root.js";
import { d as derived, w as writable } from "../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "topojson-client";
import * as d3Geo from "d3-geo";
import "clsx";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const projections = [
  {
    id: "orthographic",
    name: "Globe",
    description: "3D spherical view",
    preserves: "True shape (no distortion)",
    factory: () => d3Geo.geoOrthographic()
  },
  {
    id: "mercator",
    name: "Mercator",
    description: "Standard web map",
    preserves: "Angles & shapes",
    factory: () => d3Geo.geoMercator()
  },
  {
    id: "equalEarth",
    name: "Equal Earth",
    description: "Modern equal-area",
    preserves: "Area (sizes)",
    factory: () => d3Geo.geoEqualEarth()
  },
  {
    id: "naturalEarth1",
    name: "Natural Earth",
    description: "Balanced compromise",
    preserves: "Nothing perfectly",
    factory: () => d3Geo.geoNaturalEarth1()
  },
  {
    id: "equirectangular",
    name: "Plate Carrée",
    description: "Simple lat/lon grid",
    preserves: "Distances on meridians",
    factory: () => d3Geo.geoEquirectangular()
  }
];
const currentProjectionType = writable("orthographic");
const autoRotate = writable(true);
const currentProjectionConfig = derived(
  currentProjectionType,
  ($type) => projections.find((p) => p.id === $type) || projections[0]
);
const isGlobe = derived(
  currentProjectionType,
  ($type) => $type === "orthographic"
);
function GlobeCanvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div class="canvas-container"><canvas${attr_style(`cursor: ${"grab"}; touch-action: none;`)}></canvas></div>`);
  });
}
function StellariumCanvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="stellarium-container svelte-1n68bue"><canvas class="svelte-1n68bue"></canvas> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="overlay svelte-1n68bue">Loading sky…</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
const mapCategories = [
  {
    id: "cultural",
    name: "Cultural Maps",
    description: "Languages, religions, and civilizations",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    maps: [
      { id: "languages", name: "World Languages", description: "Language families and distribution" },
      { id: "religions", name: "World Religions", description: "Major religions by region" },
      { id: "ethnicities", name: "Ethnic Groups", description: "Major ethnic distributions" },
      { id: "alphabets", name: "Writing Systems", description: "Scripts and alphabets worldwide" },
      { id: "civilizations", name: "Historical Civilizations", description: "Ancient empires and kingdoms" }
    ]
  },
  {
    id: "language",
    name: "Language Maps",
    description: "Linguistic families and dialects",
    icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
    maps: [
      { id: "indo-european", name: "Indo-European", description: "IE language family tree" },
      { id: "sino-tibetan", name: "Sino-Tibetan", description: "Chinese and Tibetan languages" },
      { id: "afroasiatic", name: "Afroasiatic", description: "Semitic, Berber, Cushitic" },
      { id: "niger-congo", name: "Niger-Congo", description: "Bantu and West African" },
      { id: "austronesian", name: "Austronesian", description: "Pacific and Southeast Asian" },
      { id: "endangered", name: "Endangered Languages", description: "Languages at risk of extinction" }
    ]
  },
  {
    id: "terrain",
    name: "Terrain Maps",
    description: "Physical geography and landforms",
    icon: "M3 17l6-6 4 4 8-8M14 7h7v7",
    maps: [
      { id: "elevation", name: "Elevation", description: "Global topography and relief" },
      { id: "mountains", name: "Mountain Ranges", description: "Major peaks and ranges" },
      { id: "rivers", name: "River Systems", description: "Major rivers and watersheds" },
      { id: "deserts", name: "Deserts", description: "Arid regions worldwide" },
      { id: "forests", name: "Forests", description: "Forest types and coverage" },
      { id: "tectonic", name: "Tectonic Plates", description: "Plate boundaries and activity" }
    ]
  },
  {
    id: "climate",
    name: "Climate Maps",
    description: "Weather patterns and climate zones",
    icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
    maps: [
      { id: "koppen", name: "Köppen Climate", description: "Climate classification zones" },
      { id: "temperature", name: "Temperature", description: "Average temperatures" },
      { id: "precipitation", name: "Precipitation", description: "Rainfall and snowfall" },
      { id: "ocean-currents", name: "Ocean Currents", description: "Major ocean circulation" },
      { id: "wind-patterns", name: "Wind Patterns", description: "Trade winds and jet streams" }
    ]
  },
  {
    id: "political",
    name: "Political Maps",
    description: "Countries, borders, and governance",
    icon: "M3 21V3h18v18H3zM9 3v18M3 9h18M3 15h18",
    maps: [
      { id: "countries", name: "Countries", description: "Current national boundaries" },
      { id: "territories", name: "Territories", description: "Dependencies and disputed areas" },
      { id: "capitals", name: "Capital Cities", description: "National capitals" },
      { id: "timezones", name: "Time Zones", description: "Global time zone divisions" },
      { id: "historical-borders", name: "Historical Borders", description: "Borders through history" }
    ]
  },
  {
    id: "population",
    name: "Population Maps",
    description: "Demographics and human settlement",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    maps: [
      { id: "density", name: "Population Density", description: "People per square km" },
      { id: "cities", name: "Major Cities", description: "Urban centers by population" },
      { id: "growth", name: "Population Growth", description: "Growth rates by country" },
      { id: "migration", name: "Migration Patterns", description: "Human movement flows" },
      { id: "urbanization", name: "Urbanization", description: "Urban vs rural populations" }
    ]
  },
  {
    id: "economic",
    name: "Economic Maps",
    description: "Trade, resources, and development",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    maps: [
      { id: "gdp", name: "GDP by Country", description: "Gross domestic product" },
      { id: "trade-routes", name: "Trade Routes", description: "Major shipping lanes" },
      { id: "resources", name: "Natural Resources", description: "Oil, gas, minerals" },
      { id: "agriculture", name: "Agriculture", description: "Farming and crops" },
      { id: "internet", name: "Internet Connectivity", description: "Global internet access" }
    ]
  },
  {
    id: "historical",
    name: "Historical Maps",
    description: "Maps through time",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    maps: [
      { id: "ancient-world", name: "Ancient World (3000 BCE)", description: "Early civilizations" },
      { id: "roman-empire", name: "Roman Empire (117 CE)", description: "Maximum extent" },
      { id: "medieval", name: "Medieval World (1200 CE)", description: "Kingdoms and empires" },
      { id: "colonial", name: "Colonial Era (1914)", description: "European empires" },
      { id: "cold-war", name: "Cold War (1960)", description: "East vs West" },
      { id: "world-wars", name: "World War Fronts", description: "WWI and WWII" }
    ]
  },
  {
    id: "environmental",
    name: "Environmental Maps",
    description: "Ecosystems and conservation",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    maps: [
      { id: "biomes", name: "Biomes", description: "Major ecosystem types" },
      { id: "protected-areas", name: "Protected Areas", description: "National parks and reserves" },
      { id: "deforestation", name: "Deforestation", description: "Forest loss over time" },
      { id: "biodiversity", name: "Biodiversity Hotspots", description: "Species-rich regions" },
      { id: "pollution", name: "Air Quality", description: "Global pollution levels" }
    ]
  }
];
const selectedCategory = writable(null);
const selectedMap = writable(null);
function SideMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isOpen = false;
    $$renderer2.push(`<button${attr_class("menu-toggle", void 0, { "menu-toggle--open": isOpen })}${attr("aria-label", "Open menu")}${attr("aria-expanded", isOpen)}><span class="menu-toggle-bar"></span> <span class="menu-toggle-bar"></span> <span class="menu-toggle-bar"></span></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <nav${attr_class("side-menu", void 0, { "side-menu--open": isOpen })} aria-label="Map categories"><div class="side-menu-header"><h2 class="side-menu-title">Maps</h2> <span class="side-menu-subtitle">Geographic Visualization</span></div> <div class="side-menu-content"><a href="/mymaps" class="menu-link" data-sveltekit-reload=""><div class="menu-link-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div> <div class="menu-link-info"><span class="menu-link-name">MyMaps</span> <span class="menu-link-desc">Interactive map explorer</span></div> <svg class="menu-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg></a> <div class="menu-divider"></div> <!--[-->`);
    const each_array = ensure_array_like(mapCategories);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let category = each_array[$$index_1];
      $$renderer2.push(`<div class="menu-category"><button${attr_class("menu-category-header", void 0, {
        "menu-category-header--active": store_get($$store_subs ??= {}, "$selectedCategory", selectedCategory) === category.id
      })}><div class="menu-category-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path${attr("d", category.icon)}></path></svg></div> <div class="menu-category-info"><span class="menu-category-name">${escape_html(category.name)}</span> <span class="menu-category-desc">${escape_html(category.description)}</span></div> <svg${attr_class("menu-category-chevron", void 0, {
        "menu-category-chevron--open": store_get($$store_subs ??= {}, "$selectedCategory", selectedCategory) === category.id
      })} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      if (store_get($$store_subs ??= {}, "$selectedCategory", selectedCategory) === category.id) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="menu-category-content"><!--[-->`);
        const each_array_1 = ensure_array_like(category.maps);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let map = each_array_1[$$index];
          $$renderer2.push(`<button${attr_class("menu-map-item", void 0, {
            "menu-map-item--active": store_get($$store_subs ??= {}, "$selectedMap", selectedMap) === map.id
          })}><span class="menu-map-name">${escape_html(map.name)}</span> <span class="menu-map-desc">${escape_html(map.description)}</span></button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="side-menu-footer"><span class="footer-text">d3-geo visualization</span></div></nav>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const viewMode = writable("map");
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let showProjectionList = false;
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Maps - ${escape_html(store_get($$store_subs ??= {}, "$currentProjectionConfig", currentProjectionConfig).name)} View</title>`);
      });
    });
    if (store_get($$store_subs ??= {}, "$viewMode", viewMode) === "sky") {
      $$renderer2.push("<!--[0-->");
      StellariumCanvas($$renderer2);
    } else {
      $$renderer2.push("<!--[-1-->");
      GlobeCanvas($$renderer2);
    }
    $$renderer2.push(`<!--]--> `);
    SideMenu($$renderer2);
    $$renderer2.push(`<!----> <div class="controls"><div class="control-group"><button class="control-btn" title="Zoom in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button> <button class="control-btn" title="Zoom out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button> <button class="control-btn" title="Reset view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></button></div> `);
    if (store_get($$store_subs ??= {}, "$isGlobe", isGlobe)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="control-group"><button${attr_class("control-btn", void 0, {
        "active": store_get($$store_subs ??= {}, "$autoRotate", autoRotate)
      })}${attr("title", store_get($$store_subs ??= {}, "$autoRotate", autoRotate) ? "Stop rotation" : "Auto-rotate")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg></button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="control-group"><button class="control-btn"${attr("title", store_get($$store_subs ??= {}, "$viewMode", viewMode) === "map" ? "Switch to sky view" : "Switch to map view")}>${escape_html(store_get($$store_subs ??= {}, "$viewMode", viewMode) === "map" ? "🌍" : "✨")}</button></div> <div class="control-group"><button${attr_class("control-btn", void 0, { "active": showProjectionList })} title="Change projection"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="info-panel"><h2 class="info-title">${escape_html(store_get($$store_subs ??= {}, "$currentProjectionConfig", currentProjectionConfig).name)}</h2> <p class="info-subtitle">${escape_html(store_get($$store_subs ??= {}, "$currentProjectionConfig", currentProjectionConfig).description)}<br/> <strong>Preserves:</strong> ${escape_html(store_get($$store_subs ??= {}, "$currentProjectionConfig", currentProjectionConfig).preserves)}</p></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
