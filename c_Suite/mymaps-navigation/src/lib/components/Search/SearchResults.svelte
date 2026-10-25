<script lang="ts">
  import {
    searchResults,
    selectedResult,
    recentSearches,
    searchQuery,
    clearSearch
  } from '$lib/stores/searchStore';
  import { flyTo, getMapInstance } from '$lib/stores/mapStore';
  import { openDirections } from '$lib/stores/routeStore';
  import { tempPins } from '$lib/stores/placeListsStore';
  import type { SearchResult } from '$lib/services/api/types';
  import ProviderBadge from '$lib/components/UI/ProviderBadge.svelte';
  import maplibregl from 'maplibre-gl';

  // Context menu state (exported for parent to use)
  interface ContextMenuState {
    show: boolean;
    x: number;
    y: number;
    coordinates: [number, number];
    placeName: string;
    placeAddress: string;
  }

  let contextMenuState = $state<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    coordinates: [0, 0],
    placeName: '',
    placeAddress: ''
  });

  // Export context menu state for parent component
  export function getContextMenuState() {
    return contextMenuState;
  }

  export function closeContextMenu() {
    contextMenuState.show = false;
  }

  // Track all temp markers by their pin ID
  const tempMarkers = new Map<string, maplibregl.Marker>();

  function formatDistance(meters?: number): string {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  function handleSelect(result: SearchResult) {
    selectedResult.set(result);
    recentSearches.add($searchQuery);

    // Fly to location
    flyTo(result.coordinates, result.bbox ? undefined : 15);

    // Fit to bounds if available
    if (result.bbox) {
      const map = getMapInstance();
      if (map) {
        const { west, south, east, north } = result.bbox;
        map.fitBounds([[west, south], [east, north]], {
          padding: 50,
          duration: 1500
        });
      }
    }

    // Add marker
    addMarker(result);

    // Clear search UI
    clearSearch();
  }

  function addMarker(result: SearchResult) {
    const map = getMapInstance();
    if (!map) return;

    // Add to temp pins store (returns the pin ID)
    const pinId = tempPins.add({
      name: result.name,
      address: result.address,
      coordinates: result.coordinates
    });

    // Create marker element
    const el = document.createElement('div');
    el.className = 'map-marker map-marker--search';
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="white" stroke="none">
        <circle cx="12" cy="12" r="4" />
      </svg>
    `;

    // Add right-click handler for context menu
    el.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      contextMenuState = {
        show: true,
        x: e.clientX,
        y: e.clientY,
        coordinates: result.coordinates,
        placeName: result.name,
        placeAddress: result.address
      };
    });

    // Create popup
    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <div style="padding: 8px;">
        <strong>${result.name}</strong>
        <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${result.address}</p>
      </div>
    `);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(result.coordinates)
      .setPopup(popup)
      .addTo(map);

    // Store marker reference
    tempMarkers.set(pinId, marker);

    // Open popup for this marker
    marker.togglePopup();
  }

  // Sync markers with tempPins store (remove markers when pins are cleared)
  $effect(() => {
    const pins = $tempPins;
    const pinIds = new Set(pins.map(p => p.id));

    // Remove markers that are no longer in the store
    for (const [id, marker] of tempMarkers) {
      if (!pinIds.has(id)) {
        marker.remove();
        tempMarkers.delete(id);
      }
    }
  });

  function handleDirections(result: SearchResult, e: Event) {
    e.stopPropagation();
    openDirections({ name: result.name, coordinates: result.coordinates });
  }

  // Get category icon
  function getCategoryIcon(category?: string): string {
    const icons: Record<string, string> = {
      amenity: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      building: 'M12 3L2 12h3v8h14v-8h3L12 3zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
      place: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      highway: 'M12 2L4 7v15h16V7l-8-5zm0 2.5L18 8v11H6V8l6-3.5z',
      shop: 'M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z'
    };
    return icons[category || ''] || icons.place;
  }
</script>

<div class="search-results">
  <div class="search-results-header">
    <span>{$searchResults.length} result{$searchResults.length !== 1 ? 's' : ''}</span>
  </div>

  {#each $searchResults as result (result.id)}
    <div
      class="search-result"
      class:search-result--selected={$selectedResult?.id === result.id}
      onclick={() => handleSelect(result)}
      onkeydown={(e) => e.key === 'Enter' && handleSelect(result)}
      role="button"
      tabindex="0"
    >
      <div class="search-result-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={getCategoryIcon(result.category)} />
        </svg>
      </div>

      <div class="search-result-content">
        <div class="search-result-name">
          <span class="search-result-title">{result.name}</span>
          <ProviderBadge source={result.source} />
        </div>
        <div class="search-result-address">{result.address}</div>
        {#if result.distance || result.type}
          <div class="search-result-meta">
            {#if result.distance}
              <span class="search-result-distance">{formatDistance(result.distance)}</span>
            {/if}
            {#if result.type}
              <span>{result.type}</span>
            {/if}
          </div>
        {/if}
      </div>

      <button
        class="search-result-directions glass-button glass-button--icon glass-button--small"
        onclick={(e) => handleDirections(result, e)}
        aria-label="Get directions"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </button>
    </div>
  {/each}
</div>
