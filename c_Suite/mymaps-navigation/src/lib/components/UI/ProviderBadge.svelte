<script lang="ts">
  import type { ProviderSource } from '$lib/services/api/types';

  let { source }: { source: ProviderSource } = $props();

  const labels: Record<ProviderSource, string> = {
    nominatim: 'OSM',
    photon: 'OSM',
    osm: 'OSM',
    overpass: 'OSM',
    foursquare: 'FSQ',
    google: 'Google',
    mapbox: 'Mapbox',
    yelp: 'Yelp',
    osrm: 'OSRM',
    valhalla: 'Valhalla'
  };
</script>

<span class="provider-badge provider-badge--{source}">
  {labels[source] || source}
</span>
