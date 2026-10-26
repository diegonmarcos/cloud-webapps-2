<script setup lang="ts">
import { ref } from 'vue'
import Header from './components/layout/Header.vue'
import MyFeedContainer from './components/myfeed/MyFeedContainer.vue'
import NewsFeedContainer from './components/newsfeed/NewsFeedContainer.vue'
import CloudFeedWrapper from './components/cloudfeed/CloudFeedWrapper.vue'

const activeSection = ref<'myfeed' | 'newsfeed' | 'cloudfeed'>('myfeed')
const searchQuery = ref('')
</script>

<template>
  <div class="app-container">
    <!-- Header -->
    <Header
      :active-section="activeSection"
      :search-query="searchQuery"
      @update:active-section="activeSection = $event"
      @update:search-query="searchQuery = $event"
    />

    <!-- Main Content -->
    <main class="main-content">
      <!-- MyFeed Section -->
      <MyFeedContainer v-if="activeSection === 'myfeed'" />

      <!-- NewsFeed Section -->
      <NewsFeedContainer v-else-if="activeSection === 'newsfeed'" />

      <!-- CloudFeed Section (with API/RSS toggle) -->
      <CloudFeedWrapper v-else-if="activeSection === 'cloudfeed'" />
    </main>

    <!-- Linktree Button (Fixed Corner) -->
    <a
      href="https://linktree.diegonmarcos.com"
      target="_blank"
      rel="noopener"
      class="linktree-corner"
      title="Linktree"
    >
      🔗
    </a>
  </div>
</template>

<style scoped>
.linktree-corner {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-elevated, #21262d);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 50%;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.15s ease;
}

.linktree-corner:hover {
  background: var(--bg-hover, #30363d);
  transform: scale(1.05);
}
</style>
