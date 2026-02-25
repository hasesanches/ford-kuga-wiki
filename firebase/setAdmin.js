// firebaseSetAdmin/setAdmin.js

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const keyPath = process.env.FIREBASE_KEY_PATH || join(__dirname, 'serviceAccountKey.json')
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function setAdmin() {
    try {
        const uid = process.env.ADMIN_UID

        if (!uid) {
            throw new Error('ADMIN_UID is not defined')
        }

        await admin.auth().setCustomUserClaims(uid, { admin: true })

        console.log(`Admin role granted to user ${uid}`)
        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

setAdmin().then(r => {
    console.log(`Finished setAdmin`)
})