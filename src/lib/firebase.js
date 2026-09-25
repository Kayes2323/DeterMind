import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseReady = !!(firebaseConfig.apiKey && firebaseConfig.projectId)

if (!firebaseReady) {
  console.warn('Firebase config সেট নেই — DeterMind শুধু local storage-এ চলবে, cloud backup ছাড়াই।')
}

// DeterMind runs fully on local storage without login; Firestore is an
// optional cloud backup, so the app must stay usable when it isn't configured.
export const app = firebaseReady ? initializeApp(firebaseConfig) : null
export const db = firebaseReady ? getFirestore(app) : null
export const auth = firebaseReady ? getAuth(app) : null

// Signs the device into an anonymous Firebase account (no UI, no login screen)
// so cloud-backup writes have a stable per-device user id to key data by.
let anonUserPromise = null
export function ensureAnonymousUser() {
  if (!auth) return Promise.resolve(null)
  if (auth.currentUser) return Promise.resolve(auth.currentUser)
  if (!anonUserPromise) {
    anonUserPromise = signInAnonymously(auth)
      .then(cred => cred.user)
      .catch(e => {
        console.error('Firebase anonymous sign-in failed:', e)
        anonUserPromise = null
        return null
      })
  }
  return anonUserPromise
}
