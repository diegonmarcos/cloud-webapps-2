<script setup lang="ts">
import type { OpenDoc } from '@/types/json'

defineProps<{
  openDocs: OpenDoc[]
  activeDocIndex: number
  isSaving: boolean
}>()

const emit = defineEmits<{
  'update:activeDocIndex': [value: number]
  closeTab: [index: number]
  exportJson: []
  exportMd: []
  exportCsv: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="logo">
      <div class="logo-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
          <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
        </svg>
      </div>
      <h1>JSON Vision</h1>
    </div>

    <div class="tabs">
      <div
        v-for="(doc, idx) in openDocs"
        :key="`${doc.filename}-${idx}`"
        :class="['tab', { active: activeDocIndex === idx }]"
        @click="emit('update:activeDocIndex', idx)"
      >
        <svg class="tab-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span class="tab-name">{{ doc.filename }}</span>
        <span v-if="doc.content !== doc.originalContent && !isSaving" class="unsaved-dot"></span>
        <svg v-if="isSaving && activeDocIndex === idx" class="saving-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23,4 23,10 17,10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span v-if="doc.pinned" class="pin-icon" title="Pinned">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="5"/></svg>
        </span>
        <button v-else class="tab-close" @click.stop="emit('closeTab', idx)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn" :disabled="activeDocIndex === -1" @click="emit('exportJson')" title="Export as JSON">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>JSON</span>
      </button>
      <button class="action-btn" :disabled="activeDocIndex === -1" @click="emit('exportMd')" title="Export as Markdown">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>MD</span>
      </button>
      <button class="action-btn" :disabled="activeDocIndex === -1" @click="emit('exportCsv')" title="Export as CSV">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>CSV</span>
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  background: var(--color-accent);
  padding: 6px;
  border-radius: 8px;
  display: flex;
  color: white;
}

h1 {
  font-weight: 700;
  font-size: 1rem;
  color: white;
  margin: 0;
}

.tabs {
  flex: 1;
  margin: 0 16px;
  display: flex;
  gap: 4px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px 6px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  font-size: 12px;
  cursor: pointer;
  min-width: 100px;
  max-width: 200px;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &.active {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border);
    color: white;

    .tab-icon {
      color: var(--color-accent);
    }
  }
}

.tab-icon {
  flex-shrink: 0;
}

.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unsaved-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warning);
  flex-shrink: 0;
}

.saving-icon {
  animation: spin 1s linear infinite;
  color: var(--color-success);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pin-icon { flex-shrink: 0; color: var(--color-accent); display: flex; opacity: 0.6; }

.tab-close {
  background: none;
  border: none;
  padding: 2px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;

  &:hover {
    background: var(--color-border);
  }
}

.actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  cursor: pointer;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  transition: all 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  span {
    @media (max-width: 640px) {
      display: none;
    }
  }
}
</style>
