<script setup lang="ts">
interface Props {
  variant?: 'default' | 'strong' | 'subtle'
  hover?: boolean
  padding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hover: false,
  padding: true,
})
</script>

<template>
  <div
    :class="[
      'glass-card',
      {
        'glass-strong': variant === 'strong',
        'glass-subtle': variant === 'subtle',
        'glass-hover': hover,
        'p-6': padding,
      },
    ]"
  >
    <slot />
  </div>
</template>
