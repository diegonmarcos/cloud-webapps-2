<script lang="ts">
  import '../styles/globals.scss';

  let { children } = $props();
</script>

<svelte:head>
  <title>My Maps</title>
  <meta name="description" content="Self-hosted maps with multi-provider API support" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="preconnect" href="https://basemaps.cartocdn.com" />
  <link rel="preconnect" href="https://nominatim.openstreetmap.org" />
  <link rel="preconnect" href="https://photon.komoot.io" />
</svelte:head>

{@render children()}
