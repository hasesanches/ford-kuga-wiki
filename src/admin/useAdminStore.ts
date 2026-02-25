import {ref} from 'vue'
import {Collection, getAll, put, remove} from '@/db/core'
import {supabase} from "@/supabase";

function normalizeFileName(original: string) {
    const ext = original.split('.').pop()?.toLowerCase() || 'file'

    const base = original
        .replace(/\.[^/.]+$/, '')        // убрать расширение
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')     // оставить только a-z0-9
        .replace(/^-+|-+$/g, '')         // убрать дефисы по краям

    return `${base || 'file'}-${Date.now()}.${ext}`
}

export function useAdminStore(collection: Collection) {
    const items = ref<any[]>([])
    const loading = ref(false)
    const error = ref('')

    async function load() {
        loading.value = true
        error.value = ''
        console.log('collection', collection)
        try {
            items.value = await getAll(collection)
        } catch (e) {
            error.value = (e as Error).message
        } finally {
            loading.value = false
        }
    }

    async function saveItem(item: any) {
        try {
            console.log('Saving item:', item)
            return await put(collection, item)
        } catch (e) {
            error.value = 'Ошибка при сохранении: ' + (e as Error).message
            console.error(error.value)
        }
    }

    async function deleteItem(id: string) {
        try {
            console.log('Delete item id:', id)
            await remove(collection, id)
            await deleteAllFiles(id)
        } catch (e) {
            error.value = 'Ошибка при удалении: ' + (e as Error).message
            console.error(error.value)
        }
    }

    async function deleteAllFiles(itemId: string) {
        const { data, error } = await supabase.storage
            .from('files')
            .list(`items/${itemId}`)

        if (error) throw error

        if (!data?.length) return

        const paths = data.map(f => `items/${itemId}/${f.name}`)

        await supabase.storage.from('files').remove(paths)
    }

    async function uploadFile(file: File, itemId: string) {
        const safeName = normalizeFileName(file.name)
        const path = `items/${itemId}/${safeName}`

        const { data, error } = await supabase
            .storage
            .from('files')
            .upload(path, file, { upsert: true })

        if (error) {
            console.error(error);
            throw error
        }

        const { data: url } = supabase
            .storage
            .from('files')
            .getPublicUrl(data.path)
        return url.publicUrl
    }

    return {
        deleteAllFiles,
        uploadFile,
        items,
        loading,
        error,
        load,
        saveItem,
        deleteItem
    }
}

