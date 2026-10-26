<script setup lang="ts">
import { ExternalLink, CheckCircle } from 'lucide-vue-next'
import type { Tweet } from '@/types/feed'

interface Props {
  tweet: Tweet
}

const props = defineProps<Props>()
const emit = defineEmits<{
  like: []
  bookmark: []
}>()

// Parse tweet content for hashtags and mentions
const formattedContent = computed(() => {
  let content = props.tweet.content

  // Highlight hashtags
  content = content.replace(/#(\w+)/g, '<span class="text-violet-accent">#$1</span>')

  // Highlight mentions
  content = content.replace(/@(\w+)/g, '<span class="text-violet-accent">@$1</span>')

  return content
})
</script>

<template>
  <GlassCard hover>
    <!-- Tweet Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-violet-accent to-obsidian-600 flex items-center justify-center">
          <span class="text-white font-bold text-lg">
            {{ tweet.author.name[0] }}
          </span>
        </div>

        <!-- Author Info -->
        <div>
          <div class="flex items-center gap-1">
            <span class="font-bold text-white">{{ tweet.author.name }}</span>
            <CheckCircle
              v-if="tweet.author.verified"
              class="w-4 h-4 text-blue-400 fill-blue-400"
            />
          </div>
          <span class="text-sm text-white/50">{{ tweet.author.handle }}</span>
        </div>
      </div>

      <!-- Twitter Badge -->
      <div class="badge badge-purple">
        𝕏 Tweet
      </div>
    </div>

    <!-- Tweet Content -->
    <div
      class="text-white leading-relaxed mb-3 whitespace-pre-wrap"
      v-html="formattedContent"
    />

    <!-- Media (if any) -->
    <div
      v-if="tweet.media && tweet.media.length > 0"
      class="grid gap-2 mb-3"
      :class="{
        'grid-cols-1': tweet.media.length === 1,
        'grid-cols-2': tweet.media.length > 1,
      }"
    >
      <div
        v-for="(media, index) in tweet.media.slice(0, 4)"
        :key="index"
        class="aspect-video rounded-xl overflow-hidden bg-obsidian-800"
      >
        <img
          :src="media.url"
          :alt="media.alt || 'Tweet media'"
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- Twitter Engagement -->
    <div
      v-if="tweet.twitterEngagement"
      class="flex items-center gap-4 text-sm text-white/50 mb-3 pb-3 border-b border-white/10"
    >
      <span>💬 {{ tweet.twitterEngagement.replies }}</span>
      <span>🔁 {{ tweet.twitterEngagement.retweets }}</span>
      <span>❤️ {{ tweet.twitterEngagement.likes }}</span>
      <span
        v-if="tweet.twitterEngagement.views"
        class="ml-auto"
      >
        👁️ {{ tweet.twitterEngagement.views }}
      </span>
    </div>

    <!-- User Comment -->
    <UserComment
      v-if="tweet.userComment"
      :comment="tweet.userComment"
    />

    <!-- View on Twitter -->
    <a
      v-if="tweet.url"
      :href="tweet.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 text-sm text-violet-accent hover:text-violet-glow transition-colors mb-3"
    >
      View on 𝕏
      <ExternalLink class="w-4 h-4" />
    </a>

    <!-- Actions -->
    <ActionBar
      :likes="tweet.likes"
      :is-liked="tweet.isLiked"
      :is-bookmarked="tweet.isBookmarked"
      @like="emit('like')"
      @bookmark="emit('bookmark')"
    />
  </GlassCard>
</template>
