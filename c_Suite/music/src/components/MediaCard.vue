<script setup lang="ts">
import { IMusicItem } from '../types'
import { computed, ref } from 'vue'

const props = defineProps<{
  item: IMusicItem
  mode?: 'list' | 'card'
  index?: number
}>()

const imageError = ref(false)

const getSubtitle = (item: IMusicItem): string => {
  if (item.type === 'album' && 'artistName' in item) return (item as { artistName: string }).artistName
  if (item.type === 'track' && 'artistName' in item) return (item as { artistName: string }).artistName
  if (item.type === 'artist' && 'genre' in item) return (item as { genre: string }).genre || 'Unknown'
  return item.description || 'Unknown'
}

// Generate placeholder based on item name
const getPlaceholderGradient = computed(() => {
  const name = props.item.name || ''
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue1 = hash % 360
  const hue2 = (hash * 2) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 30%), hsl(${hue2}, 60%, 20%))`
})

const getInitials = computed(() => {
  const name = props.item.name || ''
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
})

const displayIndex = computed(() => {
  return props.index !== undefined ? props.index + 1 : '•'
})

const hasValidImage = computed(() => {
  return props.item.image && !props.item.image.includes('placeholder') && !imageError.value
})

const onImageError = () => {
  imageError.value = true
}
</script>

<template>
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- LIST MODE - Playlist Entry Style -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div v-if="mode === 'list' || !mode" class="list-entry" :title="item.name">
    <span class="entry-index">{{ displayIndex }}.</span>
    <span class="entry-title">{{ item.name }}</span>
    <span class="entry-separator">-</span>
    <span class="entry-artist">{{ getSubtitle(item) }}</span>
    <span class="entry-duration">3:45</span>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- CARD MODE - Album Art Style -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <div v-else class="card-entry">
    <!-- Image Container -->
    <div class="card-image-wrapper">
      <!-- Actual Image -->
      <img
        v-if="hasValidImage"
        :src="item.image"
        :alt="item.name"
        class="card-image"
        loading="lazy"
        @error="onImageError"
      />
      <!-- Placeholder when no image -->
      <div v-else class="card-placeholder" :style="{ background: getPlaceholderGradient }">
        <span class="placeholder-initials">{{ getInitials }}</span>
        <div class="placeholder-vinyl"></div>
      </div>
      <!-- Overlay effects -->
      <div class="card-overlay">
        <button class="play-overlay-btn">▶</button>
      </div>
      <div class="card-shine"></div>
    </div>

    <!-- Info Section -->
    <div class="card-info">
      <h4 class="card-title" :title="item.name">{{ item.name }}</h4>
      <p class="card-subtitle" :title="getSubtitle(item)">{{ getSubtitle(item) }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ═══════════════════════════════════════════════════════════════════════════ */
/* LIST MODE STYLES */
/* ═══════════════════════════════════════════════════════════════════════════ */
.list-entry {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    background: var(--wa-highlight-bg);
    color: var(--wa-highlight-text);

    .entry-index,
    .entry-separator,
    .entry-artist,
    .entry-duration {
      color: inherit;
    }
  }

  &:last-child {
    border-bottom: none;
  }
}

.entry-index {
  width: 32px;
  text-align: right;
  padding-right: 8px;
  color: var(--wa-lcd-color);
  font-weight: bold;
}

.entry-title {
  flex: 1;
  color: var(--wa-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.entry-separator {
  padding: 0 8px;
  color: var(--wa-text-dim);
}

.entry-artist {
  flex: 0 0 auto;
  max-width: 200px;
  color: var(--wa-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-duration {
  width: 48px;
  text-align: right;
  color: var(--wa-lcd-color);
  font-family: var(--wa-font-lcd);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* CARD MODE STYLES */
/* ═══════════════════════════════════════════════════════════════════════════ */
.card-entry {
  width: 140px;
  min-width: 140px;
  background: var(--wa-card-bg);
  border: var(--wa-card-border);
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    border-color: var(--wa-card-hover-border);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    .card-overlay {
      opacity: 1;
    }

    .card-title {
      color: var(--wa-card-hover-border);
    }

    .card-shine {
      opacity: 0.1;
      transform: translateX(100%);
    }
  }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #000;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  .card-entry:hover & {
    transform: scale(1.05);
  }
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.placeholder-initials {
  font-size: 32px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.placeholder-vinyl {
  position: absolute;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, #333 0%, #333 15%, transparent 15%),
    repeating-radial-gradient(
      circle at center,
      #1a1a1a 0px,
      #1a1a1a 2px,
      #222 2px,
      #222 4px
    );
  opacity: 0.3;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.play-overlay-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--wa-lcd-color);
  border: none;
  color: #000;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 4px;
  transition: transform 0.1s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  opacity: 0;
  transition: all 0.5s ease;
  pointer-events: none;
}

.card-info {
  padding: 8px;
  background: var(--wa-card-bg);
}

.card-title {
  font-size: 11px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: var(--wa-card-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.card-subtitle {
  font-size: 10px;
  margin: 0;
  color: var(--wa-card-subtitle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SKIN-SPECIFIC ADJUSTMENTS */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Classic skin enhancements */
:global(.skin-classic) .card-entry {
  border: 2px outset #3a3a3a;

  &:hover {
    border: 2px inset #3a3a3a;
  }
}

:global(.skin-classic) .list-entry:hover {
  background: #000080;
}

/* Modern skin enhancements */
:global(.skin-modern) .card-entry {
  border-radius: 8px;

  .card-image-wrapper {
    border-radius: 8px 8px 0 0;
  }
}

:global(.skin-modern) .list-entry {
  border-radius: 4px;
  margin-bottom: 2px;

  &:hover {
    background: rgba(137, 180, 250, 0.2);
  }
}

:global(.skin-modern) .play-overlay-btn {
  border-radius: 50%;
  background: #89b4fa;
}
</style>
