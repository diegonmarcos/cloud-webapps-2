<script setup lang="ts">
defineProps<{
  modelValue: string
  error: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  format: []
  minify: []
  copy: []
}>()
</script>

<template>
  <div class="editor-panel">
    <div class="editor-toolbar">
      <div class="toolbar-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span>Editor</span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn" title="Format" @click="emit('format')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5,3 19,12 5,21 5,3" />
          </svg>
        </button>
        <button class="toolbar-btn" title="Minify" @click="emit('minify')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4,14 10,14 10,20" />
            <polyline points="20,10 14,10 14,4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button class="toolbar-btn" title="Copy" @click="emit('copy')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    </div>

    <div class="editor-content">
      <textarea
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        spellcheck="false"
        class="editor-textarea"
      ></textarea>
      <div v-if="error" class="error-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}

.editor-toolbar {
  background: rgba(15, 23, 42, 0.5);
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.toolbar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: 8px;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.toolbar-btn {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;

  &:hover {
    background: var(--color-border);
    color: var(--color-accent);
  }
}

.editor-content {
  flex: 1;
  position: relative;
  height: 100%;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 14px;
  padding: 16px;
  resize: none;
  border: none;
  outline: none;
}

.error-banner {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: rgba(127, 29, 29, 0.9);
  border: 1px solid rgb(185, 28, 28);
  color: rgb(254, 202, 202);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(4px);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
