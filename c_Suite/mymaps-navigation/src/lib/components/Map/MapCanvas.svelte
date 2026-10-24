<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import type { Map as MapLibreMap } from 'maplibre-gl';
  import {
    mapStore,
    currentStyle,
    setMapInstance,
    userLocation,
    isGlobeView,
    is3DTerrain,
    isTerrainLayer,
    isSatelliteLayer
  } from '$lib/stores/mapStore';
  import { encodeMapState, updateUrl, decodeMapState, getCurrentHash } from '$lib/utils/urlState';
  import { throttle } from '$lib/utils/debounce';
  import { quickSearch, quickSearchCategories, placeLists, listVisibility } from '$lib/stores/placeListsStore';
  import type { QuickSearchPin, PlaceList } from '$lib/stores/placeListsStore';

  let mapContainer: HTMLDivElement;
  let map: MapLibreMap | null = null;

  // Globe auto-rotation state
  let isSpinning = $state(true);
  let spinAnimationId: number | null = null;
  const spinSpeed = 0.3; // degrees per frame (~18 deg/sec at 60fps)

  // Sync map state to URL (throttled)
  const syncToUrl = throttle(() => {
    if (map) {
      const center = map.getCenter();
      const state = {
        center: [center.lng, center.lat] as [number, number],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };
      updateUrl(encodeMapState(state));
      mapStore.syncFromMap(map);
    }
  }, 500);

  onMount(() => {
    // Check for state in URL
    const hash = getCurrentHash();
    const urlState = decodeMapState(hash);

    // Get initial state from URL or store
    let initialState = $mapStore;
    if (urlState) {
      initialState = { ...initialState, ...urlState };
    }

    // Create map
    // - Two-finger scroll = ZOOM (native, fast)
    // - Ctrl + two-finger scroll = PAN
    const mapOptions: maplibregl.MapOptions = {
      container: mapContainer,
      style: $currentStyle.url,
      center: initialState.center,
      zoom: initialState.zoom,
      bearing: initialState.bearing,
      pitch: $isGlobeView ? 45 : initialState.pitch,
      attributionControl: false,
      maxZoom: 20,
      minZoom: 1,
      scrollZoom: true,   // Native fast zoom
      dragPan: true       // Normal drag pan
    };

    console.log('[GLOBE DEBUG] Creating map with options:', mapOptions);
    map = new maplibregl.Map(mapOptions);

    // Intercept Ctrl+scroll for panning instead of zoom
    const handleWheel = (e: WheelEvent) => {
      if (!map || !e.ctrlKey) return;

      // Ctrl is pressed - pan instead of zoom
      e.preventDefault();
      e.stopPropagation();
      map.panBy([-e.deltaX * 2, -e.deltaY * 2], { duration: 0 });
    };

    mapContainer.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    const cleanupGestures = () => {
      mapContainer.removeEventListener('wheel', handleWheel, { capture: true });
    };

    // Add attribution in corner
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    // Store reference
    setMapInstance(map);

    // Sync state on move
    map.on('moveend', syncToUrl);

    // Stop spinning on any user interaction
    const stopSpinning = () => {
      if (isSpinning) {
        isSpinning = false;
        if (spinAnimationId !== null) {
          cancelAnimationFrame(spinAnimationId);
          spinAnimationId = null;
        }
        console.log('[GLOBE] Stopped spinning due to user interaction');
      }
    };

    // Listen for user interactions that should stop the spin
    map.on('mousedown', stopSpinning);
    map.on('touchstart', stopSpinning);
    map.on('wheel', stopSpinning);
    map.on('dragstart', stopSpinning);

    // Start globe spinning animation
    const spinGlobe = () => {
      if (!map || !isSpinning || !$isGlobeView) return;

      const center = map.getCenter();
      center.lng += spinSpeed;

      // Wrap longitude
      if (center.lng > 180) center.lng -= 360;

      map.setCenter(center);
      spinAnimationId = requestAnimationFrame(spinGlobe);
    };

    // Set loaded flag, apply globe projection, terrain, and add 3D buildings when style loads
    map.on('style.load', () => {
      mapLoaded = true;

      // Apply globe projection if enabled (must be done after style loads)
      if ($isGlobeView && map) {
        console.log('[GLOBE DEBUG] Applying initial globe projection');
        map.setProjection({ type: 'globe' });

        // Apply optimal zoom for globe view on first load (if no URL state)
        if (!urlState) {
          const optimalZoom = getOptimalGlobeZoom();
          map.jumpTo({
            center: [0, 20],
            zoom: optimalZoom,
            pitch: 45
          });

          // Start spinning animation (only on fresh load without URL state)
          if (isSpinning) {
            console.log('[GLOBE] Starting spin animation');
            spinGlobe();
          }
        } else {
          // Don't spin if loading from URL state (user navigated here intentionally)
          isSpinning = false;
        }
      } else {
        // Don't spin if not in globe view
        isSpinning = false;
      }

      // Add satellite layer if enabled
      if ($isSatelliteLayer) {
        addSatelliteLayer();
      }

      // Add terrain layer (hillshade) if enabled
      if ($isTerrainLayer) {
        addHillshadeLayer();
      }

      // Add 3D terrain and buildings if enabled
      if ($is3DTerrain) {
        enable3DTerrain();
      }
    });

    // Handle user location updates
    const unsubLocation = userLocation.subscribe((loc) => {
      if (loc && map) {
        updateUserMarker(loc);
      }
    });

    return () => {
      unsubLocation();
      cleanupGestures();
      // Stop spin animation
      if (spinAnimationId !== null) {
        cancelAnimationFrame(spinAnimationId);
        spinAnimationId = null;
      }
    };
  });

  onDestroy(() => {
    // Stop spin animation on destroy
    if (spinAnimationId !== null) {
      cancelAnimationFrame(spinAnimationId);
      spinAnimationId = null;
    }
    if (map) {
      map.remove();
      setMapInstance(null);
    }
  });

  // Add 3D building extrusions
  function add3DBuildings() {
    if (!map) return;

    // Check if already exists
    if (map.getLayer('3d-buildings')) return;

    // Check if building layer exists
    const layers = map.getStyle().layers || [];
    const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && (layer.layout as Record<string, unknown>)?.['text-field']
    )?.id;

    // Add 3D building layer if source exists
    const sources = map.getStyle().sources || {};
    if (sources['carto'] || sources['openmaptiles']) {
      const sourceId = sources['carto'] ? 'carto' : 'openmaptiles';

      map.addLayer(
        {
          id: '3d-buildings',
          source: sourceId,
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#1a1a2e',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.7
          }
        },
        labelLayerId
      );
      console.log('[3D] Buildings layer added');
    }
  }

  // Remove 3D building extrusions
  function remove3DBuildings() {
    if (!map) return;

    try {
      if (map.getLayer('3d-buildings')) {
        map.removeLayer('3d-buildings');
        console.log('[3D] Buildings layer removed');
      }
    } catch (e) {
      console.error('[3D] Failed to remove buildings layer:', e);
    }
  }

  // Add terrain DEM source (shared by hillshade and 3D)
  function addTerrainSource() {
    if (!map || map.getSource('terrain-dem')) return;

    try {
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium'
      });
      console.log('[TERRAIN] DEM source added');
    } catch (e) {
      console.error('[TERRAIN] Failed to add DEM source:', e);
    }
  }

  // Add hillshade layer for 2D terrain visualization
  function addHillshadeLayer() {
    if (!map) return;

    // Ensure source exists
    addTerrainSource();

    // Check if layer already exists
    if (map.getLayer('hillshade-layer')) return;

    try {
      map.addLayer({
        id: 'hillshade-layer',
        type: 'hillshade',
        source: 'terrain-dem',
        paint: {
          'hillshade-exaggeration': 0.5,
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': '#ffffff',
          'hillshade-accent-color': '#000000'
        }
      });
      console.log('[TERRAIN] Hillshade layer added');
    } catch (e) {
      console.error('[TERRAIN] Failed to add hillshade layer:', e);
    }
  }

  // Remove hillshade layer
  function removeHillshadeLayer() {
    if (!map) return;

    try {
      if (map.getLayer('hillshade-layer')) {
        map.removeLayer('hillshade-layer');
        console.log('[TERRAIN] Hillshade layer removed');
      }
    } catch (e) {
      console.error('[TERRAIN] Failed to remove hillshade layer:', e);
    }
  }

  // Enable 3D terrain extrusion and buildings
  function enable3DTerrain() {
    if (!map) return;

    // Ensure source exists
    addTerrainSource();

    try {
      map.setTerrain({
        source: 'terrain-dem',
        exaggeration: 1.5
      });
      // Add 3D buildings
      add3DBuildings();
      // Tilt the map to show 3D effect
      map.easeTo({
        pitch: 60,
        duration: 500
      });
      console.log('[3D] Terrain and buildings enabled with pitch');
    } catch (e) {
      console.error('[3D] Failed to enable 3D:', e);
    }
  }

  // Disable 3D terrain extrusion and buildings
  function disable3DTerrain() {
    if (!map) return;

    try {
      map.setTerrain(null);
      // Remove 3D buildings
      remove3DBuildings();
      // Flatten the map
      map.easeTo({
        pitch: 0,
        duration: 500
      });
      console.log('[3D] Terrain and buildings disabled, pitch reset');
    } catch (e) {
      console.error('[3D] Failed to disable 3D:', e);
    }
  }

  // Add satellite layer (ESRI World Imagery)
  function addSatelliteLayer() {
    if (!map) return;

    // Check if source already exists
    if (map.getSource('satellite')) {
      console.log('[SATELLITE] Source already exists');
      // Just show the layer if it exists
      if (map.getLayer('satellite-layer')) {
        map.setLayoutProperty('satellite-layer', 'visibility', 'visible');
      }
      return;
    }

    try {
      map.addSource('satellite', {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '&copy; Esri'
      });

      // Add layer below labels but above base map
      const layers = map.getStyle().layers || [];
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && (layer.layout as Record<string, unknown>)?.['text-field']
      )?.id;

      map.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        paint: {
          'raster-opacity': 0.85
        }
      }, labelLayerId);

      console.log('[SATELLITE] Layer added');
    } catch (e) {
      console.error('[SATELLITE] Failed to add layer:', e);
    }
  }

  // Remove satellite layer
  function removeSatelliteLayer() {
    if (!map) return;

    try {
      if (map.getLayer('satellite-layer')) {
        map.removeLayer('satellite-layer');
        console.log('[SATELLITE] Layer removed');
      }
      if (map.getSource('satellite')) {
        map.removeSource('satellite');
        console.log('[SATELLITE] Source removed');
      }
    } catch (e) {
      console.error('[SATELLITE] Failed to remove layer:', e);
    }
  }

  // User location marker
  let userMarker: maplibregl.Marker | null = null;

  function updateUserMarker(location: [number, number]) {
    if (!map) return;

    if (userMarker) {
      userMarker.setLngLat(location);
    } else {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'map-marker map-marker--user';

      userMarker = new maplibregl.Marker({ element: el })
        .setLngLat(location)
        .addTo(map);
    }
  }

  // Track if map is loaded
  let mapLoaded = $state(false);

  // Store previous zoom for when exiting globe view
  let preGlobeZoom: number | null = null;

  // Calculate optimal zoom for globe view based on viewport
  function getOptimalGlobeZoom(): number {
    if (!map) return 2.5;
    const container = map.getContainer();
    const minDimension = Math.min(container.clientWidth, container.clientHeight);
    // For globe projection, calculate zoom where globe just fits
    const optimalZoom = Math.log2(minDimension / 180) + 0.7;
    return Math.max(1.8, Math.min(optimalZoom, 4));
  }

  // Helper: Toggle globe projection (MapLibre 5.0+)
  function toggleGlobeProjection(enabled: boolean) {
    console.log('[GLOBE DEBUG] toggleGlobeProjection called with:', enabled);

    if (!map) {
      console.error('[GLOBE DEBUG] No map instance!');
      return;
    }

    try {
      // Use setProjection API (MapLibre 5.0+)
      map.setProjection({ type: enabled ? 'globe' : 'mercator' });
      console.log('[GLOBE DEBUG] setProjection succeeded:', enabled ? 'globe' : 'mercator');

      if (enabled) {
        // Save current zoom and zoom out to show globe centered
        preGlobeZoom = map.getZoom();
        const optimalZoom = getOptimalGlobeZoom();
        map.easeTo({
          center: [0, 20], // Center on Atlantic/Europe area
          zoom: optimalZoom,
          pitch: 45,
          bearing: 0,
          duration: 800
        });
      } else {
        // Restore previous zoom or default
        map.easeTo({
          zoom: preGlobeZoom ?? 5,
          pitch: 0,
          duration: 500
        });
        preGlobeZoom = null;
      }
    } catch (e) {
      console.error('[GLOBE DEBUG] setProjection failed:', e);
    }
  }

  // React to style changes
  $effect(() => {
    const style = $currentStyle;
    if (map && style && mapLoaded) {
      untrack(() => map!.setStyle(style.url));
    }
  });

  // React to globe view toggle
  $effect(() => {
    const globeEnabled = $isGlobeView;
    if (map && mapLoaded) {
      console.log('[GLOBE DEBUG] $effect: toggling globe to', globeEnabled);
      untrack(() => toggleGlobeProjection(globeEnabled));
    }
  });

  // React to terrain layer (hillshade) toggle
  $effect(() => {
    const layerEnabled = $isTerrainLayer;
    console.log('[TERRAIN DEBUG] $effect triggered, layerEnabled=', layerEnabled, 'map=', !!map, 'mapLoaded=', mapLoaded);
    if (map && mapLoaded) {
      console.log('[TERRAIN DEBUG] Calling hillshade function for:', layerEnabled);
      untrack(() => {
        if (layerEnabled) {
          addHillshadeLayer();
        } else {
          removeHillshadeLayer();
        }
      });
    }
  });

  // React to 3D terrain toggle
  $effect(() => {
    const terrainEnabled = $is3DTerrain;
    if (map && mapLoaded) {
      console.log('[TERRAIN] $effect: toggling 3D terrain to', terrainEnabled);
      untrack(() => {
        if (terrainEnabled) {
          enable3DTerrain();
        } else {
          disable3DTerrain();
        }
      });
    }
  });

  // React to satellite layer toggle
  $effect(() => {
    const satelliteEnabled = $isSatelliteLayer;
    if (map && mapLoaded) {
      console.log('[SATELLITE] $effect: toggling satellite to', satelliteEnabled);
      untrack(() => {
        if (satelliteEnabled) {
          addSatelliteLayer();
        } else {
          removeSatelliteLayer();
        }
      });
    }
  });

  // ============================================
  // QUICK SEARCH PINS
  // ============================================

  const quickSearchMarkers = new Map<string, maplibregl.Marker>();

  function createQuickSearchMarker(pin: QuickSearchPin): maplibregl.Marker {
    const category = quickSearchCategories.find(c => c.id === pin.categoryId);
    const emoji = category?.emoji || '📍';

    const el = document.createElement('div');
    el.className = 'map-marker map-marker--quick';
    el.innerHTML = `<span class="quick-marker-emoji">${emoji}</span>`;
    el.title = pin.name;

    return new maplibregl.Marker({ element: el })
      .setLngLat(pin.coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <strong>${emoji} ${pin.name}</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${pin.address}</p>
        </div>
      `));
  }

  // React to quick search pins changes
  $effect(() => {
    const pins = quickSearch.pins;
    let currentPins: QuickSearchPin[] = [];
    const unsub = pins.subscribe(p => { currentPins = p; });
    unsub();

    if (!map || !mapLoaded) return;

    untrack(() => {
      // Get current pin IDs
      const newPinIds = new Set(currentPins.map(p => p.id));

      // Remove markers that are no longer in pins
      for (const [id, marker] of quickSearchMarkers) {
        if (!newPinIds.has(id)) {
          marker.remove();
          quickSearchMarkers.delete(id);
        }
      }

      // Add new markers
      for (const pin of currentPins) {
        if (!quickSearchMarkers.has(pin.id)) {
          const marker = createQuickSearchMarker(pin);
          marker.addTo(map!);
          quickSearchMarkers.set(pin.id, marker);
        }
      }
    });
  });

  // ============================================
  // LIST MARKERS
  // ============================================

  const listMarkers = new Map<string, maplibregl.Marker>();

  function createListMarker(place: { id: string; name: string; address: string; coordinates: [number, number] }, color: string): maplibregl.Marker {
    const el = document.createElement('div');
    el.className = 'map-marker map-marker--list';
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    `;
    el.title = place.name;

    return new maplibregl.Marker({ element: el })
      .setLngLat(place.coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <strong>${place.name}</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${place.address}</p>
        </div>
      `));
  }

  // React to list visibility and places changes
  $effect(() => {
    const lists = $placeLists;
    const visibility = $listVisibility;

    if (!map || !mapLoaded) return;

    untrack(() => {
      // Collect all visible places
      const visiblePlaces = new Map<string, { place: typeof lists[0]['places'][0]; color: string }>();

      for (const list of lists) {
        if (visibility[list.id]) {
          for (const place of list.places) {
            visiblePlaces.set(place.id, { place, color: list.color });
          }
        }
      }

      // Remove markers that should no longer be visible
      for (const [id, marker] of listMarkers) {
        if (!visiblePlaces.has(id)) {
          marker.remove();
          listMarkers.delete(id);
        }
      }

      // Add new markers
      for (const [id, { place, color }] of visiblePlaces) {
        if (!listMarkers.has(id)) {
          const marker = createListMarker(place, color);
          marker.addTo(map!);
          listMarkers.set(id, marker);
        }
      }
    });
  });
</script>

<div class="map-canvas" bind:this={mapContainer}></div>
