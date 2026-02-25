<script setup lang="ts">
import {computed, onMounted, ref, toRaw, watch} from 'vue'
import type { PageConfig } from '@/engine/types'
import type { Collection } from '@/db/core'
import { collections } from '@/db/core'
import { pageConfigs } from '@/configs'
import { useAdminStore } from '@/admin/useAdminStore'
import AdminEditItem from '@/admin/AdminEditItem.vue'

const props = defineProps<{
  logout: () => void
}>()

interface Item {
  id?: string
  category?: string
  [key: string]: any
}

const categoryNameAll = 'Любая'

/* ================== COLLECTION ================== */

const collectionKey = ref<Collection>(collections[0])
const adminStore = computed(() => useAdminStore(collectionKey.value))
const items = computed(() => adminStore.value.items.value)
const loading = computed(() => adminStore.value.loading.value)
const error = computed(() => adminStore.value.error.value)

/* ================== CONFIG ================== */

const currentConfig = computed<PageConfig>(
    () => pageConfigs[collectionKey.value]
)

const collectionsList = Object.keys(pageConfigs).map(key => ({
  id: key,
  title: pageConfigs[key].title
}))

/* ================== CATEGORIES ================== */

const selectedCategory = ref(categoryNameAll)

const categories = computed(() => {
  const set = new Set<string>()

  currentConfig.value?.categories?.forEach(c => set.add(c.trim()))
  items.value.forEach(i => i.category && set.add(i.category.trim()))

  return [categoryNameAll, ...Array.from(set).sort()]
})

const filteredItems = computed(() => {
  if (selectedCategory.value === categoryNameAll) return items.value
  return items.value.filter(i => i.category === selectedCategory.value)
})

/* ================== EDIT STATE ================== */

const editingItem = ref<Item | null>(null)
const newItem = ref<Item | null>(null)

/* ================== ACTIONS ================== */

function startEdit(item: Item) {
  editingItem.value = JSON.parse(JSON.stringify(toRaw(item)))
  newItem.value = null
}

function addNew() {
  const empty: Item = {
    category:
        selectedCategory.value !== categoryNameAll
            ? selectedCategory.value
            : ''
  }

  currentConfig.value.columns.forEach(col => {
    empty[col.key] ??= ''
  })

  newItem.value = empty
  editingItem.value = null
}

function cancelEdit() {
  editingItem.value = null
  newItem.value = null
}

async function handleSaved() {
  editingItem.value = null
  newItem.value = null
  await adminStore.value.load()
}

async function onDelete(id: string) {
  if (!confirm('Удалить запись?')) return
  await adminStore.value.deleteItem(id)
  await adminStore.value.load()
}

/* ================== WATCH ================== */

watch(collectionKey, async () => {
  selectedCategory.value = categoryNameAll
  cancelEdit()
  await adminStore.value.load()
})

watch(selectedCategory, cancelEdit)

onMounted(() => {
  adminStore.value.load()
})
</script>


<template>
  <div>
    <header class="top">
      <h1>Администрирование — {{ currentConfig.title }}</h1>
      <button @click="props.logout">Выйти</button>
    </header>

    <div class="selectors">
      <label>
        Коллекция:
        <select v-model="collectionKey">
          <option
              v-for="c in collectionsList"
              :key="c.id"
              :value="c.id"
          >
            {{ c.title }}
          </option>
        </select>
      </label>
      <label v-if="categories.length > 1">
        Категория:
        <select v-model="selectedCategory">
          <option v-for="c in categories" :key="c">
            {{ c }}
          </option>
        </select>
      </label>

      <button @click="addNew" :disabled="loading">Добавить новую запись</button>
    </div>

    <div v-if="loading">Загрузка…</div>
    <div v-if="error" class="error">{{ error }}</div>

    <table
        v-if="!loading && (filteredItems.length || newItem)"
        class="items-table"
    >
      <thead>
      <tr>
        <th>Действия</th>
        <th>Категория</th>
        <th v-for="c in currentConfig.columns" :key="c.key">
          {{ c.title }}
        </th>
      </tr>
      </thead>

      <tbody>
        <template v-for="item in filteredItems" :key="item.id">
          <!-- EDIT MODE -->
          <AdminEditItem
              v-if="editingItem && editingItem.id === item.id"
              :item="editingItem"
              :collection="collectionKey"
              @saved="handleSaved"
              @cancel="cancelEdit"
          />

          <!-- VIEW MODE -->
          <tr v-else>
            <td  class="items-center">
              <button @click="startEdit(item)">✏️</button>
              <button @click="onDelete(item.id!)">🗑️</button>
            </td>

            <td>{{ item.category || '—' }}</td>

            <td v-for="col in currentConfig.columns" :key="col.key">
              <img
                  v-if="col.type === 'image' && item[col.key]"
                  :src="`${item[col.key]}?v=${Date.now()}`"
                  class="thumb"
                  :alt="col.key"
              />
              <a
                  v-else-if="col.type === 'file' && item[col.key]"
                  :href="item[col.key]"
                  target="_blank"
              >
                файл
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
              <span v-else-if="col.type === 'price' && item[col.key]">
                {{ item[col.key] }} ₽
              </span>
              <span v-else>{{ item[col.key] }}</span>
            </td>
          </tr>
        </template>

        <!-- NEW ITEM -->
        <AdminEditItem
            v-if="newItem"
            :item="newItem"
            :collection="collectionKey"
            @saved="handleSaved"
            @cancel="cancelEdit"
        />
      </tbody>
    </table>

    <div v-if="!loading && !filteredItems.length && !newItem">
      Нет записей
    </div>
  </div>
</template>


<style scoped>
.top {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  button {
    padding: 10px 20px;
  }
}
.selectors {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-content: center;
  justify-items: center;
}
.selectors label {
  gap: 5px;
  display: flex;
}
.items-center {
  text-align: center;
  justify-content: center;
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
  color: #fff;
}
.thumb {
  width: 60px;
}
.error {
  color: red;
}
.thumb {
  display: block;
  max-width: 120px;
  max-height: 120px;
  margin: auto;
  border: 1px solid #333;
}

.links {
  padding-left: 16px;
  margin: 0;
}
.links li {
  text-align: center;
  list-style: none;
}

</style>
