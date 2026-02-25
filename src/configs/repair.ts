import {PageConfig} from "@/engine/types";

export const repairConfig: PageConfig = {
    title: 'Ремонт Ford Kuga I',
    collection: 'repair',

    categories: [ 'Двигатель', 'Навесное оборудование', 'Кондиционер' ],

    columns: [
        { key: 'title', title: 'Название' },
        { key: 'articleLink', title: 'Статья', type: 'link' }
    ]
}
