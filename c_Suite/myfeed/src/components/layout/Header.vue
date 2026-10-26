<script setup lang="ts">
import { Search } from 'lucide-vue-next'

interface Props {
  activeSection: 'myfeed' | 'newsfeed' | 'cloudfeed'
  searchQuery?: string
}

interface Emits {
  (e: 'update:activeSection', value: 'myfeed' | 'newsfeed' | 'cloudfeed'): void
  (e: 'update:searchQuery', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <div class="header__logo">MyFeed</div>

      <nav class="section-tabs">
        <button
          class="section-tab"
          :class="{ 'section-tab--active': activeSection === 'myfeed' }"
          @click="$emit('update:activeSection', 'myfeed')"
        >
          MyFeed
        </button>
        <button
          class="section-tab"
          :class="{ 'section-tab--active': activeSection === 'newsfeed' }"
          @click="$emit('update:activeSection', 'newsfeed')"
        >
          NewsFeed
        </button>
        <button
          class="section-tab"
          :class="{ 'section-tab--active': activeSection === 'cloudfeed' }"
          @click="$emit('update:activeSection', 'cloudfeed')"
        >
          CloudFeed
        </button>
      </nav>

      <div class="header__search">
        <div class="relative">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            class="search-input pl-8"
            placeholder="Search..."
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </header>
</template>
