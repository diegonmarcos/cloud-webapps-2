<script lang="ts">
  import { placeLists, tempPins } from '$lib/stores/placeListsStore';
  import type { LngLat } from '$lib/services/api/types';

  interface Props {
    x: number;
    y: number;
    coordinates: LngLat;
    placeName: string;
    placeAddress: string;
    onClose: () => void;
  }

  let { x, y, coordinates, placeName, placeAddress, onClose }: Props = $props();

  let showListPicker = $state(false);

  function addToList(listId: string) {
    placeLists.addPlace(listId, {
      name: placeName,
      address: placeAddress,
      coordinates
    });
    // Remove from temp pins since it's now saved
    tempPins.removeByCoordinates(coordinates);
    onClose();
  }

  function clearAllTempPins() {
    tempPins.clearAll();
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

<div class="context-menu-backdrop" onclick={handleBackdropClick} onkeydown={() => {}} role="button" tabindex="-1">
  <div class="context-menu" style="left: {x}px; top: {y}px;">
    {#if !showListPicker}
      <button class="context-menu-item" onclick={() => showListPicker = true}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span>Save to list</span>
      </button>
      <button class="context-menu-item" onclick={clearAllTempPins}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Clear all search pins</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item context-menu-item--muted" onclick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span>Cancel</span>
      </button>
    {:else}
      <div class="context-menu-header">
        <button class="context-menu-back" onclick={() => showListPicker = false} aria-label="Go back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span>Save to list</span>
      </div>
      {#each $placeLists as list}
        <button class="context-menu-item" onclick={() => addToList(list.id)}>
          <span class="context-menu-color" style="background-color: {list.color}"></span>
          <span>{list.name}</span>
          <span class="context-menu-count">{list.places.length}</span>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .context-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }

  .context-menu {
    position: absolute;
    min-width: 200px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .context-menu-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 8px;
  }

  .context-menu-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .context-menu-back:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .context-menu-back svg {
    width: 16px;
    height: 16px;
  }

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .context-menu-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .context-menu-item svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .context-menu-item--muted {
    color: rgba(255, 255, 255, 0.5);
  }

  .context-menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 8px 0;
  }

  .context-menu-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .context-menu-count {
    margin-left: auto;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
