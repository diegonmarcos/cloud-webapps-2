<script lang="ts">
  import { layerStore, showLayersPanel, toggleLayersPanel, visibleLayers } from '$lib/stores/layerStore';
  import { currentStyleId, mapStyles, currentStyle, is3DTerrain, toggle3DTerrain, isTerrainLayer, toggleTerrainLayer, setTerrainLayer, isSatelliteLayer, toggleSatelliteLayer, setSatelliteLayer, isGlobeView, toggleGlobeView } from '$lib/stores/mapStore';
  import { createLayerFromKML, getBounds } from '$lib/services/layers/kml';
  import { fitBounds, getMapInstance, flyTo } from '$lib/stores/mapStore';
  import { placeLists, tempPins, tempPinsCount, listVisibility, searchRadius } from '$lib/stores/placeListsStore';
  import type { CustomLayer } from '$lib/services/api/types';
  import type { PlaceList, SavedPlace } from '$lib/stores/placeListsStore';
  import maplibregl from 'maplibre-gl';

  // Collapsible sections state (custom collapsed by default)
  let sectionsOpen = $state({
    style: true,
    layers: true,
    options: true,
    places: true,
    custom: false
  });

  function toggleSection(section: keyof typeof sectionsOpen) {
    sectionsOpen[section] = !sectionsOpen[section];
  }

  function flyToPlace(place: SavedPlace) {
    flyTo(place.coordinates, 15);
  }

  function clearAllTempPins() {
    tempPins.clearAll();
  }

  function toggleListVisibility(listId: string) {
    listVisibility.toggle(listId);
  }

  function handleRadiusChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    if (!isNaN(value)) {
      searchRadius.set(value);
    }
  }

  let fileInput: HTMLInputElement;

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const layer = await createLayerFromKML(file);
      const id = layerStore.add(layer);

      // Fit to layer bounds
      if (layer.data) {
        const bounds = getBounds(layer.data);
        if (bounds) {
          fitBounds(bounds, 50);
        }

        // Add layer to map
        addLayerToMap(id, layer.data);
      }
    } catch (error) {
      console.error('Failed to load KML:', error);
      alert('Failed to load KML file. Please check the format.');
    }

    // Reset input
    target.value = '';
  }

  function addLayerToMap(id: string, data: GeoJSON.FeatureCollection) {
    const map = getMapInstance();
    if (!map) return;

    const sourceId = `layer-${id}`;

    // Add source
    map.addSource(sourceId, { type: 'geojson', data });

    // Add point layer
    map.addLayer({
      id: `${sourceId}-points`,
      type: 'circle',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add line layer
    map.addLayer({
      id: `${sourceId}-lines`,
      type: 'line',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3
      }
    });

    // Add polygon layer
    map.addLayer({
      id: `${sourceId}-polygons`,
      type: 'fill',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.3
      }
    });

    // Add polygon outline
    map.addLayer({
      id: `${sourceId}-polygon-outlines`,
      type: 'line',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2
      }
    });
  }

  function removeLayerFromMap(id: string) {
    const map = getMapInstance();
    if (!map) return;

    const sourceId = `layer-${id}`;
    const layerIds = [
      `${sourceId}-points`,
      `${sourceId}-lines`,
      `${sourceId}-polygons`,
      `${sourceId}-polygon-outlines`
    ];

    for (const layerId of layerIds) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  function toggleLayerVisibility(layer: CustomLayer) {
    const map = getMapInstance();
    if (!map) return;

    const sourceId = `layer-${layer.id}`;
    const layerIds = [
      `${sourceId}-points`,
      `${sourceId}-lines`,
      `${sourceId}-polygons`,
      `${sourceId}-polygon-outlines`
    ];

    const visibility = layer.visible ? 'none' : 'visible';

    for (const layerId of layerIds) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }

    layerStore.toggleVisibility(layer.id);
  }

  function handleRemoveLayer(layer: CustomLayer) {
    removeLayerFromMap(layer.id);
    layerStore.remove(layer.id);
  }

  function handleStyleChange(styleId: string) {
    currentStyleId.set(styleId);
  }

  function handleNoneLayer() {
    console.log('[LAYERS DEBUG] None button clicked - disabling all layers');
    setTerrainLayer(false);
    setSatelliteLayer(false);
  }

  function handleTerrainToggle() {
    console.log('[LAYERS DEBUG] Terrain button clicked');
    toggleTerrainLayer();
  }

  function handleSatelliteToggle() {
    console.log('[LAYERS DEBUG] Satellite button clicked');
    toggleSatelliteLayer();
  }

  function handle3DToggle() {
    console.log('[LAYERS DEBUG] 3D toggle clicked');
    toggle3DTerrain();
  }

  function handleGlobeToggle() {
    console.log('[LAYERS DEBUG] Globe toggle clicked');
    toggleGlobeView();
  }
</script>

{#if $showLayersPanel}
  <div class="layers-panel panel">
    <div class="panel-header">
      <h2 class="panel-title">Layers</h2>
      <button class="panel-close" onclick={toggleLayersPanel} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Map Styles -->
    <div class="layers-section">
      <button class="layers-section-header" onclick={() => toggleSection('style')}>
        <h3 class="layers-section-title">Map Style</h3>
        <svg class="layers-section-chevron" class:layers-section-chevron--open={sectionsOpen.style} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {#if sectionsOpen.style}
        <div class="layers-section-content">
          {#each mapStyles as style}
            <button
              class="layer-option"
              onclick={() => handleStyleChange(style.id)}
            >
              <div
                class="layer-preview"
                class:layer-preview--active={$currentStyleId === style.id}
              >
                {#if style.preview}
                  <img src={style.preview} alt={style.name} />
                {:else}
                  <div class="layer-preview-placeholder"></div>
                {/if}
              </div>
              <div class="layer-info">
                <div class="layer-name">{style.name}</div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Map Layers -->
    <div class="layers-section">
      <button class="layers-section-header" onclick={() => toggleSection('layers')}>
        <h3 class="layers-section-title">Layers</h3>
        <svg class="layers-section-chevron" class:layers-section-chevron--open={sectionsOpen.layers} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {#if sectionsOpen.layers}
        <div class="layers-section-content">
          <button
            class="layer-option"
            onclick={handleNoneLayer}
          >
            <div
              class="layer-preview"
              class:layer-preview--active={!$isTerrainLayer && !$isSatelliteLayer}
            >
              <div class="layer-preview-placeholder layer-preview-placeholder--none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
              </div>
            </div>
            <div class="layer-info">
              <div class="layer-name">None</div>
            </div>
          </button>
          <button
            class="layer-option"
            onclick={handleTerrainToggle}
          >
            <div
              class="layer-preview"
              class:layer-preview--active={$isTerrainLayer}
            >
              <div class="layer-preview-placeholder layer-preview-placeholder--terrain">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24">
                  <path d="M3 17l4-4 4 4 6-6 4 4" />
                  <path d="M3 21h18" />
                  <path d="M8 13l-2 2" />
                  <path d="M17 11l-3 3" />
                </svg>
              </div>
            </div>
            <div class="layer-info">
              <div class="layer-name">Terrain</div>
            </div>
          </button>
          <button
            class="layer-option"
            onclick={handleSatelliteToggle}
          >
            <div
              class="layer-preview"
              class:layer-preview--active={$isSatelliteLayer}
            >
              <div class="layer-preview-placeholder layer-preview-placeholder--satellite">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            </div>
            <div class="layer-info">
              <div class="layer-name">Satellite</div>
            </div>
          </button>
        </div>
      {/if}
    </div>

    <!-- Options -->
    <div class="layers-section">
      <button class="layers-section-header" onclick={() => toggleSection('options')}>
        <h3 class="layers-section-title">Options</h3>
        <svg class="layers-section-chevron" class:layers-section-chevron--open={sectionsOpen.options} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {#if sectionsOpen.options}
        <div class="layers-section-content">
          <label class="layer-toggle" for="globe-view">
            <input
              type="checkbox"
              id="globe-view"
              checked={$isGlobeView}
              onchange={handleGlobeToggle}
            />
            <span class="toggle-switch"></span>
            <span class="toggle-label">Globe View</span>
          </label>
          <label class="layer-toggle" for="terrain-3d">
            <input
              type="checkbox"
              id="terrain-3d"
              checked={$is3DTerrain}
              onchange={handle3DToggle}
            />
            <span class="toggle-switch"></span>
            <span class="toggle-label">3D Elevation</span>
          </label>
          <div class="option-input-row">
            <label class="option-label" for="search-radius">Search Radius</label>
            <div class="option-input-group">
              <input
                type="number"
                id="search-radius"
                class="option-input"
                value={$searchRadius}
                min="1"
                max="100"
                step="1"
                onchange={handleRadiusChange}
              />
              <span class="option-input-suffix">km</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Lists of Places -->
    <div class="layers-section">
      <button class="layers-section-header" onclick={() => toggleSection('places')}>
        <h3 class="layers-section-title">
          Lists of Places
          {#if $tempPinsCount > 0}
            <span class="layers-section-badge">{$tempPinsCount} pins</span>
          {/if}
        </h3>
        <svg class="layers-section-chevron" class:layers-section-chevron--open={sectionsOpen.places} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {#if sectionsOpen.places}
        <div class="layers-section-content">
          {#if $tempPinsCount > 0}
            <div class="places-temp-section">
              <div class="places-temp-header">
                <span class="places-temp-label">Search pins ({$tempPinsCount})</span>
                <button class="places-clear-btn" onclick={clearAllTempPins}>Clear all</button>
              </div>
            </div>
          {/if}

          {#each $placeLists as list}
            <button
              class="places-list-btn"
              class:places-list-btn--active={$listVisibility[list.id]}
              onclick={() => toggleListVisibility(list.id)}
            >
              <span class="places-list-color" style="background-color: {list.color}"></span>
              <span class="places-list-name">{list.name}</span>
              <span class="places-list-count">{list.places.length}</span>
            </button>
          {/each}

          {#if $placeLists.length === 0 && $tempPinsCount === 0}
            <p class="layers-empty-text">No saved places yet</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Custom Layers -->
    <div class="layers-section">
      <button class="layers-section-header" onclick={() => toggleSection('custom')}>
        <h3 class="layers-section-title">Custom Layers</h3>
        <svg class="layers-section-chevron" class:layers-section-chevron--open={sectionsOpen.custom} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {#if sectionsOpen.custom}
        <div class="layers-section-content">
          {#each $layerStore as layer}
            <div class="layer-toggle">
              <input
                type="checkbox"
                id="layer-{layer.id}"
                checked={layer.visible}
                onchange={() => toggleLayerVisibility(layer)}
              />
              <span class="toggle-switch"></span>
              <span class="toggle-label">{layer.name}</span>
              <button
                class="layer-remove-btn"
                onclick={() => handleRemoveLayer(layer)}
                aria-label="Remove layer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          {/each}

          {#if $layerStore.length === 0}
            <p class="layers-empty-text">No custom layers added</p>
          {/if}

          <!-- Add layer button -->
          <input
            type="file"
            accept=".kml,.kmz"
            bind:this={fileInput}
            onchange={handleFileSelect}
            class="sr-only"
          />
          <button
            class="glass-button layers-import-btn"
            onclick={() => fileInput.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Import KML/KMZ
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
