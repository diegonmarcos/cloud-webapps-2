<script lang="ts">
  import { getMapInstance, mapStore, userLocation, isLocating, isGlobeView, toggleGlobeView } from '$lib/stores/mapStore';
  import { showLayersPanel, toggleLayersPanel } from '$lib/stores/layerStore';
  import { mapEngine, toggleMapEngine } from '$lib/stores/mapEngineStore';

  function resetView() {
    const map = getMapInstance();
    if (map) {
      // Calculate optimal zoom based on viewport size
      const container = map.getContainer();
      const minDimension = Math.min(container.clientWidth, container.clientHeight);

      // For globe projection, calculate zoom where globe just fits
      const optimalZoom = Math.log2(minDimension / 180) + 0.7;

      // Clamp between reasonable bounds
      const zoom = Math.max(1.8, Math.min(optimalZoom, 4));

      map.easeTo({
        center: [0, 20],
        zoom,
        pitch: 0,
        bearing: 0,
        duration: 800
      });
    }
  }

  function zoomIn() {
    const map = getMapInstance();
    if (map) map.zoomIn();
  }

  function zoomOut() {
    const map = getMapInstance();
    if (map) map.zoomOut();
  }

  function resetBearing() {
    const map = getMapInstance();
    if (map) {
      map.easeTo({ bearing: 0, pitch: 0 });
      mapStore.resetBearing();
    }
  }

  function geolocate() {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    isLocating.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        userLocation.set([longitude, latitude]);

        const map = getMapInstance();
        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500
          });
        }

        isLocating.set(false);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        isLocating.set(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  // Calculate bearing rotation for compass
  let bearingStyle = '';
  $: bearingStyle = `--bearing: ${-$mapStore.bearing}deg`;
</script>

<div class="map-controls">
  <!-- Zoom controls -->
  <div class="map-control-group">
    <button
      class="map-control-btn"
      onclick={zoomIn}
      aria-label="Zoom in"
      title="Zoom in"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button
      class="map-control-btn"
      onclick={zoomOut}
      aria-label="Zoom out"
      title="Zoom out"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>

  <!-- Compass -->
  <button
    class="map-compass"
    class:map-compass--rotated={$mapStore.bearing !== 0}
    style={bearingStyle}
    onclick={resetBearing}
    aria-label="Reset bearing to north"
    title="Reset north"
  >
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L15 10L12 8L9 10L12 2Z"
        fill="#ef4444"
        stroke="currentColor"
        stroke-width="1"
      />
      <path
        d="M12 22L9 14L12 16L15 14L12 22Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>
  </button>

  <!-- Geolocate -->
  <button
    class="geolocate-btn"
    class:geolocate-btn--tracking={$userLocation !== null}
    onclick={geolocate}
    aria-label="Find my location"
    title="My location"
    disabled={$isLocating}
  >
    {#if $isLocating}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    {/if}
  </button>

  <!-- World view reset -->
  <button
    class="map-control-btn map-control-btn--standalone"
    onclick={resetView}
    aria-label="Reset to world view"
    title="World view"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  </button>

  <!-- Layers toggle -->
  <button
    class="map-control-btn map-control-btn--standalone"
    class:map-control-btn--active={$showLayersPanel}
    onclick={toggleLayersPanel}
    aria-label="Toggle layers panel"
    title="Layers"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  </button>

  <!-- Globe projection toggle -->
  <button
    class="map-control-btn map-control-btn--standalone"
    class:map-control-btn--active={$isGlobeView}
    onclick={toggleGlobeView}
    aria-label={$isGlobeView ? 'Switch to flat map' : 'Switch to globe view'}
    title={$isGlobeView ? 'Flat map' : 'Globe view'}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  </button>

  <!-- Cesium 3D engine toggle -->
  <button
    class="map-control-btn map-control-btn--standalone"
    class:map-control-btn--active={$mapEngine === 'cesium'}
    onclick={toggleMapEngine}
    aria-label={$mapEngine === 'cesium' ? 'Switch to MapLibre' : 'Switch to Cesium 3D'}
    title={$mapEngine === 'cesium' ? 'MapLibre' : 'Cesium 3D terrain'}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 17l4-10 4 10M4.5 13.5h5M13 17l4-14 4 14M14 13h6" />
    </svg>
  </button>
</div>
