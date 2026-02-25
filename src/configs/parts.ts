import {PageConfig} from "@/engine/types";

export const partsConfig: PageConfig = {
    title: 'Аналоги запчастей для Ford Kuga I',
    collection: 'parts',

    categories: [ 'Патрубки', 'Элементы салона' ],

    columns: [
        { key: 'image', title: 'Фото', type: 'image' },
        { key: 'title', title: 'Название' },
        { key: 'article', title: 'Оригинальный артикул', type: 'textarea' },
        { key: 'articleReplacement', title: 'Артикулы аналогов', type: 'textarea' },
        { key: 'price', title: 'Цена', type: 'price' },
        { key: 'store', title: 'Магазин', type: 'link' },
        { key: 'install', title: 'Установка', type: 'link' }
    ]
}
