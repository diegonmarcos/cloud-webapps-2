# MyMaps Architecture

> **Project:** Self-hosted Google Maps alternative
> **Type:** Type 2 (Browser Tool)
> **Framework:** SvelteKit 5 + MapLibre GL JS
> **Port:** :8018
> **Base:** /mymaps (production)

## Overview

MyMaps is a feature-rich map application with a modular multi-provider API system.
It uses free providers by default (OSM, OSRM) and can unlock premium features with API keys.

## Tech Stack

- **Framework:** SvelteKit 5 (Svelte 5 Runes)
- **Map Engine:** MapLibre GL JS
- **Styling:** Sass (ITCSS methodology)
- **Design:** Glassmorphism dark theme
- **Build:** Vite + adapter-static

## Multi-Provider Architecture

### Free Providers (No API Key)

| Provider | Service | Features |
|----------|---------|----------|
| CARTO | Tiles | Vector basemaps (dark, light, voyager) |
| Nominatim | Geocoding | Address search, reverse geocoding |
| Photon | Geocoding | Fast autocomplete |
| Overpass | Places | Full OSM POI data |
| OSRM | Routing | Walking, cycling, driving |

### Premium Providers (API Key Required)

| Provider | Services | Features Added |
|----------|----------|----------------|
| Stadia | Tiles | Premium vector styles |
| MapTiler | Tiles | Satellite, terrain |
| Mapbox | All | Everything premium |
| Foursquare | Places | Photos, tips, categories |
| Google | All | Reviews, transit, traffic |
| Yelp | Places | Business reviews |

## Component Structure

```
src/lib/
├── components/
│   ├── Map/
│   │   ├── MapCanvas.svelte      # MapLibre GL wrapper
│   │   └── MapControls.svelte    # Zoom, compass, geolocation
│   ├── Search/
│   │   ├── SearchBar.svelte      # Autocomplete input
│   │   └── SearchResults.svelte  # Result list
│   ├── Panels/
│   │   ├── PlacePanel.svelte     # POI details
│   │   ├── DirectionsPanel.svelte
│   │   └── LayersPanel.svelte
│   └── UI/
│       ├── ProviderBadge.svelte
│       └── LoadingSpinner.svelte
├── stores/
│   ├── configStore.ts    # API keys (localStorage)
│   ├── mapStore.ts       # Map state
│   ├── searchStore.ts    # Search/results
│   ├── routeStore.ts     # Directions
│   └── layerStore.ts     # Custom layers
└── services/
    ├── api/
    │   ├── index.ts         # API orchestrator
    │   ├── types.ts         # TypeScript types
    │   └── capabilities.ts  # Feature detection
    ├── providers/
    │   ├── geocoding/
    │   │   ├── nominatim.ts
    │   │   └── photon.ts
    │   ├── routing/
    │   │   └── osrm.ts
    │   └── places/
    │       └── overpass.ts
    └── layers/
        └── kml.ts           # KML/KMZ parser
```

## Data Flow

1. User enters search query
2. SearchBar debounces input (300ms)
3. API orchestrator queries all configured providers in parallel
4. Results are deduped and ranked
5. User selects result → map flies to location
6. Optional: Get directions, view place details

## State Management

- **API Config:** Persisted to localStorage
- **Map State:** Synced to URL hash (#map=zoom/lat/lng)
- **Search:** In-memory with recent searches persisted
- **Layers:** Metadata persisted, data loaded on demand

## Styling

Uses ITCSS methodology with Sass:

```
styles/
├── abstracts/     # Variables, mixins
├── base/          # Reset, typography
├── components/    # Glass panels, buttons
└── layout/        # App structure
```

Key design tokens:
- Glass blur: 12px
- Border radius: 16px
- Primary color: #3b82f6
- Background: #0a0a0a

## Build & Deploy

```bash
# Development
npm run dev          # localhost:8018

# Production
npm run build        # → dist/
./1.ops/build.sh build

# Deploy to GitHub Pages via CI/CD
```

## Future Enhancements (Phase 2)

- Self-hosted backend on oci-p-flex_1
- PostGIS + Martin tile server
- Meilisearch for instant search
- Axum API for business logic
