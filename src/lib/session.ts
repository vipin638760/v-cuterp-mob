import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './types';

const KEY = 'vcut_user';
const REMEMBER_KEY = 'vcut_remember';

export const saveSession = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(KEY, JSON.stringify(user));
};

export const loadSession = async (): Promise<User | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEY);
};

type RememberMap = Record<string, { uid: string; ts: number }>;

export const readRemember = async (): Promise<RememberMap> => {
  try {
    const raw = await AsyncStorage.getItem(REMEMBER_KEY);
    return raw ? (JSON.parse(raw) as RememberMap) : {};
  } catch {
    return {};
  }
};

export const writeRemember = async (role: string, uid: string): Promise<void> => {
  const map = await readRemember();
  map[role] = { uid, ts: Date.now() };
  await AsyncStorage.setItem(REMEMBER_KEY, JSON.stringify(map));
};

export const clearRemember = async (role?: string): Promise<void> => {
  if (!role) {
    await AsyncStorage.removeItem(REMEMBER_KEY);
    return;
  }
  const map = await readRemember();
  delete map[role];
  await AsyncStorage.setItem(REMEMBER_KEY, JSON.stringify(map));
};
