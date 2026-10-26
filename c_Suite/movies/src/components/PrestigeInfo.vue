<script setup lang="ts">
import { computed } from 'vue'
import type { ViewType } from '@/types/movie'
import prestigeData from '@/data/prestige-tables.json'

const props = defineProps<{
  view: ViewType
}>()

type PrestigeKey = 'prestige20m' | 'prestigepre22' | 'prestigetier2'

const table = computed(() => {
  const key = props.view as PrestigeKey
  return (prestigeData as Record<PrestigeKey, typeof prestigeData.prestige20m>)[key] || null
})
</script>

<template>
  <section v-if="table" class="prestige-info">
    <h2 class="prestige-title">{{ table.title }}</h2>
    <p class="prestige-desc">{{ table.description }}</p>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="col in table.columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in table.rows" :key="i">
            <td v-for="(cell, j) in row" :key="j" :class="{ 'col-series': j === 0, 'col-cost': j === 2 || j === 3 }">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="table.note" class="prestige-note">{{ table.note }}</p>
  </section>
</template>

<style lang="scss" scoped>
.prestige-info {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(180deg, rgba(20, 20, 20, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%);
  border: 1px solid rgba(139, 0, 0, 0.3);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--noir-crimson), transparent);
  }
}

.prestige-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 3px;
  color: var(--noir-crimson);
  margin: 0 0 12px;
  text-transform: uppercase;
}

.prestige-desc {
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.table-wrapper {
  overflow-x: auto;
  margin: 0 -24px;
  padding: 0 24px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(10, 10, 10, 0.5);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 0, 0, 0.4);
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.78rem;
  min-width: 700px;
}

thead {
  tr {
    border-bottom: 1px solid rgba(184, 134, 11, 0.4);
  }

  th {
    padding: 10px 12px;
    text-align: left;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 0.8rem;
    letter-spacing: 2px;
    color: var(--noir-gold);
    font-weight: 400;
    white-space: nowrap;
  }
}

tbody {
  tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.2s ease;

    &:hover {
      background: rgba(139, 0, 0, 0.08);
    }
  }

  td {
    padding: 8px 12px;
    color: var(--text-secondary);
    line-height: 1.4;
    vertical-align: top;
  }

  .col-series {
    color: var(--noir-cream);
    font-weight: 600;
    white-space: nowrap;
  }

  .col-cost {
    color: var(--noir-gold);
    font-weight: 600;
    white-space: nowrap;
  }
}

.prestige-note {
  margin: 20px 0 0;
  padding: 16px;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.3);
  border-left: 2px solid rgba(139, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .prestige-info {
    padding: 16px;
    margin-bottom: 24px;
  }

  .prestige-title {
    font-size: 1.2rem;
  }

  .table-wrapper {
    margin: 0 -16px;
    padding: 0 16px;
  }
}
</style>
