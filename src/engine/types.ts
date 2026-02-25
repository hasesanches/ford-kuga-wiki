import { Collection } from "@/db/core";

export interface PageColumn {
    key: string
    title: string
    type?: 'text' | 'textarea' | 'image' | 'link' | 'file' | 'price'
}

export interface PageConfig {
    title: string
    collection: Collection
    categories: string[]
    columns: PageColumn[]
}
