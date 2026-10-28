<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  message: string
}>()

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(true)
let timer: ReturnType<typeof setTimeout>

onMounted(() => {
  timer = setTimeout(() => {
    isVisible.value = false
    setTimeout(() => emit('close'), 300)
  }, 2000)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div :class="['notification', { hidden: !isVisible }]">
    {{ message }}
  </div>
</template>

<style scoped>
.notification {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--accent-primary);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s ease;
}

.notification.hidden {
  opacity: 0;
  transform: translateX(1rem);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(1rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
