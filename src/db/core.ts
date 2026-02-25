import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    deleteDoc,
    doc,
    writeBatch,
} from 'firebase/firestore'

import { db } from '@/firebase'

export const collections = [
    'tuning',
    'parts',
    'repair',
    'software',
    'manuals',
    'map'
] as const

export type Collection = typeof collections[number]

export async function getAll<T>(collectionName: Collection): Promise<T[]> {
    const snapshot = await getDocs(collection(db, collectionName))
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[]
}

export async function getById<T>(
    collectionName: Collection,
    id: string
): Promise<(T & { id: string }) | null> {
    const snap = await getDoc(doc(db, collectionName, id))
    return snap.exists()
        ? ({ id: snap.id, ...snap.data() } as T & { id: string })
        : null
}

export async function put<T extends { id?: string }>(
    collectionName: Collection,
    item: T
): Promise<T & { id: string }> {
    const { id, ...data } = item

    if (!id) {
        const ref = await addDoc(collection(db, collectionName), data)
        return { ...(data as T), id: ref.id }
    } else {
        await setDoc(doc(db, collectionName, id), data, { merge: true })
        return { ...(item as T), id }
    }
}


export async function remove(collectionName: Collection, id: string) {
    await deleteDoc(doc(db, collectionName, id))
}

export async function clear(collectionName: Collection) {
    const snapshot = await getDocs(collection(db, collectionName))
    const batch = writeBatch(db)
    snapshot.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
}
