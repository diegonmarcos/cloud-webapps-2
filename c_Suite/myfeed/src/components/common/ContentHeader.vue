<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'

interface Props {
  author?: string
  source?: string
  publishDate: string | Date
  avatar?: string
  badge?: string
  badgeColor?: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  const date = typeof props.publishDate === 'string'
    ? new Date(props.publishDate)
    : props.publishDate
  return formatDistanceToNow(date, { addSuffix: true })
})
</script>

<template>
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-center gap-3 flex-1">
      <!-- Avatar -->
      <div
        v-if="avatar"
        class="w-10 h-10 rounded-full overflow-hidden bg-obsidian-700 flex-shrink-0"
      >
        <img
          :src="avatar"
          :alt="author || source"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        v-else
        class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-accent to-obsidian-600 flex items-center justify-center flex-shrink-0"
      >
        <span class="text-white font-semibold text-sm">
          {{ (author || source || '?')[0].toUpperCase() }}
        </span>
      </div>

      <!-- Author/Source Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p
            v-if="author"
            class="font-semibold text-white truncate"
          >
            {{ author }}
          </p>
          <span
            v-if="source && author"
            class="text-white/50"
          >·</span>
          <p
            v-if="source"
            class="text-white/70 truncate"
          >
            {{ source }}
          </p>
        </div>
        <p class="text-sm text-white/50">
          {{ formattedDate }}
        </p>
      </div>
    </div>

    <!-- Badge -->
    <div
      v-if="badge"
      class="badge badge-purple flex-shrink-0 ml-2"
    >
      {{ badge }}
    </div>
  </div>
</template>
