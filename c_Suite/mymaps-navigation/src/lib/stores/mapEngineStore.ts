import { writable } from 'svelte/store';

export type MapEngine = 'maplibre' | 'cesium';

export const mapEngine = writable<MapEngine>('maplibre');

export function toggleMapEngine() {
	mapEngine.update((e) => (e === 'maplibre' ? 'cesium' : 'maplibre'));
}
