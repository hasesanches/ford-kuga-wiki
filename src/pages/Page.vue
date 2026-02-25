<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageEngine from '@/engine/PageEngine.vue'
import { pageConfigs } from '@/configs'

const route = useRoute()

const config = computed(() => {
  return pageConfigs[route.name as string]
})
</script>

<template>
  <PageEngine
      v-if="config"
      :config="config"
  />
  <div v-else>
    Страница не настроена
  </div>
</template>
