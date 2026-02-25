import type { PageConfig } from '@/engine/types'

export const manualsConfig: PageConfig = {
    title: 'Библиотека Ford Kuga I',
    collection: 'manuals',

    categories: [ 'Мануалы', 'Инструкции' ],

    columns: [
        { key: 'image', title: 'Обложка', type: 'image' },
        { key: 'title', title: 'Название' },
        { key: 'description', title: 'Описание' },
        { key: 'file', title: 'Файл', type: 'file' }
    ]
}
