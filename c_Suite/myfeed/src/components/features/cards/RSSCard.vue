<script setup lang="ts">
import { Rss, ExternalLink } from 'lucide-vue-next'
import type { RSSItem } from '@/types/feed'

interface Props {
  item: RSSItem
}

const props = defineProps<Props>()
const emit = defineEmits<{
  like: []
  bookmark: []
}>()
</script>

<template>
  <GlassCard hover>
    <!-- Header with RSS Icon -->
    <div class="flex items-center gap-2 mb-3">
      <div class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
        <Rss class="w-4 h-4 text-orange-400" />
      </div>
      <div class="flex-1">
        <p class="font-semibold text-white">{{ item.feed.name }}</p>
        <p class="text-xs text-white/50">{{ item.feed.category || 'RSS Feed' }}</p>
      </div>
      <div class="badge badge-purple">
        📡 RSS
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-bold text-white mb-2">
      <a
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-violet-accent transition-colors"
      >
        {{ item.title }}
      </a>
    </h3>

    <!-- Summary or Content -->
    <div
      v-if="item.summary || item.content"
      class="text-white/70 text-sm mb-3 line-clamp-3"
      v-html="item.summary || item.content"
    />

    <!-- Read More -->
    <a
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 text-violet-accent hover:text-violet-glow text-sm font-medium transition-colors"
    >
      Read Full Article
      <ExternalLink class="w-4 h-4" />
    </a>

    <!-- User Comment -->
    <UserComment
      v-if="item.userComment"
      :comment="item.userComment"
    />

    <!-- Categories/Tags -->
    <div
      v-if="item.categories && item.categories.length > 0"
      class="flex flex-wrap gap-2 mt-3"
    >
      <span
        v-for="category in item.categories.slice(0, 4)"
        :key="category"
        class="tag-pill"
      >
        {{ category }}
      </span>
    </div>

    <!-- Actions -->
    <ActionBar
      :likes="item.likes"
      :is-liked="item.isLiked"
      :is-bookmarked="item.isBookmarked"
      @like="emit('like')"
      @bookmark="emit('bookmark')"
    />
  </GlassCard>
</template>
