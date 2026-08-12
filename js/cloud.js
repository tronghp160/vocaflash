// cloud.js — Realtime Cloud Synchronization Engine for VocaFlash

import { getDecks, getCards, getSettings, getHistory } from './data.js';

const SYNC_KEY_STORAGE = 'vocaFlash_syncKey';
const LAST_SYNC_STORAGE = 'vocaFlash_lastSyncTime';

const API_URL = 'https://api.restful-api.dev/objects';

export function getSyncKey() {
  return (localStorage.getItem(SYNC_KEY_STORAGE) || '').trim();
}

export function setSyncKey(key) {
  const cleanKey = (key || '').trim();
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
 * Create a new cloud sync slot and return its ID
 */
export async function createNewSyncSlot() {
  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      decks: getDecks(),
      cards: getCards(),
      settings: getSettings(),
      history: getHistory(),
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'vocaflash_sync_data',
        data: payload,
      }),
    });

    if (!res.ok) throw new Error('Không thể tạo mã đồng bộ mới');
    const result = await res.json();
    if (!result.id) throw new Error('Máy chủ không phản hồi ID');

    setSyncKey(result.id);
    updateLastSyncTime();
    return { success: true, syncId: result.id, message: `Đã tạo Mã Đồng Bộ mới thành công!` };
  } catch (e) {
    return { success: false, message: e.message || 'Lỗi tạo mã đồng bộ' };
  }
}

/**
 * Push local data to cloud
 */
export async function pushToCloud() {
  let syncKey = getSyncKey();

  // If no sync key exists, create one automatically on push
  if (!syncKey) {
    const createRes = await createNewSyncSlot();
    if (!createRes.success) return createRes;
    syncKey = createRes.syncId;
  }

  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      decks: getDecks(),
      cards: getCards(),
      settings: getSettings(),
      history: getHistory(),
    };

    const res = await fetch(`${API_URL}/${encodeURIComponent(syncKey)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'vocaflash_sync_data',
        data: payload,
      }),
    });

    if (!res.ok) {
      // If 404, the cloud ID might have expired — re-create a slot
      if (res.status === 404) {
        return await createNewSyncSlot();
      }
      throw new Error('Không thể tải dữ liệu lên đám mây');
    }

    updateLastSyncTime();
    return { success: true, syncId: syncKey, message: 'Đẩy dữ liệu lên đám mây thành công!' };
  } catch (e) {
    return { success: false, message: e.message || 'Lỗi đẩy dữ liệu lên đám mây' };
  }
}

/**
 * Pull cloud data to local
 */
export async function pullFromCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa cài đặt Mã Đồng Bộ' };

  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(syncKey)}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Mã Đồng Bộ không tồn tại hoặc đã hết hạn');
      }
      throw new Error('Lỗi kết nối đám mây');
    }

    const result = await res.json();
    if (!result.data) {
      throw new Error('Dữ liệu trên đám mây không hợp lệ');
    }

    const data = result.data;

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
    return { success: false, message: e.message || 'Lỗi tải dữ liệu từ đám mây' };
  }
}

/**
 * Auto sync
 */
export async function autoSync() {
  const syncKey = getSyncKey();
  if (!syncKey) return;
  await pullFromCloud();
}
