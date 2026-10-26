<script setup lang="ts">
import { Search, Moon, Sun, Heart, Bookmark, Sparkles } from 'lucide-vue-next'
import { useFeedStore } from '@/stores/feedStore'
import type { FeedFilterType } from '@/types/feed'

const feedStore = useFeedStore()

const filterOptions: { value: FeedFilterType; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📚' },
  { value: 'markdown', label: 'Articles', emoji: '📝' },
  { value: 'youtube', label: 'Videos', emoji: '📺' },
  { value: 'article', label: 'Links', emoji: '🌐' },
  { value: 'tweet', label: 'Tweets', emoji: '𝕏' },
]

const searchQuery = computed({
  get: () => feedStore.searchQuery,
  set: (value) => feedStore.setSearchQuery(value),
})

function selectFilter(type: FeedFilterType) {
  feedStore.setFilterType(type)
}
</script>

<template>
  <header class="header-glass sticky top-0 z-50">
    <div class="max-w-[1400px] mx-auto px-4 py-4">
      <!-- Top Row: Logo and Actions -->
      <div class="flex items-center justify-between mb-4">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="pixel-logo w-12 h-12 rounded-xl bg-gradient-to-br from-violet-accent to-obsidian-600 flex items-center justify-center">
            <span class="text-2xl">🍎</span>
          </div>
          <div>
            <h1 class="text-xl font-pixel text-gradient-purple tracking-wider">
              MYFEED
            </h1>
            <p class="text-sm font-pixel-body text-white/50">
              Apple Glassy Pixel Art
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-4">
          <!-- Stats -->
          <div class="hidden md:flex items-center gap-4 text-sm">
            <div class="stat-badge">
              <Heart class="w-4 h-4 text-apple-pink" />
              <span class="font-pixel-body">{{ feedStore.likeCount }}</span>
            </div>
            <div class="stat-badge">
              <Bookmark class="w-4 h-4 text-apple-orange" />
              <span class="font-pixel-body">{{ feedStore.bookmarkCount }}</span>
            </div>
          </div>

          <!-- Theme Toggle -->
          <button
            class="theme-toggle"
            aria-label="Toggle theme"
            @click="feedStore.toggleTheme()"
          >
            <Moon
              v-if="feedStore.theme === 'dark'"
              class="w-5 h-5"
            />
            <Sun
              v-else
              class="w-5 h-5 text-apple-orange"
            />
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="relative mb-4">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search content..."
          class="search-input w-full pl-12 pr-4"
        />
        <Sparkles class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-accent/50" />
      </div>

      <!-- Filter Chips -->
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          :class="[
            'filter-chip',
            feedStore.selectedType === filter.value && 'filter-chip-active'
          ]"
          @click="selectFilter(filter.value)"
        >
          <span class="text-base">{{ filter.emoji }}</span>
          <span class="font-pixel-body text-sm">{{ filter.label }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-glass {
  background: rgba(20, 20, 36, 0.85);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-bottom: 2px solid rgba(139, 92, 246, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 60px rgba(139, 92, 246, 0.1);
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
}

.theme-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.2);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.theme-toggle:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  transform: scale(1.05);
}

.search-input {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  color: white;
  padding: 0.875rem 1rem;
  font-family: 'VT323', 'Courier New', monospace;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow:
    0 0 0 4px rgba(139, 92, 246, 0.15),
    0 0 30px rgba(139, 92, 246, 0.2);
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(26, 26, 46, 0.5);
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.filter-chip:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: white;
  transform: translateY(-2px);
}

.filter-chip-active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(0, 212, 255, 0.3));
  border-color: rgba(139, 92, 246, 0.6);
  color: white;
  box-shadow:
    0 4px 15px rgba(139, 92, 246, 0.4),
    0 0 30px rgba(139, 92, 246, 0.2);
}

.filter-chip-active:hover {
  transform: translateY(-2px) scale(1.02);
}

/* Scrollbar styling */
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}
</style>
