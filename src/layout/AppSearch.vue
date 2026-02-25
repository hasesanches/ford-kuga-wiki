<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const search = ref('')
let t: number | null = null

/* sync FROM url */
watch(
    () => route.query.search,
    value => {
      search.value = typeof value === 'string' ? value : ''
    },
    { immediate: true }
)

/* sync TO url */
watch(search, value => {
  if (t) clearTimeout(t)

  t = window.setTimeout(() => {
    const query = { ...route.query }

    if (value.trim()) query.search = value.trim()
    else delete query.search

    router.replace({ query })
  }, 300)
})
</script>

<template>
  <div class="search">
    <input
        v-model="search"
        placeholder="Поиск по выбранной категории (тюнинг, запчасти, программы ...)"
    />
  </div>
</template>

<style scoped>
.search {
  padding: 10px 20px;
  background: #1a1a1a;
}

input {
  width: 100%;
  padding: 10px;
  font-size: 15px;
  box-sizing: border-box;
}
</style>
