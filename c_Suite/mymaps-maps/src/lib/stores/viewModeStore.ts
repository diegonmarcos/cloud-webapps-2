import { writable } from 'svelte/store';

export type ViewMode = 'map' | 'sky';

export const viewMode = writable<ViewMode>('map');
