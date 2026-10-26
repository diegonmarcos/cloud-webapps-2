<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
})

const buttonClass = computed(() => {
  return cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    {
      // Variants
      'bg-violet-accent text-white hover:bg-violet-accent/90': props.variant === 'default',
      'bg-red-500 text-white hover:bg-red-600': props.variant === 'destructive',
      'border border-white/20 bg-transparent hover:bg-white/10': props.variant === 'outline',
      'bg-white/10 text-white hover:bg-white/20': props.variant === 'secondary',
      'hover:bg-white/10 hover:text-white': props.variant === 'ghost',
      'text-violet-accent underline-offset-4 hover:underline': props.variant === 'link',

      // Sizes
      'h-10 px-4 py-2': props.size === 'default',
      'h-9 rounded-md px-3': props.size === 'sm',
      'h-11 rounded-md px-8': props.size === 'lg',
      'h-10 w-10': props.size === 'icon',
    },
    props.class
  )
})
</script>

<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>
