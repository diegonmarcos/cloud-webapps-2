<script setup lang="ts">
// Skeleton loading card
</script>

<template>
  <div class="glass-card p-6">
    <!-- Header skeleton -->
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-full skeleton" />
      <div class="flex-1">
        <div class="h-4 w-32 skeleton rounded mb-2" />
        <div class="h-3 w-24 skeleton rounded" />
      </div>
      <div class="h-6 w-12 skeleton rounded-full" />
    </div>

    <!-- Title skeleton -->
    <div class="h-6 w-3/4 skeleton rounded mb-3" />

    <!-- Image skeleton -->
    <div class="h-48 w-full skeleton rounded-xl mb-4" />

    <!-- Content skeleton -->
    <div class="space-y-2 mb-4">
      <div class="h-4 w-full skeleton rounded" />
      <div class="h-4 w-full skeleton rounded" />
      <div class="h-4 w-2/3 skeleton rounded" />
    </div>

    <!-- Tags skeleton -->
    <div class="flex gap-2 mb-4">
      <div class="h-6 w-16 skeleton rounded-full" />
      <div class="h-6 w-20 skeleton rounded-full" />
      <div class="h-6 w-14 skeleton rounded-full" />
    </div>

    <!-- Action bar skeleton -->
    <div class="flex gap-6 pt-4 border-t border-white/10">
      <div class="h-5 w-12 skeleton rounded" />
      <div class="h-5 w-12 skeleton rounded" />
      <div class="h-5 w-12 skeleton rounded" />
    </div>
  </div>
</template>
