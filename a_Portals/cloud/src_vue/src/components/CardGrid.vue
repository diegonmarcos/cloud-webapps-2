<script setup lang="ts">
import type { Service, ServiceSection } from '../lib/types'
import ServiceCard from './ServiceCard.vue'

defineProps<{
  sections: ServiceSection[]
}>()

const emit = defineEmits<{
  serviceClick: [service: Service]
  copy: [text: string, label: string]
  openUrl: [url: string]
}>()
</script>

<template>
  <div class="card-grid">
    <div
      v-for="(section, idx) in sections"
      :key="section.title"
      class="section"
      :style="{ animationDelay: `${idx * 0.1}s` }"
    >
      <h2 class="section-title">{{ section.title }}</h2>
      <div class="cards">
        <ServiceCard
          v-for="service in section.services"
          :key="service.id"
          :service="service"
          @click="emit('serviceClick', service)"
          @copy="(text, label) => emit('copy', text, label)"
          @open-url="(url) => emit('openUrl', url)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-grid {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.section {
  animation: fadeIn 0.5s ease-out both;
}

.section-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--accent-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.cards {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
