// cloud.js — Realtime Cloud Synchronization Engine for VocaFlash

import { getDecks, getCards, getSettings, getHistory } from './data.js';

const SYNC_KEY_STORAGE = 'vocaFlash_syncKey';
const LAST_SYNC_STORAGE = 'vocaFlash_lastSyncTime';

const APP_PREFIX = 'vocaflash_app_2026';
const CLOUD_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';

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

// Unicode-safe Base64 encoder/decoder
function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode('0x' + p1);
  }));
}

function base64ToUtf8(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
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

    const jsonStr = JSON.stringify(payload);
    const base64Data = utf8ToBase64(jsonStr);
    const encodedVal = encodeURIComponent(base64Data);

    const updateUrl = `${CLOUD_BASE}/UpdateValue/${APP_PREFIX}/${encodeURIComponent(syncKey)}/${encodedVal}`;
    const res = await fetch(updateUrl, { method: 'POST' });

    if (!res.ok) throw new Error('Không thể kết nối đến máy chủ đám mây');

    updateLastSyncTime();
    return { success: true, message: `Đã đẩy dữ liệu thành công với mã: "${syncKey}"` };
  } catch (e) {
    return { success: false, message: e.message || 'Không thể tải dữ liệu lên đám mây' };
  }
}

/**
 * Pull cloud data to local
 */
export async function pullFromCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa cài đặt Mã Đồng Bộ' };

  try {
    const getUrl = `${CLOUD_BASE}/GetValue/${APP_PREFIX}/${encodeURIComponent(syncKey)}`;
    const res = await fetch(getUrl);

    if (!res.ok) throw new Error('Không thể kết nối máy chủ đám mây');

    const base64Data = await res.json();
    if (!base64Data || typeof base64Data !== 'string') {
      return { success: false, message: `Mã "${syncKey}" mới (chưa có dữ liệu trên đám mây). Hãy bấm Đẩy Lên.` };
    }

    const jsonStr = base64ToUtf8(base64Data);
    const data = JSON.parse(jsonStr);

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
    return { success: true, message: `Tải thành công dữ liệu mã: "${syncKey}"` };
  } catch (e) {
    return { success: false, message: e.message || 'Không thể tải dữ liệu từ đám mây' };
  }
}

/**
 * Auto sync: pulls first, then pushes if cloud is empty
 */
export async function autoSync() {
  const syncKey = getSyncKey();
  if (!syncKey) return;

  const pullRes = await pullFromCloud();
  if (!pullRes.success && pullRes.message.includes('chưa có dữ liệu')) {
    await pushToCloud();
  }
}
