<script setup lang="ts">
import { Music, Heart, ExternalLink } from 'lucide-vue-next'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration?: string
  url?: string
  isFavorite?: boolean
  coverUrl?: string
}

interface Props {
  track: Track
}

defineProps<Props>()
</script>

<template>
  <div class="row">
    <div v-if="track.coverUrl" class="row__thumbnail">
      <img :src="track.coverUrl" :alt="track.album || track.title" loading="lazy" />
    </div>
    <Music v-else class="row__icon icon icon--music" />
    <div class="row__content">
      <div class="row__title">
        {{ track.artist }} - {{ track.title }}
      </div>
      <div v-if="track.album" class="row__meta">
        <span>{{ track.album }}</span>
        <span v-if="track.duration">{{ track.duration }}</span>
      </div>
    </div>
    <Heart
      v-if="track.isFavorite"
      class="w-3.5 h-3.5 text-accent-red fill-accent-red"
    />
    <a
      v-if="track.url"
      :href="track.url"
      target="_blank"
      rel="noopener"
      class="btn btn--ghost btn--icon"
    >
      <ExternalLink class="w-3.5 h-3.5" />
    </a>
  </div>
</template>

<style scoped>
.row__thumbnail {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-elevated, #21262d);
}

.row__thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
