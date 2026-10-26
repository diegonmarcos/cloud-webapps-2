<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import type { ExternalArticle } from '@/types/feed'

interface Props {
  article: ExternalArticle
}

const props = defineProps<Props>()
const emit = defineEmits<{
  like: []
  bookmark: []
}>()
</script>

<template>
  <GlassCard hover>
    <ContentHeader
      :source="article.source.name"
      :publish-date="article.publishDate || article._createdAt"
      :author="article.author?.name"
      badge="🌐 Link"
    />

    <!-- Thumbnail -->
    <a
      :href="article.url"
      target="_blank"
      rel="noopener noreferrer"
      class="block card-media mb-4 group"
    >
      <div class="relative aspect-[4/3] rounded-xl overflow-hidden bg-obsidian-800">
        <img
          :src="article.coverImage || `https://placehold.co/800x600/2d1b4e/8b5cf6?text=${encodeURIComponent(article.source.name)}`"
          :alt="article.title"
          class="w-full h-full object-cover"
        />
        <!-- Overlay on hover -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ExternalLink class="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </a>

    <!-- Title -->
    <h2 class="text-xl font-bold text-white mb-2">
      <a
        :href="article.url"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-violet-accent transition-colors"
      >
        {{ article.title }}
      </a>
    </h2>

    <!-- Excerpt -->
    <p
      v-if="article.excerpt"
      class="text-white/70 mb-3 line-clamp-3"
    >
      {{ article.excerpt }}
    </p>

    <!-- Read More Button -->
    <a
      :href="article.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 btn-glass text-sm"
    >
      Read on {{ article.source.name }}
      <ExternalLink class="w-4 h-4" />
    </a>

    <!-- User Comment -->
    <UserComment
      v-if="article.userComment"
      :comment="article.userComment"
    />

    <!-- Domain Badge -->
    <div class="flex items-center gap-2 mt-4 text-sm text-white/50">
      <span>🔗</span>
      <span>{{ article.source.domain }}</span>
    </div>

    <!-- Actions -->
    <ActionBar
      :likes="article.likes"
      :is-liked="article.isLiked"
      :is-bookmarked="article.isBookmarked"
      @like="emit('like')"
      @bookmark="emit('bookmark')"
    />
  </GlassCard>
</template>
