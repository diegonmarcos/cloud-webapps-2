<script setup lang="ts">
import type { ViewType } from '../lib/types'
import { icons } from '../lib/services'
import SvgIcon from './SvgIcon.vue'

const model = defineModel<ViewType>()

const viewGroups = [
  {
    label: 'Services',
    views: [
      { id: 'cards' as ViewType, label: 'Cards', icon: icons.cards },
      { id: 'tree' as ViewType, label: 'Tree', icon: icons.tree },
    ],
  },
  {
    label: 'Architecture',
    views: [
      { id: 'architecture' as ViewType, label: 'Server', icon: icons.architecture },
      { id: 'ai-architecture' as ViewType, label: 'AI', icon: icons.ai },
    ],
  },
]
</script>

<template>
  <div class="view-toggle">
    <div v-for="(group, idx) in viewGroups" :key="group.label" class="group">
      <span v-if="idx > 0" class="divider" />
      <span class="group-label">{{ group.label }}</span>
      <div class="buttons">
        <button
          v-for="view in group.views"
          :key="view.id"
          @click="model = view.id"
          :class="['view-btn', { active: model === view.id }]"
        >
          <SvgIcon :path="view.icon" class="icon" />
          {{ view.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-toggle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.divider {
  display: none;
  width: 1px;
  height: 2rem;
  background: var(--border-color);
  margin: 0 0.5rem;
}

@media (min-width: 640px) {
  .divider {
    display: block;
  }
}

.group-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.buttons {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-secondary);
  padding: 0.25rem;
  border-radius: var(--border-radius);
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.view-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.view-btn.active {
  background: var(--accent-primary);
  color: black;
  font-weight: bold;
}

.icon {
  width: 1rem;
  height: 1rem;
}
</style>
