<script lang="ts">
  import { base } from '$app/paths';
  import { apiConfig, capabilities, hasPremiumFeatures } from '$lib/stores/configStore';

  function handleKeyChange(
    category: 'tiles' | 'geocoding' | 'places' | 'routing',
    provider: string,
    event: Event
  ) {
    const target = event.target as HTMLInputElement;
    const value = target.value.trim() || undefined;
    apiConfig.setApiKey(category, provider, value);
  }

  // API key fields configuration
  const apiFields = [
    {
      category: 'tiles' as const,
      title: 'Map Tiles',
      providers: [
        { id: 'stadia', name: 'Stadia Maps', description: 'Premium vector tile styles' },
        { id: 'mapbox', name: 'Mapbox', description: 'Satellite, terrain, and vector tiles' },
        { id: 'maptiler', name: 'MapTiler', description: 'High-quality satellite imagery' }
      ]
    },
    {
      category: 'geocoding' as const,
      title: 'Geocoding',
      providers: [
        { id: 'google', name: 'Google Maps', description: 'Premium address search' },
        { id: 'mapbox', name: 'Mapbox', description: 'Fast geocoding with autocomplete' }
      ]
    },
    {
      category: 'places' as const,
      title: 'Place Details',
      providers: [
        { id: 'foursquare', name: 'Foursquare', description: 'Photos, tips, and categories' },
        { id: 'google', name: 'Google Places', description: 'Reviews, photos, and business hours' },
        { id: 'yelp', name: 'Yelp', description: 'Business reviews and ratings' }
      ]
    },
    {
      category: 'routing' as const,
      title: 'Routing',
      providers: [
        { id: 'google', name: 'Google Maps', description: 'Transit routing and traffic' },
        { id: 'mapbox', name: 'Mapbox', description: 'Premium routing with traffic' }
      ]
    }
  ];

  // Capability checks
  const capabilityItems = [
    { key: 'search.categories', label: 'Category Filtering', check: () => $capabilities.search.categories },
    { key: 'places.photos', label: 'Place Photos', check: () => $capabilities.places.photos },
    { key: 'places.reviews', label: 'Reviews', check: () => $capabilities.places.reviews },
    { key: 'places.hours', label: 'Business Hours', check: () => $capabilities.places.hours },
    { key: 'routing.transit', label: 'Transit Routing', check: () => $capabilities.routing.transit },
    { key: 'tiles.satellite', label: 'Satellite View', check: () => $capabilities.tiles.satellite },
    { key: 'tiles.terrain', label: 'Terrain View', check: () => $capabilities.tiles.terrain }
  ];
</script>

<svelte:head>
  <title>Settings - My Maps</title>
</svelte:head>

<div class="settings-page">
  <div class="settings-header">
    <a href="{base}/" class="back-button" aria-label="Back to map">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </a>
    <h1 class="settings-title">Settings</h1>
  </div>

  <div class="settings-panel glass-panel">
    <!-- Current Status -->
    <div class="settings-section">
      <h2 class="settings-section-title">Available Features</h2>
      <p class="settings-description">
        {#if $hasPremiumFeatures}
          Premium features are enabled based on your API keys.
        {:else}
          Using free providers only. Add API keys to unlock premium features.
        {/if}
      </p>

      <div class="capabilities-list">
        {#each capabilityItems as item}
          <div
            class="capability-item"
            class:capability-item--enabled={item.check()}
            class:capability-item--disabled={!item.check()}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="capability-icon">
              {#if item.check()}
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              {:else}
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              {/if}
            </svg>
            <span>{item.label}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="glass-divider"></div>

    <!-- API Keys -->
    {#each apiFields as section}
      <div class="settings-section">
        <h2 class="settings-section-title">{section.title}</h2>

        {#each section.providers as provider}
          {@const categoryKeys = $apiConfig[section.category].keys as Record<string, string | undefined>}
          {@const currentKey = categoryKeys[provider.id]}
          <div class="api-key-input">
            <label for="{section.category}-{provider.id}">{provider.name}</label>
            <div class="api-key-input-row">
              <input
                type="password"
                id="{section.category}-{provider.id}"
                class="glass-input"
                placeholder={provider.description}
                value={currentKey || ''}
                oninput={(e) => handleKeyChange(section.category, provider.id, e)}
              />
              {#if currentKey}
                <span class="api-key-status api-key-status--active">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Active
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="glass-divider"></div>
    {/each}

    <!-- Reset -->
    <div class="settings-section">
      <h2 class="settings-section-title">Reset</h2>
      <button
        class="glass-button"
        onclick={() => {
          if (confirm('Reset all settings to defaults? This will remove all API keys.')) {
            apiConfig.reset();
          }
        }}
      >
        Reset to Defaults
      </button>
    </div>
  </div>

  <!-- Info -->
  <div class="settings-panel settings-panel--info glass-panel">
    <div class="settings-section">
      <h2 class="settings-section-title">About</h2>
      <p class="settings-description">
        My Maps uses a multi-provider architecture. Free providers (OpenStreetMap, OSRM)
        are always available. Premium providers unlock additional features like photos,
        reviews, and satellite imagery.
      </p>
      <p class="settings-description settings-description--spaced">
        API keys are stored locally in your browser and never sent to any server except
        the respective API providers.
      </p>
    </div>
  </div>
</div>
