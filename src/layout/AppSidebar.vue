<script setup lang="ts">
defineProps<{
  open: boolean
}>()

defineEmits(['close'])

const menu = [
  { title: 'Главная', path: '/' },
  { title: 'Ремонтная база', path: '/repair' },
  { title: 'Тюнинг', path: '/tuning' },
  { title: 'Аналоги', path: '/parts' },
  { title: 'Программы и файлы', path: '/software' },
  { title: 'Мануалы', path: '/manuals' },
  { title: 'Мы на карте', path: '/map' },
  { title: 'Контакты', path: '/contact' },

  // Добавляем ссылку на админ
  { title: 'Админка', path: '/admin', isAdmin: true },
  { title: 'CanSniffer', path: '/can_sniffer', isAdmin: true }
]
</script>

<template>
  <aside class="sidebar" :class="{ open }">
    <router-link
        v-for="item in menu"
        :key="item.path"
        :to="item.path"
        class="link"
        :class="{ 'link-admin': item.isAdmin }"
        @click="$emit('close')"
    >
      {{ item.title }}
    </router-link>
  </aside>

  <div v-if="open" class="overlay" @click="$emit('close')" />
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: #141414;
  padding: 15px;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.link {
  padding: 10px;
  color: #ccc;
  text-decoration: none;
}

.link.router-link-active {
  background: #333;
  color: #fff;
}

.link-admin {
  color: #141414;
}

/* 📱 мобильная версия */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 90;
  }
}

</style>
