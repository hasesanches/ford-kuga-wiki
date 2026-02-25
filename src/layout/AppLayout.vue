<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSearch from './AppSearch.vue'
import AppSidebar from './AppSidebar.vue'

const isMenuOpen = ref(false)
</script>

<template>
  <div class="app">
    <AppHeader @toggle-menu="isMenuOpen = !isMenuOpen" />
    <AppSearch />

    <div class="body">
      <AppSidebar
          :open="isMenuOpen"
          @close="isMenuOpen = false"
      />

      <main class="content" @click="isMenuOpen = false">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 📱 мобильная версия */
@media (max-width: 768px) {
  .body {
    position: relative;
  }
}
</style>
