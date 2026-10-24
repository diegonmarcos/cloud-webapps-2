<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { selectedResult, selectedPlace, isLoadingPlace } from '$lib/stores/searchStore';
  import { getPlaceDetails } from '$lib/services/api';
  import MapCanvas from '$lib/components/Map/MapCanvas.svelte';
  import MapControls from '$lib/components/Map/MapControls.svelte';
  import PlacePanel from '$lib/components/Panels/PlacePanel.svelte';

  let placeId = $derived($page.params.id);
  let error = $state<string | null>(null);

  onMount(async () => {
    if (!placeId) {
      goto(`${base}/`);
      return;
    }

    // Load place details
    isLoadingPlace.set(true);
    error = null;

    try {
      // Parse the place ID to determine source
      // Format: provider-type-id (e.g., nominatim-node-12345, osm-way-67890)
      const source = placeId.split('-')[0] || 'osm';

      const details = await getPlaceDetails(decodeURIComponent(placeId), source);

      if (details) {
        selectedPlace.set(details);
        selectedResult.set({
          id: details.id,
          name: details.name,
          address: details.address,
          coordinates: details.coordinates,
          source: details.source,
          category: details.category
        });
      } else {
        error = 'Place not found';
      }
    } catch (e) {
      console.error('Failed to load place:', e);
      error = 'Failed to load place details';
    } finally {
      isLoadingPlace.set(false);
    }
  });
</script>

<svelte:head>
  {#if $selectedPlace}
    <title>{$selectedPlace.name} - My Maps</title>
    <meta name="description" content={$selectedPlace.address} />
  {:else}
    <title>Place - My Maps</title>
  {/if}
</svelte:head>

<div id="app">
  <div class="app-map">
    <MapCanvas />
  </div>

  <div class="app-ui">
    <MapControls />

    {#if error}
      <div class="place-error panel">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3>Error</h3>
          <p>{error}</p>
          <a href="{base}/" class="glass-button">Back to Map</a>
        </div>
      </div>
    {:else if $isLoadingPlace}
      <div class="place-loading-panel panel">
        <div class="search-loading">
          <div class="search-loading-spinner"></div>
          <span>Loading place...</span>
        </div>
      </div>
    {:else}
      <PlacePanel />
    {/if}

    <a
      href="{base}/settings"
      class="settings-link glass-button glass-button--icon"
      aria-label="Settings"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </a>
  </div>
</div>
