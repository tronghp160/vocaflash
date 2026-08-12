// cloud.js — Realtime Cloud Synchronization Engine for VocaFlash

import { getDecks, getCards, getSettings, getHistory, saveDeck, saveCard, saveSettings, getCardsByDeck } from './data.js';

const SYNC_KEY_STORAGE = 'vocaFlash_syncKey';
const LAST_SYNC_STORAGE = 'vocaFlash_lastSyncTime';

// Firebase Realtime DB open endpoint for Sync Key storage
const CLOUD_API_BASE = 'https://vocaflash-sync-default-rtdb.firebaseio.com/syncKeys';

export function getSyncKey() {
  return localStorage.getItem(SYNC_KEY_STORAGE) || '';
}

export function setSyncKey(key) {
  const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleanKey) {
    localStorage.setItem(SYNC_KEY_STORAGE, cleanKey);
  } else {
    localStorage.removeItem(SYNC_KEY_STORAGE);
  }
  return cleanKey;
}

export function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_STORAGE) || '';
}

function updateLastSyncTime() {
  const now = new Date().toISOString();
  localStorage.setItem(LAST_SYNC_STORAGE, now);
  return now;
}

/**
 * Push local data to cloud
 */
export async function pushToCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa cài đặt Mã Đồng Bộ' };

  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      decks: getDecks(),
      cards: getCards(),
      settings: getSettings(),
      history: getHistory(),
    };

    const res = await fetch(`${CLOUD_API_BASE}/${encodeURIComponent(syncKey)}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Không thể tải dữ liệu lên đám mây');

    updateLastSyncTime();
    return { success: true, message: 'Đồng bộ đám mây thành công!' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Pull cloud data to local
 */
export async function pullFromCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa cài đặt Mã Đồng Bộ' };

  try {
    const res = await fetch(`${CLOUD_API_BASE}/${encodeURIComponent(syncKey)}.json`);
    if (!res.ok) throw new Error('Không thể tải dữ liệu từ đám mây');

    const data = await res.json();
    if (!data) return { success: false, message: 'Mã Đồng Bộ mới (chưa có dữ liệu đám mây). Hãy bấm Đẩy Lên.' };

    // Merge decks & cards smartly
    if (data.decks && Array.isArray(data.decks)) {
      localStorage.setItem('vocaFlash_decks', JSON.stringify(data.decks));
    }
    if (data.cards && Array.isArray(data.cards)) {
      localStorage.setItem('vocaFlash_cards', JSON.stringify(data.cards));
    }
    if (data.settings) {
      localStorage.setItem('vocaFlash_settings', JSON.stringify(data.settings));
    }
    if (data.history) {
      localStorage.setItem('vocaFlash_studyHistory', JSON.stringify(data.history));
    }

    updateLastSyncTime();
    return { success: true, message: 'Tải dữ liệu đồng bộ thành công!' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Auto sync: pulls first, then pushes
 */
export async function autoSync() {
  const syncKey = getSyncKey();
  if (!syncKey) return;

  // Try to pull first
  await pullFromCloud();
  // Then push current local state to keep both aligned
  await pushToCloud();
}
