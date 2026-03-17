<script setup lang="ts">
import { computed, reactive, ref, toRaw, watch, onUnmounted } from 'vue'
import type { PageConfig } from '@/engine/types'
import type { Collection } from '@/db/core'
import { pageConfigs } from '@/configs'
import { useAdminStore } from '@/admin/useAdminStore'

/* ================== PROPS / EMITS ================== */

interface Item {
  id?: string
  category?: string
  [key: string]: any
}

const props = defineProps<{
  item: Item | null
  collection: Collection
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'saved'): void
}>()

/* ================== STORE / CONFIG ================== */

const adminStore = computed(() => useAdminStore(props.collection))
const currentConfig = computed<PageConfig>(() => pageConfigs[props.collection])

/* ================== LOCAL STATE ================== */

interface FileDownload {
  key: string
  file: File
}

const originalItem = reactive<Item>({})
const localItem = reactive<Item>({})
const filesToDelete = ref<string[]>([])
const tempCategory = ref('')
const filesDownloadList = ref<FileDownload[]>([])
const uploading = ref(false)
const uploadError = ref('')

/* ================== WATCH ================== */

watch(
    () => props.item,
    (val) => {
      Object.keys(localItem).forEach(k => delete localItem[k])
      Object.keys(originalItem).forEach(k => delete originalItem[k])

      if (val) {
        const cloned = JSON.parse(JSON.stringify(val))

        Object.assign(localItem, cloned)
        Object.assign(originalItem, cloned)
      }

      filesDownloadList.value = []
      tempCategory.value = ''
    },
    { immediate: true }
)

function addLink(key: string) {
  if (!Array.isArray(localItem[key])) {
    localItem[key] = []
  }
  localItem[key].push({ title: '', url: '' })
}

function removeLink(key: string, index: number) {
  localItem[key].splice(index, 1)
}

/* ================== FILES ================== */

function onFileSelect(files: FileList | null, key: string) {
  if (!files || !files.length) return
  filesDownloadList.value = [
    ...filesDownloadList.value.filter(f => f.key !== key),
    { key, file: files[0] }
  ]
}

function removeCurrentFile(key: string) {
  if (!localItem[key]) return

  filesToDelete.value.push(key)
  localItem[key] = null
}

function removeNewFile(key: string) {
  filesDownloadList.value = filesDownloadList.value.filter(f => f.key !== key)
}

function getNewFile(key: string) {
  return filesDownloadList.value.find(f => f.key === key)
}

const filePreviews = computed(() => {
  const map: Record<string, string> = {}
  for (const f of filesDownloadList.value) {
    map[f.key] = URL.createObjectURL(f.file)
  }
  return map
})

onUnmounted(() => {
  Object.values(filePreviews.value).forEach(url => URL.revokeObjectURL(url))
})

function getPathFromUrl(url: string) {
  const i = url.indexOf('/files/')
  return url.slice(i + 7)
}

async function onSave() {
  if (!localItem) return

  console.log('onSave')

  uploading.value = true
  uploadError.value = ''

  try {
    if(!localItem.id) {
      const saved = await adminStore.value.saveItem(toRaw(localItem))
      localItem.id = saved.id;
    }

    /* удалить файлы которые пользователь удалил */
    for (const key of filesToDelete.value) {
      if (originalItem[key]) {
        await adminStore.value.deleteFile(getPathFromUrl(originalItem[key]))
      }
    }

    if(localItem.id && filesDownloadList.value.length) {
      for (const { file, key } of filesDownloadList.value) {
        // удалить старый файл для замены на новый
        if (localItem[key]) {
          await adminStore.value.deleteFile(getPathFromUrl(localItem[key]))
        }

        localItem[key] = await adminStore.value.uploadFile(file, localItem.id)
      }
    }

    await adminStore.value.saveItem(toRaw(localItem))
    await adminStore.value.load()
    emit('saved')
  } catch (e) {
    console.error(e)
    uploadError.value = 'Ошибка сохранения'
  } finally {
    uploading.value = false
    filesDownloadList.value = []
  }
}

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <tr v-if="localItem">
    <!-- ACTIONS -->
    <td  class="items-center">
      <button @click="onSave" :disabled="uploading">💾</button>
      <button @click="onCancel" style="margin-left:6px;">✖</button>
    </td>

    <!-- CATEGORY -->
    <td>
      <input v-model="localItem.category" placeholder="Категория" />
    </td>

    <!-- COLUMNS -->
    <td v-for="col in currentConfig.columns" :key="col.key">
      <template v-if="col.type === 'file' || col.type === 'image'">
        <input
            type="file"
            :accept="col.type === 'image' ? 'image/*' : undefined"
            @change="e => onFileSelect((e.target as HTMLInputElement).files, col.key)"
        />

        <!-- OLD FILE -->
        <template v-if="localItem[col.key] && !getNewFile(col.key)">
          <template v-if="col.type === 'image'">
            <img :src="`${localItem[col.key]}?v=${Date.now()}`" class="thumb" :alt="col.key"/>
          </template>
          <template v-else>
            <a :href="localItem[col.key]" target="_blank">текущий файл</a>
          </template>
          <button @click="removeCurrentFile(col.key)">✖</button>
        </template>

        <!-- NEW FILE -->
        <div v-if="getNewFile(col.key)">
          <template v-if="col.type === 'image'">
            <img :src="filePreviews[col.key]" class="thumb" :alt="col.key"/>
          </template>
          <template v-else>
            {{ getNewFile(col.key)?.file.name }}
          </template>
          <button @click="removeNewFile(col.key)">✖</button>
        </div>

      </template>
      <template v-else-if="col.type === 'link'">
        <div class="links">
          <div
              v-for="(link, index) in (localItem[col.key] || [])"
              :key="index"
              class="link-row"
          >
            <input
                v-model="link.title"
                placeholder="Название"
            />
            <input
                v-model="link.url"
                placeholder="https://..."
            />
            <button @click="removeLink(col.key, index)">✖</button>
          </div>

          <button class="add-link" @click="addLink(col.key)">
            ➕ Добавить ссылку
          </button>
        </div>
      </template>
      <textarea v-else-if="col.type === 'textarea'" v-model="localItem[col.key]" />
      <input v-else v-model="localItem[col.key]" />
    </td>
  </tr>
</template>

<style scoped>
.thumb {
  display: block;
  max-width: 80px;
  max-height: 80px;
  margin: auto;
  border: 1px solid #333;
}
.items-center {
  text-align: center;
  justify-content: center;
}
.items-table th,
.items-table td {
  border: 1px solid #333;
  padding: 6px;
}
.items-table input {
  width: 100%;
  box-sizing: border-box;
}
.items-table textarea {
  min-width: 300px;
  width: 100%;
  height: 100px;
  box-sizing: border-box;
}
.items-table input[type="file"] {
  display: block;
  width: auto;
  margin: 0 auto 10px;
}
.links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.link-row {
  display: flex;
  gap: 6px;
}
.link-row input {
  flex: 1;
}
.add-link {
  margin-top: 6px;
  font-size: 13px;
}
</style>
