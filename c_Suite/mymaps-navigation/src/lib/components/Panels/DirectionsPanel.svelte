<script lang="ts">
  import {
    routeOrigin,
    routeDestination,
    routeMode,
    routes,
    selectedRoute,
    selectedRouteIndex,
    isCalculatingRoute,
    routeError,
    showDirectionsPanel,
    closeDirections,
    swapEndpoints,
    clearRoute,
    formatDuration,
    formatDistance
  } from '$lib/stores/routeStore';
  import { userLocation, getMapInstance } from '$lib/stores/mapStore';
  import { capabilities } from '$lib/stores/configStore';
  import { reverseGeocode, getDirections } from '$lib/services/api';
  import type { RoutingMode, LngLat } from '$lib/services/api/types';
  import ProviderBadge from '$lib/components/UI/ProviderBadge.svelte';
  import maplibregl from 'maplibre-gl';

  let originInput = $state('');
  let destinationInput = $state('');
  let routeLayer: maplibregl.GeoJSONSource | null = null;

  // Sync inputs with store
  $effect(() => {
    if ($routeOrigin) {
      originInput = $routeOrigin.name;
    }
  });

  $effect(() => {
    if ($routeDestination) {
      destinationInput = $routeDestination.name;
    }
  });

  // Draw route on map when routes change
  $effect(() => {
    if ($selectedRoute) {
      drawRoute($selectedRoute.geometry);
    } else {
      clearRouteLayer();
    }
  });

  async function useMyLocation() {
    if ($userLocation) {
      const result = await reverseGeocode($userLocation);
      if (result) {
        routeOrigin.set({ name: result.name, coordinates: $userLocation });
      } else {
        routeOrigin.set({ name: 'Your location', coordinates: $userLocation });
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords: LngLat = [pos.coords.longitude, pos.coords.latitude];
        userLocation.set(coords);
        const result = await reverseGeocode(coords);
        routeOrigin.set({
          name: result?.name || 'Your location',
          coordinates: coords
        });
      });
    }
  }

  function setMode(mode: RoutingMode) {
    routeMode.set(mode);
    if ($routeOrigin && $routeDestination) {
      calculateRoute();
    }
  }

  async function calculateRoute() {
    if (!$routeOrigin || !$routeDestination) return;

    isCalculatingRoute.set(true);
    routeError.set(null);

    try {
      const result = await getDirections(
        $routeOrigin.coordinates,
        $routeDestination.coordinates,
        $routeMode,
        true
      );
      routes.set(result);
      selectedRouteIndex.set(0);

      // Fit map to route
      if (result.length > 0) {
        fitToRoute(result[0].geometry);
      }
    } catch (error) {
      console.error('Routing failed:', error);
      routeError.set(error instanceof Error ? error.message : 'Routing failed');
      routes.set([]);
    } finally {
      isCalculatingRoute.set(false);
    }
  }

  function fitToRoute(geometry: LngLat[]) {
    const map = getMapInstance();
    if (!map || geometry.length === 0) return;

    const bounds = geometry.reduce(
      (b, coord) => b.extend(coord),
      new maplibregl.LngLatBounds(geometry[0], geometry[0])
    );

    map.fitBounds(bounds, { padding: 80, duration: 1000 });
  }

  function drawRoute(geometry: LngLat[]) {
    const map = getMapInstance();
    if (!map) return;

    const geojson: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: geometry
      }
    };

    if (!map.getSource('route')) {
      map.addSource('route', { type: 'geojson', data: geojson });

      // Outline
      map.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': 'rgba(59, 130, 246, 0.3)',
          'line-width': 8
        }
      });

      // Main line
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });
    } else {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData(geojson);
    }
  }

  function clearRouteLayer() {
    const map = getMapInstance();
    if (!map) return;

    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getLayer('route-outline')) map.removeLayer('route-outline');
    if (map.getSource('route')) map.removeSource('route');
  }

  function handleClose() {
    clearRouteLayer();
    clearRoute();
    closeDirections();
  }

  function handleSwap() {
    swapEndpoints();
    if ($routeOrigin && $routeDestination) {
      calculateRoute();
    }
  }

  // Mode icons
  const modeIcons: Record<RoutingMode, string> = {
    driving: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    walking: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7',
    cycling: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z',
    transit: 'M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z'
  };
</script>

{#if $showDirectionsPanel}
  <div class="directions-panel panel">
    <div class="panel-header">
      <h2 class="panel-title">Directions</h2>
      <button class="panel-close" onclick={handleClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="directions-inputs">
      <div class="directions-input-row">
        <span class="directions-dot directions-dot--origin"></span>
        <input
          type="text"
          class="directions-input"
          placeholder="Choose starting point..."
          bind:value={originInput}
          readonly
        />
        <button
          class="directions-swap"
          onclick={useMyLocation}
          aria-label="Use my location"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>

      <div class="directions-input-row">
        <span class="directions-dot directions-dot--destination"></span>
        <input
          type="text"
          class="directions-input"
          placeholder="Choose destination..."
          bind:value={destinationInput}
          readonly
        />
        <button
          class="directions-swap"
          onclick={handleSwap}
          aria-label="Swap origin and destination"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="7 16 3 12 7 8" />
            <polyline points="17 8 21 12 17 16" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="directions-modes">
      {#each (['driving', 'walking', 'cycling', 'transit'] as const) as mode}
        <button
          class="directions-mode"
          class:directions-mode--active={$routeMode === mode}
          class:directions-mode--disabled={mode === 'transit' && !$capabilities.routing.transit}
          onclick={() => setMode(mode)}
          disabled={mode === 'transit' && !$capabilities.routing.transit}
          aria-label={mode}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={modeIcons[mode]} />
          </svg>
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      {/each}
    </div>

    {#if $isCalculatingRoute}
      <div class="directions-loading">
        <div class="search-loading-spinner"></div>
        <span>Calculating route...</span>
      </div>
    {:else if $routeError}
      <div class="search-no-results">
        <p>{$routeError}</p>
      </div>
    {:else if $selectedRoute}
      <div class="directions-summary">
        <div>
          <div class="directions-duration">{formatDuration($selectedRoute.duration)}</div>
          <div class="directions-distance">{formatDistance($selectedRoute.distance)}</div>
        </div>
        <ProviderBadge source={$selectedRoute.source} />
      </div>

      <div class="directions-steps">
        {#each $selectedRoute.steps as step, i}
          <div class="directions-step">
            <div class="directions-step-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                {#if i === 0}
                  <circle cx="12" cy="12" r="6" />
                {:else if i === $selectedRoute.steps.length - 1}
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                {:else}
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                {/if}
              </svg>
            </div>
            <div class="directions-step-content">
              <div class="directions-step-instruction">{step.instruction}</div>
              <div class="directions-step-meta">
                {formatDistance(step.distance)} · {formatDuration(step.duration)}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if $routeOrigin && $routeDestination}
      <div class="directions-calculate">
        <button class="glass-button glass-button--primary" onclick={calculateRoute}>
          Get Directions
        </button>
      </div>
    {:else}
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        <p>Select origin and destination</p>
      </div>
    {/if}
  </div>
{/if}
