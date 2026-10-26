<script setup lang="ts">
import { ref, computed } from 'vue'
import { IMusicItem } from '../types'
import MediaCard from './MediaCard.vue'

const props = defineProps<{
  title: string
  items: IMusicItem[]
  mode: 'list' | 'card'
  icon?: string
}>()

const isCollapsed = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
  }
}

const itemCount = computed(() => props.items.length)
</script>

<template>
  <section class="section-block" :class="[mode, { collapsed: isCollapsed }]">
    <!-- Section Header -->
    <div class="section-header" @click="toggleCollapse">
      <div class="header-left">
        <span class="collapse-icon">{{ isCollapsed ? '▸' : '▾' }}</span>
        <span v-if="icon" class="section-icon">{{ icon }}</span>
        <h3 class="section-title">{{ title }}</h3>
        <span class="item-count">({{ itemCount }})</span>
      </div>

      <!-- Card mode scroll controls -->
      <div v-if="mode === 'card' && !isCollapsed" class="header-controls" @click.stop>
        <button class="scroll-btn" @click="scrollLeft" title="Scroll Left">◀</button>
        <button class="scroll-btn" @click="scrollRight" title="Scroll Right">▶</button>
      </div>
    </div>

    <!-- Content Container -->
    <div v-show="!isCollapsed" class="section-content">
      <!-- List Mode: Vertical list -->
      <div v-if="mode === 'list'" class="list-container">
        <MediaCard
          v-for="(item, index) in items"
          :key="item.id || item.name"
          :item="item"
          :mode="mode"
          :index="index"
        />
      </div>

      <!-- Card Mode: Horizontal scroll -->
      <div v-else class="card-scroll-wrapper">
        <div ref="scrollContainer" class="card-container">
          <MediaCard
            v-for="(item, index) in items"
            :key="item.id || item.name"
            :item="item"
            :mode="mode"
            :index="index"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section-block {
  margin-bottom: 16px;

  &.collapsed {
    margin-bottom: 8px;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SECTION HEADER */
/* ═══════════════════════════════════════════════════════════════════════════ */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--wa-toolbar-bg);
  border: var(--wa-toolbar-border);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--wa-content-bg);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.collapse-icon {
  font-size: 10px;
  color: var(--wa-lcd-color);
  width: 12px;
}

.section-icon {
  font-size: 14px;
}

.section-title {
  font-size: 12px;
  font-weight: bold;
  color: var(--wa-lcd-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-count {
  font-size: 10px;
  color: var(--wa-text-dim);
  flex-shrink: 0;
}

.header-controls {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.scroll-btn {
  width: 24px;
  height: 20px;
  background: var(--wa-btn-bg);
  border: var(--wa-btn-border);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wa-text);

  &:hover {
    background: var(--wa-btn-bg-active);
  }

  &:active {
    border: var(--wa-btn-border-active);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SECTION CONTENT */
/* ═══════════════════════════════════════════════════════════════════════════ */
.section-content {
  margin-top: 4px;
}

/* List Mode */
.list-container {
  display: flex;
  flex-direction: column;
  background: var(--wa-content-bg);
  border: var(--wa-inset-border);
  max-height: 200px;
  overflow-y: auto;
}

/* Card Mode */
.card-scroll-wrapper {
  position: relative;
}

.card-container {
  display: flex;
  gap: 12px;
  padding: 8px 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: thin;
  scrollbar-color: var(--wa-scrollbar-thumb) var(--wa-scrollbar-track);

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--wa-scrollbar-track);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--wa-scrollbar-thumb);
    border-radius: 4px;
  }

  > * {
    scroll-snap-align: start;
    flex-shrink: 0;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SKIN-SPECIFIC STYLES */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Classic skin */
:global(.skin-classic) .section-header {
  border: 2px outset #4a4a4a;

  &:active {
    border: 2px inset #4a4a4a;
  }
}

:global(.skin-classic) .section-title {
  text-shadow: 1px 1px 0 #000;
}

/* Modern skin */
:global(.skin-modern) .section-header {
  border-radius: 6px;
  border: 1px solid var(--wa-toolbar-border);
}

:global(.skin-modern) .list-container {
  border-radius: 6px;
}

:global(.skin-modern) .scroll-btn {
  border-radius: 4px;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* RESPONSIVE */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 600px) {
  .section-header {
    padding: 8px;
  }

  .section-title {
    font-size: 11px;
  }

  .header-controls {
    display: none;
  }

  .card-container {
    gap: 8px;
    padding: 8px 0;
  }
}
</style>
