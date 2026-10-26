<script setup lang="ts">
import { ref } from 'vue'
import CloudFeedContainer from './CloudFeedContainer.vue'
import CloudFeedRSS from './CloudFeedRSS.vue'

const activeMode = ref<'api' | 'rss'>('rss')
</script>

<template>
  <div class="cloudfeed-wrapper">
    <!-- Mode Toggle -->
    <div class="mode-toggle">
      <button
        class="mode-btn"
        :class="{ active: activeMode === 'api' }"
        @click="activeMode = 'api'"
      >
        API
      </button>
      <button
        class="mode-btn"
        :class="{ active: activeMode === 'rss' }"
        @click="activeMode = 'rss'"
      >
        RSS (Direct)
      </button>
    </div>

    <!-- Content -->
    <CloudFeedContainer v-if="activeMode === 'api'" />
    <CloudFeedRSS v-else />
  </div>
</template>

<style scoped>
.cloudfeed-wrapper {
  width: 100%;
}

.mode-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary, #161b22);
  border-bottom: 1px solid var(--border-default, #30363d);
}

.mode-btn {
  padding: 0.4rem 0.75rem;
  background: var(--bg-tertiary, #21262d);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 6px;
  color: var(--text-secondary, #8b949e);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn:hover {
  background: var(--bg-hover, #30363d);
  color: var(--text-primary, #e6edf3);
}

.mode-btn.active {
  background: var(--accent-blue, #238636);
  border-color: var(--accent-blue, #238636);
  color: #fff;
}
</style>
