<script lang="ts">
  import { mapCategories, selectedCategory, selectedMap } from '$lib/stores/mapCategoryStore';

  let isOpen = $state(false);

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  }

  function toggleCategory(id: string) {
    selectedCategory.update(current => current === id ? null : id);
  }

  function selectMap(categoryId: string, mapId: string) {
    selectedMap.set(mapId);
    // In the future, this would load the actual map data
    console.log(`Selected map: ${categoryId}/${mapId}`);
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
<nav class="side-menu" class:side-menu--open={isOpen} aria-label="Map categories">
  <div class="side-menu-header">
    <h2 class="side-menu-title">Maps</h2>
    <span class="side-menu-subtitle">Geographic Visualization</span>
  </div>

  <div class="side-menu-content">
    <!-- Link to MyMaps -->
    <a href="/mymaps" class="menu-link" data-sveltekit-reload onclick={close}>
      <div class="menu-link-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div class="menu-link-info">
        <span class="menu-link-name">MyMaps</span>
        <span class="menu-link-desc">Interactive map explorer</span>
      </div>
      <svg class="menu-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </a>

    <div class="menu-divider"></div>

    <!-- Map Categories -->
    {#each mapCategories as category}
      <div class="menu-category">
        <button
          class="menu-category-header"
          class:menu-category-header--active={$selectedCategory === category.id}
          onclick={() => toggleCategory(category.id)}
        >
          <div class="menu-category-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d={category.icon} />
            </svg>
          </div>
          <div class="menu-category-info">
            <span class="menu-category-name">{category.name}</span>
            <span class="menu-category-desc">{category.description}</span>
          </div>
          <svg
            class="menu-category-chevron"
            class:menu-category-chevron--open={$selectedCategory === category.id}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {#if $selectedCategory === category.id}
          <div class="menu-category-content">
            {#each category.maps as map}
              <button
                class="menu-map-item"
                class:menu-map-item--active={$selectedMap === map.id}
                onclick={() => selectMap(category.id, map.id)}
              >
                <span class="menu-map-name">{map.name}</span>
                <span class="menu-map-desc">{map.description}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="side-menu-footer">
    <span class="footer-text">d3-geo visualization</span>
  </div>
</nav>
