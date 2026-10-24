<script lang="ts">
  import { onMount } from 'svelte';
  import MapCanvas from '$lib/components/Map/MapCanvas.svelte';
  import CesiumCanvas from '$lib/components/Map/CesiumCanvas.svelte';
  import { mapEngine } from '$lib/stores/mapEngineStore';
  import MapControls from '$lib/components/Map/MapControls.svelte';
  import SearchBar from '$lib/components/Search/SearchBar.svelte';
  import DirectionsPanel from '$lib/components/Panels/DirectionsPanel.svelte';
  import LayersPanel from '$lib/components/Panels/LayersPanel.svelte';
  import PlacePanel from '$lib/components/Panels/PlacePanel.svelte';
  import SideMenu from '$lib/components/Menu/SideMenu.svelte';
  import MapContextMenu from '$lib/components/Map/MapContextMenu.svelte';
  import { tempPins } from '$lib/stores/placeListsStore';
  import { getMapInstance, isGlobeView } from '$lib/stores/mapStore';
  import type { LngLat } from '$lib/services/api/types';

  // Context menu state
  let contextMenu = $state({
    show: false,
    x: 0,
    y: 0,
    coordinates: [0, 0] as LngLat,
    placeName: '',
    placeAddress: ''
  });

  function handleContextMenuClose() {
    contextMenu.show = false;
  }

  // Set up map right-click handler after mount
  onMount(() => {
    // Wait for map to be ready
    const checkMap = setInterval(() => {
      const map = getMapInstance();
      if (map) {
        clearInterval(checkMap);

        // Add contextmenu listener for the map (right-click or two-finger trackpad)
        map.on('contextmenu', (e) => {
          e.preventDefault();

          // Check if there are any temp pins near the click
          const pins = $tempPins;
          const clickLngLat = e.lngLat;

          // Find nearest pin within ~50 pixels
          const point = map.project(clickLngLat);
          let nearestPin = null;
          let nearestDistance = Infinity;

          for (const pin of pins) {
            const pinPoint = map.project(pin.coordinates);
            const distance = Math.sqrt(
              Math.pow(point.x - pinPoint.x, 2) +
              Math.pow(point.y - pinPoint.y, 2)
            );
            if (distance < 50 && distance < nearestDistance) {
              nearestDistance = distance;
              nearestPin = pin;
            }
          }

          // Show context menu - use pin info if nearby, otherwise use clicked location
          contextMenu = {
            show: true,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            coordinates: nearestPin ? nearestPin.coordinates : [clickLngLat.lng, clickLngLat.lat],
            placeName: nearestPin ? nearestPin.name : 'Selected Location',
            placeAddress: nearestPin ? nearestPin.address : `${clickLngLat.lat.toFixed(5)}, ${clickLngLat.lng.toFixed(5)}`
          };
        });

        // Also prevent default context menu on the map container
        map.getContainer().addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
      }
    }, 100);

    // Add Matomo tracking
    const _mtm = (window as unknown as { _mtm: unknown[] })._mtm || [];
    _mtm.push({ 'mtm.startTime': new Date().getTime(), event: 'mtm.Start' });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://analytics.diegonmarcos.com/matomo/js/container_odwLIyPV.js';
    document.head.appendChild(script);

    // Cleanup interval on unmount
    return () => clearInterval(checkMap);
  });
</script>

<svelte:head>
  <title>My Maps</title>
</svelte:head>

<div id="app">
  <!-- Map Layer -->
  <div class="app-map">
    {#if $mapEngine === 'cesium'}
  <CesiumCanvas />
{:else}
  <MapCanvas />
{/if}
  </div>

  <!-- Starfield overlay (globe view only, mix-blend-mode: screen) -->
  <div class="starfield" class:starfield--visible={$isGlobeView}></div>

  <!-- UI Overlay -->
  <div class="app-ui">
    <SideMenu />
    <SearchBar />
    <MapControls />
    <PlacePanel />
    <DirectionsPanel />
    <LayersPanel />
  </div>

  <!-- Context Menu -->
  {#if contextMenu.show}
    <MapContextMenu
      x={contextMenu.x}
      y={contextMenu.y}
      coordinates={contextMenu.coordinates}
      placeName={contextMenu.placeName}
      placeAddress={contextMenu.placeAddress}
      onClose={handleContextMenuClose}
    />
  {/if}
</div>
