import type { PageConfig } from '@/engine/types'

export const tuningConfig: PageConfig = {
    title: 'Тюнинг Ford Kuga I',
    collection: 'tuning',

    categories: [ 'Кузов' ],

    columns: [
        { key: 'image', title: 'Фото', type: 'image' },
        { key: 'title', title: 'Название' },
        { key: 'description', title: 'Описание' },
        { key: 'link', title: 'Статья', type: 'link' }
    ]
}
