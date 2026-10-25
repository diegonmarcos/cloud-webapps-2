<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as Cesium from 'cesium';
	import 'cesium/Build/Cesium/Widgets/widgets.css';

	let container: HTMLDivElement;
	let viewer: Cesium.Viewer | undefined;

	// Set VITE_CESIUM_ION_TOKEN in .env to use your own Cesium Ion account
	// (world terrain + Bing imagery). Falls back to Cesium's rate-limited demo token.
	const ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;

	onMount(async () => {
		if (ION_TOKEN) {
			Cesium.Ion.defaultAccessToken = ION_TOKEN;
		}

		viewer = new Cesium.Viewer(container, {
			terrainProvider: await Cesium.createWorldTerrainAsync(),
			animation: false,
			timeline: false,
			baseLayerPicker: true,
			geocoder: false,
			homeButton: true,
			sceneModePicker: true,
			navigationHelpButton: false
		});
	});

	onDestroy(() => {
		viewer?.destroy();
		viewer = undefined;
	});
</script>

<div class="cesium-container" bind:this={container}></div>

<style>
	.cesium-container {
		position: absolute;
		inset: 0;
	}
</style>
