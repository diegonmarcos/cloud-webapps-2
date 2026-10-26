<script setup lang="ts">
import { Newspaper, ExternalLink } from 'lucide-vue-next'
import { computed } from 'vue'

interface NewsItem {
  id: string
  title: string
  description?: string
  source: string
  sourceUrl?: string
  url: string
  publishedAt: string
  category?: string
  thumbnail?: string
}

interface Props {
  item: NewsItem
}

const props = defineProps<Props>()

const timeAgo = computed(() => {
  const date = new Date(props.item.publishedAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
})
</script>

<template>
  <a
    :href="item.url"
    target="_blank"
    rel="noopener"
    class="row"
  >
    <div v-if="item.thumbnail" class="row__thumbnail">
      <img :src="item.thumbnail" :alt="item.title" loading="lazy" />
    </div>
    <Newspaper v-else class="row__icon icon icon--news" />
    <div class="row__content">
      <div class="row__title">{{ item.title }}</div>
      <div v-if="item.description" class="row__description">
        {{ item.description }}
      </div>
      <div class="row__meta">
        <span class="row__source">{{ item.source }}</span>
        <span class="row__time">{{ timeAgo }}</span>
      </div>
    </div>
    <ExternalLink class="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
  </a>
</template>

<style scoped>
.row {
  text-decoration: none;
  cursor: pointer;
}

.row:hover {
  text-decoration: none;
}

.row__thumbnail {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-elevated, #21262d);
}

.row__thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.row__title {
  color: var(--text-primary, #e6edf3);
}

.row:hover .row__title {
  color: var(--text-link, #58a6ff);
}
</style>
