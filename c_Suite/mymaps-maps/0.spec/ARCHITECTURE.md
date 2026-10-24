# Maps - Geographic Data Visualization

> **Project:** d3-geo based map projection explorer
> **Type:** Type 2 (Browser Tool)
> **Framework:** SvelteKit 5 + d3-geo
> **Port:** :8014
> **Base:** /maps (production)

## Overview

Maps is a geographic visualization tool built with d3-geo, designed to showcase different map projections and their properties. Unlike tile-based maps (MapLibre, Leaflet), this renders geography directly using Canvas, allowing for any projection.

## Tech Stack

- **Framework:** SvelteKit 5 (Svelte 5 Runes)
- **Renderer:** d3-geo (Canvas-based)
- **Data Format:** TopoJSON (world-atlas)
- **Styling:** Sass (ITCSS methodology)
- **Build:** Vite + adapter-static

## Available Projections

| Projection | Type | Preserves | Best For |
|------------|------|-----------|----------|
| **Orthographic** | Azimuthal | True shape (sphere) | Globe view, space perspective |
| **Mercator** | Cylindrical | Angles & shapes | Navigation, web maps |
| **Equal Earth** | Pseudocylindrical | Area (sizes) | Thematic maps, comparisons |
| **Natural Earth** | Pseudocylindrical | Nothing perfectly | General world maps |
| **Plate Carrée** | Cylindrical | Distances on meridians | Simple reference |

## Features

- **Interactive Globe:** Drag to rotate, scroll to zoom
- **Auto-rotation:** Smooth spinning globe animation
- **Projection Switching:** Instant transitions between views
- **Graticule Grid:** Lat/lon reference lines
- **Atmosphere Effect:** Subtle glow around globe
- **Responsive Canvas:** Adapts to window size

## Component Structure

```
src/lib/
├── components/
│   └── GlobeCanvas.svelte    # Main d3-geo Canvas renderer
├── stores/
│   └── projectionStore.ts    # Projection state & config
└── ...
```

## Data Flow

1. TopoJSON world data loaded from CDN
2. d3-geo projection created based on current type
3. Canvas path generator renders land, borders, graticule
4. Mouse/touch events update rotation for globe view
5. Projection changes trigger full re-render

## Comparison with MyMaps

| Feature | Maps (d3-geo) | MyMaps (MapLibre) |
|---------|---------------|-------------------|
| Projections | 100+ possible | 2 (mercator, globe) |
| Tiles | None | Vector/raster |
| Street data | No | Yes |
| POI search | No | Yes |
| Custom data viz | Excellent | Limited |
| Offline | Yes (after load) | Needs tiles |

## Use Cases

- **Education:** Teaching map projections
- **Data Journalism:** Custom choropleth maps
- **Visualization:** Flight paths, migration patterns
- **Art:** Creative cartographic designs

## Build & Deploy

```bash
# Development
npm run dev          # localhost:8014

# Production
npm run build        # → dist/
./1.ops/build.sh build

# Deploy to GitHub Pages via CI/CD
```

## Related Projects

- **MyMaps** (`/mymaps`) - Full-featured tile-based map application
- This project focuses on projection visualization, not navigation
