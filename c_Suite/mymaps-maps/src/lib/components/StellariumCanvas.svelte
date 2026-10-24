<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let loading = $state(true);
	let error = $state('');
	let stel: any;

	// Public data CDN maintained by the Stellarium project (star catalogs, HiPS surveys).
	// The compiled engine itself has no npm package — see .github/workflows/build-stellarium.yml.
	const DATA_SOURCE = 'https://data.stellarium.org/web-engine/data';

	function resize() {
		if (!canvas || !container) return;
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		stel?.core?.change();
	}

	onMount(() => {
		const script = document.createElement('script');
		script.src = `${base}/stellarium/stellarium-web-engine.js`;
		script.onload = () => {
			// @ts-expect-error - global injected by stellarium-web-engine.js
			StelWebEngine({
				wasmFile: `${base}/stellarium/stellarium-web-engine.wasm`,
				canvas,
				dataSource: DATA_SOURCE,
				onReady: (engine: any) => {
					stel = engine;
					stel.core.observer.utc = new Date().getTime() / 86400000 + 2440587.5;
					resize();
					loading = false;
					const tick = () => {
						stel.core.update(1 / 60);
						stel.render();
						requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				}
			});
		};
		script.onerror = () => {
			error =
				'Stellarium engine assets not found — run the "Build Stellarium Web Engine" GitHub Action to generate static/stellarium/.';
			loading = false;
		};
		document.head.appendChild(script);

		window.addEventListener('resize', resize);
		return () => window.removeEventListener('resize', resize);
	});

	onDestroy(() => {
		stel = undefined;
	});
</script>

<div class="stellarium-container" bind:this={container}>
	<canvas bind:this={canvas}></canvas>
	{#if loading}
		<div class="overlay">Loading sky…</div>
	{:else if error}
		<div class="overlay error">{error}</div>
	{/if}
</div>

<style lang="scss">
	.stellarium-container {
		position: absolute;
		inset: 0;
		background: #000;
	}
	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-family: sans-serif;
		text-align: center;
		padding: 1rem;
	}
	.overlay.error {
		color: #ff8080;
	}
</style>
