<script setup lang="ts">
import { Play, Clock, ExternalLink } from 'lucide-vue-next'
import { computed } from 'vue'

interface Video {
  id: string
  title: string
  channel: string
  channelUrl?: string
  duration?: string
  thumbnail?: string
  url: string
  publishedAt?: string
}

interface Props {
  video: Video
}

const props = defineProps<Props>()

const timeAgo = computed(() => {
  if (!props.video.publishedAt) return ''
  const date = new Date(props.video.publishedAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (days < 7) return `${days}d`
  if (weeks < 4) return `${weeks}w`
  return `${months}mo`
})
</script>

<template>
  <div class="row">
    <div v-if="video.thumbnail" class="row__thumbnail">
      <img :src="video.thumbnail" :alt="video.title" loading="lazy" />
    </div>
    <Play v-else class="row__icon icon icon--video" />
    <div class="row__content">
      <div class="row__title">
        <a :href="video.url" target="_blank" rel="noopener">{{ video.title }}</a>
      </div>
      <div class="row__meta">
        <span>{{ video.channel }}</span>
        <span v-if="video.duration" class="flex items-center gap-1">
          <Clock class="w-3 h-3" />
          {{ video.duration }}
        </span>
        <span v-if="timeAgo">{{ timeAgo }}</span>
      </div>
    </div>
    <a :href="video.url" target="_blank" rel="noopener" class="btn btn--ghost btn--icon">
      <ExternalLink class="w-3.5 h-3.5" />
    </a>
  </div>
</template>

<style scoped>
.row__thumbnail {
  flex-shrink: 0;
  width: 64px;
  height: 36px;
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
