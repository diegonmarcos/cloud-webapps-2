<script lang="ts">
  import { base } from '$app/paths';
  import { placeLists, listVisibility } from '$lib/stores/placeListsStore';
  import { flyTo } from '$lib/stores/mapStore';
  import type { SavedPlace } from '$lib/stores/placeListsStore';

  let isOpen = $state(false);

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
  }

  // Close on escape key
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  }

  // Menu sections
  const menuSections = [
    {
      id: 'list',
      name: 'Places',
      icon: 'M4 6h16M4 12h16M4 18h16',
      description: 'View saved places'
    },
    {
      id: 'maps',
      name: 'Maps',
      icon: 'M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7',
      description: 'Map projections'
    },
    {
      id: 'chronology',
      name: 'Chronology',
      icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      description: 'Location history'
    },
    {
      id: 'mytrips',
      name: 'MyTrips',
      icon: 'M3 17l6-6 4 4 8-8M17 7h4v4',
      description: 'Travel journal'
    }
  ];

  const tripsBaseUrl = 'https://diegonmarcos.github.io/mymaps-mytrips';

  const tripPages = [
    { id: 'home', label: 'Home', icon: '🏠', hash: '' },
    { id: 'atlas', label: 'Atlas', icon: '🗺️', hash: '#atlas' },
    { id: 'collections', label: 'Collections', icon: '🃏', hash: '#themes' },
    { id: 'stats', label: 'Stats', icon: '📊', hash: '#analytics' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️', hash: '#timeline' },
    { id: 'roadtrip', label: 'Cultural Regions', icon: '🌎', path: '/myroadtrip.html' }
  ];

  // Available map projections (from maps/ project)
  const mapProjections = [
    { id: 'orthographic', name: 'Globe', icon: '🌍' },
    { id: 'mercator', name: 'Mercator', icon: '🗺️' },
    { id: 'equalEarth', name: 'Equal Earth', icon: '🌐' },
    { id: 'naturalEarth1', name: 'Natural Earth', icon: '🗾' },
    { id: 'equirectangular', name: 'Plate Carrée', icon: '📊' }
  ];

  let activeSection = $state<string | null>(null);

  function selectSection(id: string) {
    activeSection = activeSection === id ? null : id;
  }

  function toggleListVisibility(listId: string) {
    listVisibility.toggle(listId);
  }

  function goToPlace(place: SavedPlace) {
    flyTo(place.coordinates, 15);
    close();
  }

  function goToMapProjection(projectionId: string) {
    window.location.href = `/maps/?projection=${projectionId}`;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Hamburger Button -->
<button
  class="menu-toggle"
  class:menu-toggle--open={isOpen}
  onclick={toggle}
  aria-label={isOpen ? 'Close menu' : 'Open menu'}
  aria-expanded={isOpen}
>
  <span class="menu-toggle-bar"></span>
  <span class="menu-toggle-bar"></span>
  <span class="menu-toggle-bar"></span>
</button>

<!-- Overlay -->
{#if isOpen}
  <button
    class="menu-overlay"
    onclick={close}
    aria-label="Close menu"
    tabindex="-1"
  ></button>
{/if}

<!-- Side Menu -->
<nav class="side-menu" class:side-menu--open={isOpen} aria-label="Main menu">
  <div class="side-menu-header">
    <h2 class="side-menu-title">MyMaps</h2>
  </div>

  <div class="side-menu-content">
    {#each menuSections as section}
      <button
        class="menu-section"
        class:menu-section--active={activeSection === section.id}
        onclick={() => selectSection(section.id)}
      >
        <div class="menu-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d={section.icon} />
          </svg>
        </div>
        <div class="menu-section-info">
          <span class="menu-section-name">{section.name}</span>
          <span class="menu-section-desc">{section.description}</span>
        </div>
        <svg class="menu-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {#if activeSection === section.id}
        <div class="menu-section-content">
          {#if section.id === 'list'}
            {#if $placeLists.length === 0}
              <div class="menu-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <p>No saved places yet</p>
                <span>Search and save places to see them here</span>
              </div>
            {:else}
              {#each $placeLists as list}
                <div class="menu-list-item">
                  <button
                    class="menu-list-header"
                    class:menu-list-header--active={$listVisibility[list.id]}
                    onclick={() => toggleListVisibility(list.id)}
                  >
                    <span class="menu-list-color" style="background-color: {list.color}"></span>
                    <span class="menu-list-name">{list.name}</span>
                    <span class="menu-list-count">{list.places.length}</span>
                  </button>
                  {#if list.places.length > 0}
                    <div class="menu-list-places">
                      {#each list.places as place}
                        <button class="menu-place-item" onclick={() => goToPlace(place)}>
                          {place.name}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          {:else if section.id === 'maps'}
            <div class="menu-maps-list">
              <a
                href="https://diegonmarcos.github.io/maps"
                class="menu-map-item"
                target="_blank"
                rel="noopener noreferrer"
                onclick={close}
              >
                <span class="menu-map-icon">🏠</span>
                <span class="menu-map-name">Home</span>
              </a>
              {#each mapProjections as projection}
                <a
                  href="/maps/?projection={projection.id}"
                  class="menu-map-item"
                  onclick={close}
                >
                  <span class="menu-map-icon">{projection.icon}</span>
                  <span class="menu-map-name">{projection.name}</span>
                </a>
              {/each}
            </div>
          {:else if section.id === 'chronology'}
            <div class="menu-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p>No location history</p>
              <span>Your visited places will appear here</span>
            </div>
          {:else if section.id === 'mytrips'}
            <div class="menu-maps-list">
              {#each tripPages as trip}
                <a
                  href="{tripsBaseUrl}{trip.path || '/'}{trip.hash || ''}"
                  class="menu-map-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="menu-map-icon">{trip.icon}</span>
                  <span class="menu-map-name">{trip.label}</span>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/each}

  </div>

  <div class="side-menu-footer">
    <a href="/maps/" class="menu-footer-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span>Classic Maps</span>
    </a>
    <a href="{base}/settings" class="menu-footer-link" onclick={close}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      <span>Settings</span>
    </a>
  </div>
</nav>
