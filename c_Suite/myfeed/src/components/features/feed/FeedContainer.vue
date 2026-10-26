<script setup lang="ts">
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import { useFeedStore } from '@/stores/feedStore'
import { sampleFeed } from '@/data/sampleFeed'
import { useYouTubeFeed } from '@/composables/useYouTubeFeed'
import { useTidalFeed } from '@/composables/useTidalFeed'
import type { FeedItem, FeedFilterType } from '@/types/feed'
import MarkdownCard from '../cards/MarkdownCard.vue'
import YouTubeCard from '../cards/YouTubeCard.vue'
import ArticleCard from '../cards/ArticleCard.vue'
import TweetCard from '../cards/TweetCard.vue'
import RSSCard from '../cards/RSSCard.vue'
import TidalCard from '../cards/TidalCard.vue'

// Props for filtering
const props = withDefaults(defineProps<{
  excludeTypes?: FeedFilterType[]
  onlyTypes?: FeedFilterType[]
}>(), {
  excludeTypes: () => [],
  onlyTypes: () => []
})

const feedStore = useFeedStore()

// YouTube playlists feeds
const { videos: musicVideos } = useYouTubeFeed({
  playlistId: 'PLXEvzcFfwK5M3Z0EtjK_HvaBgUNLKkOE7',
  label: '🎵 MUSIC',
  maxItems: 15
})

const { videos: csNewsVideos } = useYouTubeFeed({
  playlistId: 'PLXEvzcFfwK5Pto5dazySakJje8s2ufSJh',
  label: '📰 CS_NEWS',
  maxItems: 15
})

// Tidal music feed
const { tracks: tidalTracks } = useTidalFeed({
  username: 'diegonmarcos',
  label: '🎧 TIDAL',
  maxItems: 10
})

// Auto-animate container
const [parent] = useAutoAnimate()

// Combined feed items (sample + YouTube playlists + Tidal)
const items = computed<FeedItem[]>(() => {
  // Merge all feeds
  const combined = [
    ...sampleFeed,
    ...musicVideos.value,
    ...csNewsVideos.value,
    ...tidalTracks.value
  ]
  // Sort by creation date (newest first)
  return combined.sort((a, b) =>
    new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
  )
})

// Filtered and sorted items
const filteredItems = computed(() => {
  let filtered = feedStore.filterItems(items.value)

  // Apply excludeTypes filter
  if (props.excludeTypes.length > 0) {
    filtered = filtered.filter(item => !props.excludeTypes.includes(item.type as FeedFilterType))
  }

  // Apply onlyTypes filter
  if (props.onlyTypes.length > 0) {
    filtered = filtered.filter(item => props.onlyTypes.includes(item.type as FeedFilterType))
  }

  return filtered
})

// Handle likes and bookmarks (state persisted in store)
function handleLike(item: FeedItem) {
  feedStore.toggleLike(item.id)
}

function handleBookmark(item: FeedItem) {
  feedStore.toggleBookmark(item.id)
}

// Get component for feed item type
function getCardComponent(type: string) {
  const components = {
    markdown: MarkdownCard,
    youtube: YouTubeCard,
    article: ArticleCard,
    tweet: TweetCard,
    rss: RSSCard,
    tidal: TidalCard,
  }
  return components[type as keyof typeof components]
}

// Get props name for component
function getPropsName(type: string) {
  const propsNames = {
    markdown: 'article',
    youtube: 'video',
    article: 'article',
    tweet: 'tweet',
    rss: 'item',
    tidal: 'track',
  }
  return propsNames[type as keyof typeof propsNames]
}
</script>

<template>
  <div class="max-w-[900px] mx-auto px-4 py-8">
    <!-- Empty State -->
    <div
      v-if="filteredItems.length === 0"
      class="glass-card p-12 text-center"
    >
      <div class="text-6xl mb-4">
        📭
      </div>
      <h3 class="text-2xl font-bold mb-2">
        No items found
      </h3>
      <p class="text-white/60 mb-6">
        Try adjusting your filters or search query
      </p>
      <button
        class="btn-primary"
        @click="feedStore.setFilterType('all')"
      >
        View All Items
      </button>
    </div>

    <!-- Feed Items with Auto-Animate -->
    <div
      v-else
      ref="parent"
      class="space-y-6"
    >
      <component
        :is="getCardComponent(item.type)"
        v-for="item in filteredItems"
        :key="item.id"
        v-bind="{ [getPropsName(item.type)]: item }"
        @like="handleLike(item)"
        @bookmark="handleBookmark(item)"
      />
    </div>

    <!-- Load More (Future) -->
    <!-- <div v-if="hasMore" class="text-center mt-8">
      <button class="btn-glass">
        Load More
      </button>
    </div> -->
  </div>
</template>
