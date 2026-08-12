// cloud.js — Realtime Cloud Synchronization Engine for VocaFlash

import { getDecks, getCards, getSettings, getHistory } from './data.js';

const SYNC_KEY_STORAGE = 'vocaFlash_syncKey';
const LAST_SYNC_STORAGE = 'vocaFlash_lastSyncTime';
const ALIAS_PREFIX = 'vocaFlash_alias_';

const API_URL = 'https://api.restful-api.dev/objects';

export function getSyncKey() {
  return (localStorage.getItem(SYNC_KEY_STORAGE) || '').trim();
}

export function setSyncKey(key) {
  const cleanKey = (key || '').trim().toLowerCase();
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

function getMappedCloudId(syncKey) {
  if (!syncKey) return null;
  // If it looks like a direct 32-char hex ID, use it directly
  if (/^[a-f0-9]{32}$/i.test(syncKey)) {
    return syncKey;
  }
  // Otherwise check if we have a local alias mapping
  return localStorage.getItem(ALIAS_PREFIX + syncKey) || null;
}

function setMappedCloudId(syncKey, cloudId) {
  if (syncKey && cloudId) {
    localStorage.setItem(ALIAS_PREFIX + syncKey, cloudId);
  }
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
        data: { content: JSON.stringify(payload) },
      }),
    });

    if (!res.ok) throw new Error('Không thể tạo mã đồng bộ mới');
    const result = await res.json();
    if (!result.id) throw new Error('Máy chủ không phản hồi ID');

    const syncKey = getSyncKey() || 'my_sync';
    setMappedCloudId(syncKey, result.id);
    setSyncKey(result.id);
    updateLastSyncTime();
    return { success: true, syncId: result.id, message: `Đã tạo Mã Đồng Bộ mới: ${result.id}` };
  } catch (e) {
    return { success: false, message: e.message || 'Lỗi tạo mã đồng bộ' };
  }
}

/**
 * Push local data to cloud
 */
export async function pushToCloud() {
  let syncKey = getSyncKey();
  if (!syncKey) {
    return await createNewSyncSlot();
  }

  let cloudId = getMappedCloudId(syncKey);

  const payload = {
    updatedAt: new Date().toISOString(),
    decks: getDecks(),
    cards: getCards(),
    settings: getSettings(),
    history: getHistory(),
  };

  try {
    // If no cloud ID exists for this key, create a new one via POST
    if (!cloudId) {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `vocaflash_${syncKey}`,
          data: { content: JSON.stringify(payload) },
        }),
      });

      if (!res.ok) throw new Error('Không thể khởi tạo dữ liệu đám mây');
      const result = await res.json();
      if (!result.id) throw new Error('Lỗi phản hồi máy chủ');

      cloudId = result.id;
      setMappedCloudId(syncKey, cloudId);
      setSyncKey(cloudId); // set as active sync ID
      updateLastSyncTime();
      return { success: true, syncId: cloudId, message: `Đã khởi tạo và đẩy dữ liệu lên đám mây với mã ID: "${cloudId}"` };
    }

    // Existing cloud ID -> Update via PUT
    const res = await fetch(`${API_URL}/${encodeURIComponent(cloudId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `vocaflash_${syncKey}`,
        data: { content: JSON.stringify(payload) },
      }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        // If 404, re-create slot
        localStorage.removeItem(ALIAS_PREFIX + syncKey);
        return await pushToCloud();
      }
      throw new Error('Không thể tải dữ liệu lên đám mây');
    }

    updateLastSyncTime();
    return { success: true, syncId: cloudId, message: `Đẩy dữ liệu lên đám mây thành công! Mã ID: ${cloudId}` };
  } catch (e) {
    return { success: false, message: e.message || 'Lỗi đẩy dữ liệu lên đám mây' };
  }
}

/**
 * Pull cloud data to local
 */
export async function pullFromCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa nhập Mã Đồng Bộ (Sync ID)' };

  const cloudId = getMappedCloudId(syncKey) || syncKey;

  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(cloudId)}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Mã Đồng Bộ "${syncKey}" chưa tồn tại hoặc đã hết hạn. Hãy bấm Đẩy Lên (Push) trên máy có từ vựng trước.`);
      }
      throw new Error('Lỗi kết nối đám mây');
    }

    const result = await res.json();
    if (!result.data) {
      throw new Error('Dữ liệu trên đám mây không hợp lệ');
    }

    const rawData = result.data;
    const data = typeof rawData.content === 'string' ? JSON.parse(rawData.content) : rawData;

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

    // Save alias mapping
    setMappedCloudId(syncKey, cloudId);
    updateLastSyncTime();
    return { success: true, message: `Tải thành công dữ liệu từ đám mây!` };
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
