import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { Toaster } from 'vue-sonner'
import App from './App.vue'
import './styles/main.scss'

// Create Vue app
const app = createApp(App)

// Pinia store
const pinia = createPinia()
app.use(pinia)

// Vue Query for data fetching
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
      },
    },
  },
})

// Register Toaster component globally
app.component('Toaster', Toaster)

// Mount app
app.mount('#app')
