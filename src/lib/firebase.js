import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut } from 'firebase/auth'

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
  console.warn('Firebase config সেট নেই — DeterMind browse করা যাবে, কিন্তু Login-gated feature (Tracker/Todo/Routine/Sigma/Focus) আনলক করা যাবে না।')
}

// Browsing (Home, Profile) must stay usable even when Firebase isn't
// configured; only the login-gated features (see RequireAuth) need it.
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

// Real Google sign-in, used to unlock login-gated features. If the device
// already has an anonymous session (from ensureAnonymousUser), link to it
// instead of replacing it, so any data already backed up under that id
// (see useCloudSync.js) stays attached to the account.
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase কনফিগার করা নেই')
  const provider = new GoogleAuthProvider()
  try {
    if (auth.currentUser?.isAnonymous) {
      const cred = await linkWithPopup(auth.currentUser, provider)
      return cred.user
    }
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  } catch (e) {
    // Account already exists under this Google email with a different uid —
    // fall back to a plain sign-in (the anonymous session's local-only data
    // simply won't be linked to it).
    if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use') {
      const cred = await signInWithPopup(auth, provider)
      return cred.user
    }
    throw e
  }
}

export async function signOutUser() {
  if (!auth) return
  await signOut(auth)
}
