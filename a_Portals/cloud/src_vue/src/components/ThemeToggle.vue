<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Theme } from '../lib/types'

const theme = ref<Theme>('blurred')
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
  const saved = localStorage.getItem('cloud-dashboard-theme') as Theme
  if (saved) {
    theme.value = saved
    document.documentElement.setAttribute('data-theme', saved)
  }
})

function toggleTheme() {
  const newTheme: Theme = theme.value === 'minimalistic' ? 'blurred' : 'minimalistic'
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('cloud-dashboard-theme', newTheme)
}
</script>

<template>
  <button
    v-if="mounted"
    @click="toggleTheme"
    class="theme-toggle"
    title="Switch theme"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
    <span class="label">{{ theme }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.theme-toggle:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-primary);
}

.icon {
  width: 1rem;
  height: 1rem;
}

.label {
  font-size: 0.75rem;
  text-transform: capitalize;
}
</style>
