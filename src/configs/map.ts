import type { PageConfig } from '@/engine/types'

export const mapConfig: PageConfig = {
    title: 'Точки на карте',
    collection: 'map',

    categories: [ 'service', 'garage', 'other' ],

    columns: [
        { key: 'image', title: 'Фото', type: 'image' },
        { key: 'name', title: 'Название' },
        { key: 'x', title: 'X' },
        { key: 'y', title: 'Y' },
        { key: 'description', title: 'Описание' },
        { key: 'contact', title: 'Контакты', type: 'link' }
    ]
}
