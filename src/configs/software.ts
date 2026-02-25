import type { PageConfig } from '@/engine/types'

export const softwareConfig: PageConfig = {
    title: 'Программы и файлы для Ford Kuga I',
    collection: 'software',

    categories: [ 'Программы', 'Файлы' ],

    columns: [
        { key: 'image', title: 'Фото', type: 'image' },
        { key: 'title', title: 'Название' },
        { key: 'description', title: 'Описание', type: 'textarea' },
        { key: 'author', title: 'Автор' },
        { key: 'article', title: 'Ссылка на первоисточник', type: 'link' },
        { key: 'download', title: 'Скачать из вне', type: 'link' },
        { key: 'file', title: 'Скачать с сайта', type: 'file' }
    ]
}
