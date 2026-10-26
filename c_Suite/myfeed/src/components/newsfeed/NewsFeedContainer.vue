<script setup lang="ts">
import { ref } from 'vue'
import TabBar from '../common/TabBar.vue'
import NewsRow from './NewsRow.vue'
import { useRSSFeed } from '../../composables/useRSSFeed'
import { Newspaper, Globe, Cpu, FlaskConical, TrendingUp, RefreshCw } from 'lucide-vue-next'

// Main feed for single category view
const { category, categories, groupedItems, loading, error, loadFeed } = useRSSFeed('headlines')

// Separate feeds for each category in "All" view
const worldFeed = useRSSFeed('world')
const techFeed = useRSSFeed('tech')
const scienceFeed = useRSSFeed('science')
const marketsFeed = useRSSFeed('markets')

const activeTab = ref('all')

// Add "All" tab at the beginning
const tabs = [
  { id: 'all', label: 'All' },
  ...categories.map((c) => ({ id: c.id, label: c.label }))
]

function onTabChange(newCategory: string) {
  activeTab.value = newCategory
  if (newCategory !== 'all') {
    loadFeed(newCategory)
  }
}

function refreshAll() {
  worldFeed.loadFeed('world')
  techFeed.loadFeed('tech')
  scienceFeed.loadFeed('science')
  marketsFeed.loadFeed('markets')
}

function refresh() {
  if (activeTab.value === 'all') {
    refreshAll()
  } else {
    loadFeed()
  }
}
</script>

<template>
  <div class="newsfeed">
    <div class="newsfeed__header">
      <TabBar :tabs="tabs" :active-tab="activeTab" @update:active-tab="onTabChange" />
      <button class="btn btn--ghost btn--icon" @click="refresh()" title="Refresh">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading || worldFeed.loading.value || techFeed.loading.value || scienceFeed.loading.value || marketsFeed.loading.value }" />
      </button>
    </div>

    <!-- All Tab - 4-column grid (World, Tech, Science, Markets) -->
    <div v-if="activeTab === 'all'" class="news-grid">
      <!-- World Column -->
      <div class="news-column">
        <div class="section-header">
          <Globe class="section-header__icon" />
          <span>World</span>
        </div>
        <div v-if="worldFeed.loading.value" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="worldFeed.items.value.length > 0">
          <NewsRow
            v-for="item in worldFeed.items.value.slice(0, 8)"
            :key="item.id"
            :item="item"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No news</p>
        </div>
      </div>

      <!-- Tech Column -->
      <div class="news-column">
        <div class="section-header">
          <Cpu class="section-header__icon" />
          <span>Tech</span>
        </div>
        <div v-if="techFeed.loading.value" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="techFeed.items.value.length > 0">
          <NewsRow
            v-for="item in techFeed.items.value.slice(0, 8)"
            :key="item.id"
            :item="item"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No news</p>
        </div>
      </div>

      <!-- Science Column -->
      <div class="news-column">
        <div class="section-header">
          <FlaskConical class="section-header__icon" />
          <span>Science</span>
        </div>
        <div v-if="scienceFeed.loading.value" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="scienceFeed.items.value.length > 0">
          <NewsRow
            v-for="item in scienceFeed.items.value.slice(0, 8)"
            :key="item.id"
            :item="item"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No news</p>
        </div>
      </div>

      <!-- Markets Column -->
      <div class="news-column">
        <div class="section-header">
          <TrendingUp class="section-header__icon" />
          <span>Markets</span>
        </div>
        <div v-if="marketsFeed.loading.value" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="marketsFeed.items.value.length > 0">
          <NewsRow
            v-for="item in marketsFeed.items.value.slice(0, 8)"
            :key="item.id"
            :item="item"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No news</p>
        </div>
      </div>
    </div>

    <!-- Single Category View -->
    <template v-else>
      <div v-if="loading && groupedItems.length === 0" class="p-4 text-text-tertiary text-sm">
        Loading news...
      </div>

      <div v-else-if="error" class="error-state m-4">
        <p class="error-state__message">{{ error }}</p>
      </div>

      <div v-else-if="groupedItems.length > 0" class="feed-list">
        <template v-for="group in groupedItems" :key="group.label">
          <div class="time-group">{{ group.label }}</div>
          <NewsRow
            v-for="item in group.items"
            :key="item.id"
            :item="item"
          />
        </template>
      </div>

      <div v-else class="empty-state">
        <Newspaper class="empty-state__icon" />
        <p class="empty-state__title">No news available</p>
        <p class="empty-state__description">Try refreshing or selecting another category</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.newsfeed__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface, #161b22);
}

.newsfeed__header .tab-bar {
  flex: 1;
  border-bottom: none;
}

/* 4-column grid layout for "All" tab */
.news-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border-primary, #30363d);
  min-height: 0;
}

.news-column {
  background: var(--bg-primary, #0d1117);
  min-width: 0;
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

.news-column .section-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-surface, #161b22);
}

.empty-state--compact {
  padding: 1rem;
}

.empty-state--compact .empty-state__title {
  font-size: 0.75rem;
}

/* Responsive: adjust columns on smaller screens */
@media (max-width: 768px) {
  .news-grid {
    grid-template-columns: 1fr;
  }

  .news-column {
    max-height: none;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) and (max-width: 1400px) {
  .news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
