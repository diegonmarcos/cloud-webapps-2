import { h as head, c as attr, s as store_get, a as ensure_array_like, b as attr_class, e as escape_html, i as stringify, u as unsubscribe_stores } from "../../../chunks/index.js";
import { b as base } from "../../../chunks/server.js";
import "../../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import { h as hasPremiumFeatures, a as apiConfig, c as capabilities } from "../../../chunks/configStore.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const apiFields = [
      {
        category: "tiles",
        title: "Map Tiles",
        providers: [
          {
            id: "stadia",
            name: "Stadia Maps",
            description: "Premium vector tile styles"
          },
          {
            id: "mapbox",
            name: "Mapbox",
            description: "Satellite, terrain, and vector tiles"
          },
          {
            id: "maptiler",
            name: "MapTiler",
            description: "High-quality satellite imagery"
          }
        ]
      },
      {
        category: "geocoding",
        title: "Geocoding",
        providers: [
          {
            id: "google",
            name: "Google Maps",
            description: "Premium address search"
          },
          {
            id: "mapbox",
            name: "Mapbox",
            description: "Fast geocoding with autocomplete"
          }
        ]
      },
      {
        category: "places",
        title: "Place Details",
        providers: [
          {
            id: "foursquare",
            name: "Foursquare",
            description: "Photos, tips, and categories"
          },
          {
            id: "google",
            name: "Google Places",
            description: "Reviews, photos, and business hours"
          },
          {
            id: "yelp",
            name: "Yelp",
            description: "Business reviews and ratings"
          }
        ]
      },
      {
        category: "routing",
        title: "Routing",
        providers: [
          {
            id: "google",
            name: "Google Maps",
            description: "Transit routing and traffic"
          },
          {
            id: "mapbox",
            name: "Mapbox",
            description: "Premium routing with traffic"
          }
        ]
      }
    ];
    const capabilityItems = [
      {
        key: "search.categories",
        label: "Category Filtering",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).search.categories
      },
      {
        key: "places.photos",
        label: "Place Photos",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).places.photos
      },
      {
        key: "places.reviews",
        label: "Reviews",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).places.reviews
      },
      {
        key: "places.hours",
        label: "Business Hours",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).places.hours
      },
      {
        key: "routing.transit",
        label: "Transit Routing",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).routing.transit
      },
      {
        key: "tiles.satellite",
        label: "Satellite View",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).tiles.satellite
      },
      {
        key: "tiles.terrain",
        label: "Terrain View",
        check: () => store_get($$store_subs ??= {}, "$capabilities", capabilities).tiles.terrain
      }
    ];
    head("1i19ct2", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Settings - My Maps</title>`);
      });
    });
    $$renderer2.push(`<div class="settings-page"><div class="settings-header"><a${attr("href", `${stringify(base)}/`)} class="back-button" aria-label="Back to map"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></a> <h1 class="settings-title">Settings</h1></div> <div class="settings-panel glass-panel"><div class="settings-section"><h2 class="settings-section-title">Available Features</h2> <p class="settings-description">`);
    if (store_get($$store_subs ??= {}, "$hasPremiumFeatures", hasPremiumFeatures)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`Premium features are enabled based on your API keys.`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`Using free providers only. Add API keys to unlock premium features.`);
    }
    $$renderer2.push(`<!--]--></p> <div class="capabilities-list"><!--[-->`);
    const each_array = ensure_array_like(capabilityItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<div${attr_class("capability-item", void 0, {
        "capability-item--enabled": item.check(),
        "capability-item--disabled": !item.check()
      })}><svg viewBox="0 0 24 24" fill="currentColor" class="capability-icon">`);
      if (item.check()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>`);
      }
      $$renderer2.push(`<!--]--></svg> <span>${escape_html(item.label)}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="glass-divider"></div> <!--[-->`);
    const each_array_1 = ensure_array_like(apiFields);
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let section = each_array_1[$$index_2];
      $$renderer2.push(`<div class="settings-section"><h2 class="settings-section-title">${escape_html(section.title)}</h2> <!--[-->`);
      const each_array_2 = ensure_array_like(section.providers);
      for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
        let provider = each_array_2[$$index_1];
        const categoryKeys = store_get($$store_subs ??= {}, "$apiConfig", apiConfig)[section.category].keys;
        const currentKey = categoryKeys[provider.id];
        $$renderer2.push(`<div class="api-key-input"><label${attr("for", `${stringify(section.category)}-${stringify(provider.id)}`)}>${escape_html(provider.name)}</label> <div class="api-key-input-row"><input type="password"${attr("id", `${stringify(section.category)}-${stringify(provider.id)}`)} class="glass-input"${attr("placeholder", provider.description)}${attr("value", currentKey || "")}/> `);
        if (currentKey) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="api-key-status api-key-status--active"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg> Active</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="glass-divider"></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="settings-section"><h2 class="settings-section-title">Reset</h2> <button class="glass-button">Reset to Defaults</button></div></div> <div class="settings-panel settings-panel--info glass-panel"><div class="settings-section"><h2 class="settings-section-title">About</h2> <p class="settings-description">My Maps uses a multi-provider architecture. Free providers (OpenStreetMap, OSRM)
        are always available. Premium providers unlock additional features like photos,
        reviews, and satellite imagery.</p> <p class="settings-description settings-description--spaced">API keys are stored locally in your browser and never sent to any server except
        the respective API providers.</p></div></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
