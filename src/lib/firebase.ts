import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDmGhRW3CAIydXCKRTgrAh1xg2_t9-nhgI',
  authDomain: 'v-cut-8e496.firebaseapp.com',
  projectId: 'v-cut-8e496',
  storageBucket: 'v-cut-8e496.firebasestorage.app',
  messagingSenderId: '279998839455',
  appId: '1:279998839455:web:fa71333bfb7ed33b4440aa',
};

export const app = !getApps().length
  ? initializeApp(firebaseConfig, 'vcut_primary')
  : getApp('vcut_primary');

// React Native cannot use Firestore's default WebChannel stream transport, so
// onSnapshot() listeners silently never fire (one-shot getDocs still works).
// Forcing long-polling makes realtime listeners work in the Expo/RN runtime.
// initializeFirestore must run once; guard against Fast Refresh re-init.
let _db: Firestore;
try {
  _db = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch {
  _db = getFirestore(app);
}
export const db = _db;
export const storage = getStorage(app);
