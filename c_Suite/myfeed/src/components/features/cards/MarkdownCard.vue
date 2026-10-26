<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ChevronDown, ChevronUp, Clock } from 'lucide-vue-next'
import type { MarkdownArticle } from '@/types/feed'

interface Props {
  article: MarkdownArticle
}

const props = defineProps<Props>()
const emit = defineEmits<{
  like: []
  bookmark: []
}>()

const expanded = ref(false)

const renderedContent = computed(() => {
  const content = expanded.value ? props.article.content : props.article.excerpt || ''
  const html = marked(content)
  return DOMPurify.sanitize(html)
})
</script>

<template>
  <GlassCard hover>
    <ContentHeader
      :author="article.author.name"
      :publish-date="article.publishDate"
      badge="📝 Article"
    />

    <!-- Title -->
    <h2 class="text-2xl font-bold text-white mb-3">
      {{ article.title }}
    </h2>

    <!-- Cover Image -->
    <div
      v-if="article.coverImage"
      class="card-media mb-4"
    >
      <img
        :src="article.coverImage.url || `https://placehold.co/800x400/2d1b4e/8b5cf6?text=${encodeURIComponent(article.title)}`"
        :alt="article.coverImage.alt || article.title"
        class="w-full h-64 object-cover"
      />
    </div>

    <!-- Content -->
    <div
      :class="[
        'prose',
        { 'line-clamp-3': !expanded },
      ]"
      v-html="renderedContent"
    />

    <!-- Read More/Less -->
    <button
      class="flex items-center gap-2 text-violet-accent hover:text-violet-glow mt-4 font-medium transition-colors"
      @click="expanded = !expanded"
    >
      <component
        :is="expanded ? ChevronUp : ChevronDown"
        class="w-5 h-5"
      />
      {{ expanded ? 'Read Less' : 'Read More' }}
      <span
        v-if="!expanded && article.readTime"
        class="flex items-center gap-1 text-sm text-white/50"
      >
        <Clock class="w-4 h-4" />
        {{ article.readTime }} min
      </span>
    </button>

    <!-- User Comment -->
    <UserComment
      v-if="article.userComment"
      :comment="article.userComment"
    />

    <!-- Tags -->
    <div
      v-if="article.tags?.length"
      class="flex flex-wrap gap-2 mt-4"
    >
      <span
        v-for="tag in article.tags"
        :key="tag"
        class="tag-pill"
      >
        #{{ tag }}
      </span>
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
