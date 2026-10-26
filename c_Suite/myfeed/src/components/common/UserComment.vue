<script setup lang="ts">
import { Quote } from 'lucide-vue-next'

interface Props {
  comment: string
}

defineProps<Props>()
</script>

<template>
  <div class="my-4 relative">
    <div class="absolute -left-1 top-0 text-violet-accent/30">
      <Quote class="w-6 h-6" />
    </div>
    <div class="pl-6 py-3 pr-4 bg-violet-accent/10 border-l-3 border-violet-accent rounded-r-lg">
      <p class="text-white/90 italic leading-relaxed">
        {{ comment }}
      </p>
      <p class="text-xs text-violet-glow mt-2">
        — Your thoughts
      </p>
    </div>
  </div>
</template>

<style scoped>
.border-l-3 {
  border-left-width: 3px;
}
</style>
