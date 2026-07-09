import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const KEY = 'vcut_offline_invoice_queue';

export interface QueuedInvoice {
  payload: any;
  customerUpdate?: { id: string; patch: any };
  enqueued_at: string;
}

export const enqueueInvoice = async (q: QueuedInvoice): Promise<void> => {
  const raw = await AsyncStorage.getItem(KEY);
  const list: QueuedInvoice[] = raw ? JSON.parse(raw) : [];
  list.push(q);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
};

export const queuedCount = async (): Promise<number> => {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return 0;
  try { return (JSON.parse(raw) as QueuedInvoice[]).length; } catch { return 0; }
};

export const flushQueue = async (): Promise<{ flushed: number; remaining: number }> => {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { flushed: 0, remaining: 0 };
  const list: QueuedInvoice[] = JSON.parse(raw);
  const remaining: QueuedInvoice[] = [];
  let flushed = 0;
  for (const q of list) {
    try {
      await addDoc(collection(db, 'invoices'), q.payload);
      if (q.customerUpdate) {
        await updateDoc(doc(db, 'customers', q.customerUpdate.id), q.customerUpdate.patch).catch(() => {});
      }
      flushed++;
    } catch {
      remaining.push(q);
    }
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(remaining));
  return { flushed, remaining: remaining.length };
};

export const startQueueAutoFlush = (onFlush: (n: number) => void): (() => void) => {
  const sub = NetInfo.addEventListener(async state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      const { flushed } = await flushQueue();
      if (flushed > 0) onFlush(flushed);
    }
  });
  return sub;
};

export const isOnline = async (): Promise<boolean> => {
  const s = await NetInfo.fetch();
  return !!s.isConnected && s.isInternetReachable !== false;
};
