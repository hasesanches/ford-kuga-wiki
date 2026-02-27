<script setup lang="ts">
import {ref, watch, onMounted, computed, onUnmounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAll } from '@/db/core'
import type { PageConfig } from './types'

const props = defineProps<{ config: PageConfig }>()

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const search = ref('')

const allItems = ref<any[]>([])   // ВСЕ данные из БД
const items = computed(() => {
  let data = allItems.value

  if (selectedCategory.value !== categoryNameAll) {
    data = data.filter(i => i.category === selectedCategory.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    data = data.filter(i =>
        Object.values(i).some(v =>
            String(v).toLowerCase().includes(q)
        )
    )
  }

  return [...data].sort((a, b) =>
      String(a.title ?? '').localeCompare(
          String(b.title ?? ''),
          'ru',
          { sensitivity: 'base' }
      )
  )
})

const categoryNameAll = 'Любая'
const selectedCategory = ref(categoryNameAll)

const categories = computed(() => {
  const set = new Set<string>()

  //props.config.categories.forEach(c => set.add(c.trim()))
  allItems.value.forEach(i => i.category && set.add(i.category.trim()))

  return [categoryNameAll, ...Array.from(set).sort()]
})

const previewImage = ref<string | null>(null)

const startY = ref(0)
const currentY = ref(0)
const isDragging = ref(false)

function openPreview(src: string) {
  previewImage.value = src
}

function closePreview() {
  previewImage.value = null
}

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreview()
}

function onTouchStart(e: TouchEvent) {
  startY.value = e.touches[0].clientY
  isDragging.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  currentY.value = e.touches[0].clientY - startY.value
}

function onTouchEnd() {
  isDragging.value = false

  if (currentY.value > 120) {
    closePreview()
  }

  currentY.value = 0
}

function readQuery() {
  selectedCategory.value = typeof route.query.category === 'string' ? route.query.category : categoryNameAll

  search.value = typeof route.query.search === 'string' ? route.query.search : ''
}

/* ---------- sync TO url ---------- */
function updateQuery() {
  router.replace({
    query: {
      ...(selectedCategory.value !== categoryNameAll ? { category: selectedCategory.value } : {}),
      ...(search.value ? { search: search.value } : {})
    }
  })
}

/* ---------- load data ---------- */
async function load() {
  loading.value = true

  allItems.value = await getAll<any>(props.config.collection)

  console.log('load data', allItems.value, props.config)

  loading.value = false
}

watch(
    () => route.query,
    () => {
      readQuery()
      load()
    }
)

watch([selectedCategory, search], () => {
  updateQuery()
})

onMounted(() => {
  window.addEventListener('keydown', onEsc)

  readQuery()
  load()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onEsc)
})
</script>

<template>
  <div class="page-engine">
    <div class="page-title">{{ config.title }}</div>

    <div v-if="loading">Загрузка...</div>

    <div v-if="!loading && items.length" class="category-selector">
      <select v-model="selectedCategory">
        <option
            v-for="cat in categories"
            :key="cat"
            :value="cat"
        >
          {{ cat }}
        </option>
      </select>
    </div>

    <table v-if="!loading && items.length" class="items-table">
      <thead>
      <tr>
        <th v-for="col in config.columns" :key="col.key">
          {{ col.title }}
        </th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="item in items" :key="item.id">
        <td v-for="col in config.columns" :key="col.key">
          <!-- IMAGE -->
          <div v-if="col.type === 'image' && item[col.key]" class="thumb-wrapper">
            <img
                :src="`${item[col.key]}?v=${Date.now()}`"
                :alt="col.key"
                @click="openPreview(item[col.key])"
            />
          </div>
          <a
              v-else-if="col.type === 'file' && item[col.key]"
              :href="item[col.key]"
              target="_blank"
          >
            Скачать с сайта
          </a>
          <!-- LINK -->
          <template v-else-if="col.type === 'link' && item[col.key]">
            <!-- старый формат: string -->
            <a
                v-if="typeof item[col.key] === 'string'"
                :href="item[col.key]"
                target="_blank"
            >
              ссылка
            </a>

            <!-- новый формат: список -->
            <ul v-else-if="Array.isArray(item[col.key])" class="links">
              <li v-for="(link, i) in item[col.key]" :key="i">
                <a :href="link.url" target="_blank">
                  {{ link.title || link.url }}
                </a>
              </li>
            </ul>
          </template>

          <!-- PRICE -->
          <span v-else-if="col.type === 'price'">
            {{ item[col.key] }} ₽
          </span>

          <!-- TEXT -->
          <span v-else>
              {{ item[col.key] }}
            </span>
        </td>
      </tr>
      </tbody>
    </table>

    <Transition name="fade">
      <div
          v-if="previewImage"
          class="preview-overlay"
          @click="closePreview"
      >
        <div
            class="preview-wrapper"
            @click.stop
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            :style="{
        transform: `translateY(${currentY}px)`,
        transition: isDragging ? 'none' : 'transform 0.25s ease'
      }"
        >
          <button class="preview-close" @click="closePreview">
            ✕
          </button>

          <img
              :src="previewImage"
              class="preview-image"
              alt="preview-image"/>
        </div>
      </div>
    </Transition>

    <div v-if="!loading && !items.length">
      Нет данных
    </div>
  </div>
</template>

<style scoped>
.category-selector {
  margin-bottom: 10px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 10px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  border: 1px solid #333;
  padding: 8px;
  white-space: pre-wrap;
}

.items-table th {
  background: #222;
  color: #ffffff;
}

.thumb-wrapper {
  width: 80px;
  height: 80px;
  overflow: hidden;
  margin: auto;
  border: 1px solid #333;
}

.thumb-wrapper:hover img {
  transform: scale(1.05);
}

.thumb-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.links {
  padding-left: 16px;
  margin: 0;
}
.links li {
  list-style: disc;
}

.preview-wrapper {
  position: relative;
  max-width: 95%;
  max-height: 95%;
  will-change: transform;
}

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 15px;
}

/* картинка */
.preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0,0,0,0.6);
}

/* кнопка закрытия */
.preview-close {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #111;
  color: white;
  border: none;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 28px;
}

/* ===== АНИМАЦИИ ===== */

/* fade overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* zoom картинки */
.zoom-enter-active {
  transition: all 0.25s ease;
}
.zoom-leave-active {
  transition: all 0.2s ease;
}

.zoom-enter-from {
  transform: scale(0.9);
  opacity: 0;
}

.zoom-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 18px;
  }
  .items-table {
    font-size: 12px;
  }
}
</style>
