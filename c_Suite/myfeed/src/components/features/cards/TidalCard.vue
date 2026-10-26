<script setup lang="ts">
import { ExternalLink, Music, Disc3, Clock } from 'lucide-vue-next'
import type { TidalTrack } from '@/types/feed'

interface Props {
  track: TidalTrack
}

const props = defineProps<Props>()
const emit = defineEmits<{
  like: []
  bookmark: []
}>()
</script>

<template>
  <GlassCard hover class="tidal-card">
    <ContentHeader
      source="Tidal"
      :publish-date="track._createdAt"
      badge="🎧 Music"
    />

    <!-- Album Art & Track Info -->
    <a
      :href="track.tidalUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="block mb-4 group"
    >
      <div class="flex gap-4">
        <!-- Album Cover -->
        <div class="relative w-24 h-24 rounded-lg overflow-hidden bg-obsidian-800 flex-shrink-0">
          <img
            v-if="track.coverUrl"
            :src="track.coverUrl"
            :alt="track.album || track.title"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-accent/30 to-obsidian-800"
          >
            <Disc3 class="w-10 h-10 text-violet-accent/60" />
          </div>
          <!-- Play overlay on hover -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-violet-accent/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Track Details -->
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-bold text-white mb-1 truncate group-hover:text-violet-accent transition-colors">
            {{ track.title }}
          </h2>
          <p class="text-white/70 text-sm mb-2 truncate">
            {{ track.artist }}
          </p>
          <div class="flex items-center gap-3 text-xs text-white/50">
            <span v-if="track.album" class="flex items-center gap-1 truncate">
              <Music class="w-3 h-3" />
              {{ track.album }}
            </span>
            <span v-if="track.duration" class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ track.duration }}
            </span>
          </div>
        </div>
      </div>
    </a>

    <!-- Listen Button -->
    <a
      :href="track.tidalUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 btn-glass text-sm tidal-btn"
    >
      <span>Listen on Tidal</span>
      <ExternalLink class="w-4 h-4" />
    </a>

    <!-- Actions -->
    <ActionBar
      :likes="track.likes"
      :is-liked="track.isLiked"
      :is-bookmarked="track.isBookmarked"
      @like="emit('like')"
      @bookmark="emit('bookmark')"
    />
  </GlassCard>
</template>

<style scoped>
.tidal-card {
  border-color: rgba(0, 255, 255, 0.2);
}

.tidal-card:hover {
  border-color: rgba(0, 255, 255, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 255, 255, 0.1);
}

.tidal-btn {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(139, 92, 246, 0.2));
  border-color: rgba(0, 255, 255, 0.3);
}

.tidal-btn:hover {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(139, 92, 246, 0.3));
  border-color: rgba(0, 255, 255, 0.5);
}
</style>
