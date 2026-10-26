<script setup lang="ts">
import type { ViewType } from '@/types/movie'

defineProps<{
  hasApiKey: boolean
  hasTmdbKey: boolean
  tempApiKey: string
  tempTmdbKey: string
  view: ViewType
  searchQuery: string
  bulkInput: string
  showBulkInput: boolean
}>()

const emit = defineEmits<{
  'update:tempApiKey': [value: string]
  'update:tempTmdbKey': [value: string]
  'update:searchQuery': [value: string]
  'update:bulkInput': [value: string]
  saveKey: []
  clearKey: []
  saveTmdbKey: []
  clearTmdbKey: []
  setView: [view: ViewType]
  search: []
  openWebPlayer: []
  toggleBulkInput: []
  fetchBulk: []
}>()
</script>

<template>
  <header>
    <div class="top-bar">
      <div class="logo-section">
        <div class="logo-icon">
          <span class="reel"></span>
        </div>
        <div class="logo-text">
          <h1>MOVIES</h1>
          <span class="tagline">CINEMA NOIR</span>
        </div>
      </div>
      <div class="api-key-container">
        <template v-if="!hasApiKey">
          <button class="btn-gold" @click="emit('openWebPlayer')">PLAYER</button>
          <input
            :value="tempApiKey"
            @input="emit('update:tempApiKey', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="OMDB KEY"
            class="api-input"
          />
          <button class="btn-save" @click="emit('saveKey')">ENTER</button>
        </template>
        <div v-else class="key-actions">
          <button class="btn-ghost" @click="emit('clearKey')">OMDB</button>
          <template v-if="!hasTmdbKey">
            <input
              :value="tempTmdbKey"
              @input="emit('update:tempTmdbKey', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="TMDB KEY"
              class="api-input tmdb-input"
            />
            <button class="btn-save tmdb-save" @click="emit('saveTmdbKey')">TMDB</button>
          </template>
          <button v-else class="btn-ghost tmdb-key" @click="emit('clearTmdbKey')">TMDB</button>
          <button class="btn-gold" @click="emit('openWebPlayer')">PLAYER</button>
          <button :class="['btn-ghost', { active: view === 'search' }]" @click="emit('setView', 'search')">SEARCH</button>
          <button :class="['btn-ghost bulk', { active: view === 'bulk' || showBulkInput }]" @click="emit('toggleBulkInput')">+ BULK</button>
        </div>
      </div>
    </div>

    <!-- Search Box (in top bar area) -->
    <div v-if="view === 'search'" class="search-container top-search">
      <input
        :value="searchQuery"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value); emit('search')"
        class="search-box"
        placeholder="SEARCH FILMS & SERIES..."
        autofocus
      />
    </div>

    <!-- Bulk Input (in top bar area) -->
    <div v-if="showBulkInput" class="bulk-container top-bulk">
      <input
        :value="bulkInput"
        @input="emit('update:bulkInput', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('fetchBulk')"
        class="bulk-input"
        placeholder="tt1234567, tt7654321, tt9876543..."
        autofocus
      />
      <button class="btn-fetch" @click="emit('fetchBulk')">FETCH</button>
    </div>

    <nav class="nav-section">
      <!-- Row 1: Browse -->
      <div class="nav-row">
        <span class="row-label">BROWSE</span>
        <div class="nav-buttons">
          <button :class="['nav-btn', { active: view === 'home' }]" @click="emit('setView', 'home')">
            FILMS '25
          </button>
          <button :class="['nav-btn', { active: view === 'series2025' }]" @click="emit('setView', 'series2025')">
            SERIES '25
          </button>
          <button :class="['nav-btn', { active: view === 'ghibli' }]" @click="emit('setView', 'ghibli')">
            GHIBLI
          </button>
          <button :class="['nav-btn', { active: view === 'european' }]" @click="emit('setView', 'european')">
            EUROPEAN
          </button>
          <button :class="['nav-btn', { active: view === 'newnoirs' }]" @click="emit('setView', 'newnoirs')">
            NEWNOIRS
          </button>
          <button :class="['nav-btn', { active: view === 'scifi' }]" @click="emit('setView', 'scifi')">
            SCI-FI
          </button>
        </div>
      </div>

      <!-- Row 2: Watch Before You Die -->
      <div class="nav-row bucketlist-row">
        <span class="row-label crimson">WATCH BEFORE YOU DIE</span>
        <div class="nav-buttons">
          <button :class="['nav-btn bucketlist', { active: view === 'staffpicks' }]" @click="emit('setView', 'staffpicks')">
            CLASSICS
          </button>
          <button :class="['nav-btn bucketlist', { active: view === 'epics' }]" @click="emit('setView', 'epics')">
            EPICS
          </button>
          <button :class="['nav-btn bucketlist', { active: view === 'thrillers' }]" @click="emit('setView', 'thrillers')">
            THRILLERS
          </button>
          <button :class="['nav-btn bucketlist', { active: view === 'epicseries' }]" @click="emit('setView', 'epicseries')">
            SERIES
          </button>
        </div>
      </div>

      <!-- Row 3: Oscar Nominees by Year -->
      <div class="nav-row oscar-row">
        <span class="row-label gold">OSCAR NOMINEES</span>
        <div class="nav-buttons">
          <button :class="['nav-btn nominee', { active: view === 'oscars2025' }]" @click="emit('setView', 'oscars2025')">
            2025
          </button>
          <button :class="['nav-btn nominee', { active: view === 'oscars2024' }]" @click="emit('setView', 'oscars2024')">
            2024
          </button>
          <button :class="['nav-btn nominee', { active: view === 'oscars2023' }]" @click="emit('setView', 'oscars2023')">
            2023
          </button>
          <button :class="['nav-btn nominee', { active: view === 'oscars2022' }]" @click="emit('setView', 'oscars2022')">
            2022
          </button>
          <button :class="['nav-btn nominee', { active: view === 'oscars2021' }]" @click="emit('setView', 'oscars2021')">
            2021
          </button>
          <button :class="['nav-btn nominee', { active: view === 'oscars2020' }]" @click="emit('setView', 'oscars2020')">
            2020
          </button>
        </div>
      </div>

      <!-- Row 4: Directors Legends -->
      <div class="nav-row legend-row">
        <span class="row-label gold">DIRECTORS LEGENDS</span>
        <div class="nav-buttons">
          <button :class="['nav-btn legend', { active: view === 'spielberg' }]" @click="emit('setView', 'spielberg')">
            SPIELBERG
          </button>
          <button :class="['nav-btn legend', { active: view === 'scorsese' }]" @click="emit('setView', 'scorsese')">
            SCORSESE
          </button>
          <button :class="['nav-btn legend', { active: view === 'eastwood' }]" @click="emit('setView', 'eastwood')">
            EASTWOOD
          </button>
          <button :class="['nav-btn legend', { active: view === 'kubrick' }]" @click="emit('setView', 'kubrick')">
            KUBRICK
          </button>
          <button :class="['nav-btn legend', { active: view === 'nolan' }]" @click="emit('setView', 'nolan')">
            NOLAN
          </button>
          <button :class="['nav-btn legend', { active: view === 'tarantino' }]" @click="emit('setView', 'tarantino')">
            TARANTINO
          </button>
          <button :class="['nav-btn legend', { active: view === 'ridleyscott' }]" @click="emit('setView', 'ridleyscott')">
            RIDLEY SCOTT
          </button>
        </div>
      </div>

      <!-- Row 5: Actor/ess Legends -->
      <div class="nav-row actor-row">
        <span class="row-label gold">ACTOR/ESS LEGENDS</span>
        <div class="nav-buttons">
          <button :class="['nav-btn legend', { active: view === 'streep' }]" @click="emit('setView', 'streep')">
            STREEP
          </button>
          <button :class="['nav-btn legend', { active: view === 'nicholson' }]" @click="emit('setView', 'nicholson')">
            NICHOLSON
          </button>
          <button :class="['nav-btn legend', { active: view === 'alpacino' }]" @click="emit('setView', 'alpacino')">
            AL PACINO
          </button>
          <button :class="['nav-btn legend', { active: view === 'deniro' }]" @click="emit('setView', 'deniro')">
            DE NIRO
          </button>
          <button :class="['nav-btn legend', { active: view === 'hanks' }]" @click="emit('setView', 'hanks')">
            HANKS
          </button>
          <button :class="['nav-btn legend', { active: view === 'dicaprio' }]" @click="emit('setView', 'dicaprio')">
            DICAPRIO
          </button>
        </div>
      </div>

      <!-- Row 6: Prestige Series -->
      <div class="nav-row prestige-row">
        <span class="row-label crimson">PRESTIGE SERIES</span>
        <div class="nav-buttons">
          <button :class="['nav-btn prestige', { active: view === 'prestige20m' }]" @click="emit('setView', 'prestige20m')">
            $20M+ CLUB
          </button>
          <button :class="['nav-btn prestige', { active: view === 'prestigepre22' }]" @click="emit('setView', 'prestigepre22')">
            PRE-2022
          </button>
          <button :class="['nav-btn prestige', { active: view === 'prestigetier2' }]" @click="emit('setView', 'prestigetier2')">
            PRE-2022 TIER 2
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
header {
  background: linear-gradient(180deg, #0d0d0d 0%, #000 100%);
  border-bottom: 1px solid rgba(139, 0, 0, 0.4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(184, 134, 11, 0.5), transparent);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--noir-red), transparent);
    box-shadow: 0 0 20px var(--noir-red);
  }
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  width: 50px;
  height: 50px;
  position: relative;

  .reel {
    position: absolute;
    inset: 0;
    border: 3px solid var(--noir-gold);
    border-radius: 50%;
    animation: spin-slow 10s linear infinite;

    &::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 2px solid var(--noir-gold);
      border-radius: 50%;
    }

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      background: var(--noir-red);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px var(--noir-red);
    }
  }
}

@keyframes spin-slow {
  100% { transform: rotate(360deg); }
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

h1 {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.8rem;
  font-weight: 400;
  color: var(--noir-cream);
  letter-spacing: 6px;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.tagline {
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.65rem;
  color: var(--noir-gold);
  letter-spacing: 4px;
  font-weight: 600;
}

.api-key-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.api-input {
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(184, 134, 11, 0.3);
  color: var(--text-primary);
  padding: 12px 16px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 2px;
  width: 140px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--noir-gold);
    box-shadow: 0 0 15px rgba(184, 134, 11, 0.2);
  }
}

.btn-save {
  padding: 12px 20px;
  background: var(--noir-red);
  color: var(--noir-cream);
  border: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--noir-crimson);
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.5);
  }
}

.key-actions {
  display: flex;
  gap: 8px;

  .btn-ghost.active {
    border-color: var(--noir-red);
    color: var(--noir-cream);
  }

  .btn-ghost.bulk {
    color: var(--noir-gold);
    border-color: rgba(184, 134, 11, 0.3);

    &:hover, &.active {
      border-color: var(--noir-gold);
      color: var(--noir-gold);
    }
  }

  .btn-ghost.tmdb-key {
    color: #01d277;
    border-color: rgba(1, 210, 119, 0.3);

    &:hover {
      border-color: #01d277;
      color: #01d277;
    }
  }
}

.tmdb-input {
  border-color: rgba(1, 210, 119, 0.3) !important;
  width: 110px !important;

  &:focus {
    border-color: #01d277 !important;
    box-shadow: 0 0 15px rgba(1, 210, 119, 0.2) !important;
  }
}

.tmdb-save {
  background: #01d277 !important;
  color: #000 !important;

  &:hover {
    background: #00b868 !important;
    box-shadow: 0 0 20px rgba(1, 210, 119, 0.5) !important;
  }
}

.btn-ghost {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-muted);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--text-secondary);
    color: var(--text-primary);
  }
}

.btn-gold {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--noir-gold);
  color: var(--noir-gold);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--noir-gold);
    color: #000;
  }
}

.nav-section {
  padding: 0 24px 20px;
}

.nav-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);

  &.bucketlist-row {
    padding-top: 8px;
  }

  &.oscar-row {
    padding-top: 8px;
  }

  &.legend-row {
    padding-top: 4px;
  }

  &.actor-row {
    padding-top: 4px;
  }

  &.prestige-row {
    padding-top: 8px;
    border-bottom: none;
  }
}

.row-label {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 2px;
  color: var(--text-muted);
  min-width: 130px;
  text-align: right;
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);

  &.gold {
    color: var(--noir-gold);
    border-right-color: rgba(184, 134, 11, 0.3);
  }

  &.crimson {
    color: var(--noir-crimson);
    border-right-color: rgba(139, 0, 0, 0.4);
  }
}

.nav-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    color: var(--text-primary);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 20%;
      right: 20%;
      height: 1px;
      background: var(--noir-smoke);
    }
  }

  &.active {
    color: var(--noir-cream);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10%;
      right: 10%;
      height: 2px;
      background: var(--noir-red);
      box-shadow: 0 0 8px var(--noir-red);
    }
  }

  &.legend {
    &.active::after {
      background: var(--noir-gold);
      box-shadow: 0 0 8px var(--noir-gold);
    }

    &:hover::after {
      background: rgba(184, 134, 11, 0.5);
    }
  }

  &.nominee {
    &.active::after {
      background: var(--noir-gold);
      box-shadow: 0 0 8px var(--noir-gold);
    }

    &:hover::after {
      background: rgba(184, 134, 11, 0.5);
    }
  }

  &.bucketlist, &.prestige {
    &.active::after {
      background: var(--noir-crimson);
      box-shadow: 0 0 8px var(--noir-crimson);
    }

    &:hover::after {
      background: rgba(139, 0, 0, 0.5);
    }
  }
}

.search-container {
  padding-top: 16px;
  max-width: 500px;

  &.top-search {
    padding: 0 24px 16px;
    max-width: 100%;
  }
}

.search-box {
  width: 100%;
  padding: 14px 20px;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 1px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(139, 0, 0, 0.3);
  color: var(--text-primary);
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--noir-crimson);
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.2);
  }
}

.bulk-container {
  padding-top: 16px;
  display: flex;
  gap: 8px;
  max-width: 600px;

  &.top-bulk {
    padding: 0 24px 16px;
    max-width: 100%;
  }
}

.bulk-input {
  flex: 1;
  padding: 14px 20px;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 1px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(184, 134, 11, 0.3);
  color: var(--text-primary);
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--noir-gold);
    box-shadow: 0 0 20px rgba(184, 134, 11, 0.2);
  }
}

.btn-fetch {
  padding: 14px 24px;
  background: var(--noir-gold);
  color: #000;
  border: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #d4a91a;
    box-shadow: 0 0 20px rgba(184, 134, 11, 0.5);
  }
}


@media (max-width: 900px) {
  .row-label {
    display: none;
  }

  .nav-row {
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  h1 {
    font-size: 2rem;
  }

  .api-key-container {
    width: 100%;
  }

  .api-input {
    flex: 1;
  }

  .nav-buttons {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
    width: 100%;

    &::-webkit-scrollbar {
      height: 2px;
    }
  }

  .nav-btn {
    white-space: nowrap;
    flex-shrink: 0;
    padding: 8px 12px;
    font-size: 0.85rem;
  }
}
</style>
