<script lang="ts">
  import { quickSearchCategories, quickSearch, searchRadius } from '$lib/stores/placeListsStore';
  import { getMapInstance, userLocation } from '$lib/stores/mapStore';
  import { search } from '$lib/services/api';

  const { activeCategories, pins, isLoading } = quickSearch;

  async function toggleCategory(categoryId: string) {
    const wasActive = $activeCategories.includes(categoryId);
    activeCategories.toggle(categoryId);

    if (wasActive) {
      // Remove pins for this category
      pins.clearCategory(categoryId);
    } else {
      // Search for this category
      await searchCategory(categoryId);
    }
  }

  async function searchCategory(categoryId: string) {
    const category = quickSearchCategories.find(c => c.id === categoryId);
    if (!category) return;

    const map = getMapInstance();
    if (!map) return;

    const center = map.getCenter();
    const radiusKm = $searchRadius;

    isLoading.set(true);

    try {
      const results = await search(category.query, {
        limit: 50,
        proximity: [center.lng, center.lat],
        boundingBox: getBoundingBox(center.lng, center.lat, radiusKm)
      });

      // Filter results within radius and convert to QuickSearchPins
      const newPins = results
        .filter(r => {
          const dist = getDistanceKm(center.lat, center.lng, r.coordinates[1], r.coordinates[0]);
          return dist <= radiusKm;
        })
        .map(r => ({
          id: `quick-${categoryId}-${r.id}`,
          categoryId,
          name: r.name,
          address: r.address,
          coordinates: r.coordinates
        }));

      // Remove old pins for this category and add new ones
      pins.clearCategory(categoryId);
      pins.addPins(newPins);
    } catch (error) {
      console.error(`Quick search failed for ${category.name}:`, error);
    } finally {
      isLoading.set(false);
    }
  }

  // Calculate bounding box from center and radius
  function getBoundingBox(lng: number, lat: number, radiusKm: number): [number, number, number, number] {
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    return [
      lng - lngDelta, // west
      lat - latDelta, // south
      lng + lngDelta, // east
      lat + latDelta  // north
    ];
  }

  // Haversine distance in km
  function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Re-search when map moves (debounced via effect)
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const map = getMapInstance();
    if (!map) return;

    const handleMoveEnd = () => {
      // Debounce re-search
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        // Re-search all active categories
        $activeCategories.forEach(catId => {
          searchCategory(catId);
        });
      }, 500);
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  });
</script>

<div class="quick-search-bar">
  {#each quickSearchCategories as category}
    <button
      class="quick-search-btn"
      class:quick-search-btn--active={$activeCategories.includes(category.id)}
      onclick={() => toggleCategory(category.id)}
      title={category.name}
      disabled={$isLoading}
    >
      <span class="quick-search-emoji">{category.emoji}</span>
    </button>
  {/each}
</div>
