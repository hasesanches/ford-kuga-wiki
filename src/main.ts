import { createApp } from 'vue'
import AppLayout from '@/layout/AppLayout.vue'
import { router } from '@/router'

createApp(AppLayout).use(router).mount('#app')

// https://console.firebase.google.com/project/ford-kuga-wiki/overview