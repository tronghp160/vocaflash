// cloud.js — Direct Serverless Cloud Synchronization Engine for VocaFlash

import { getDecks, getCards, getSettings, getHistory } from './data.js';

const SYNC_KEY_STORAGE = 'vocaFlash_syncKey';
const LAST_SYNC_STORAGE = 'vocaFlash_lastSyncTime';

// Uses relative /api/sync when deployed on Vercel, or full fallback
const API_ENDPOINT = '/api/sync';

export function getSyncKey() {
  return (localStorage.getItem(SYNC_KEY_STORAGE) || '').trim();
}

export function setSyncKey(key) {
  const cleanKey = (key || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
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

// ─── ⚡ SHORT CLOUD SYNC ENGINE (NATIVE VERCEL API) ───

/**
 * Push local data to cloud using short sync key (e.g. phutrong2511)
 */
export async function pushToCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa nhập Mã Đồng Bộ (Ví dụ: phutrong2511)' };

  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      decks: getDecks(),
      cards: getCards(),
      settings: getSettings(),
      history: getHistory(),
    };

    const res = await fetch(`${API_ENDPOINT}?key=${encodeURIComponent(syncKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncKey,
        payload,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi lưu dữ liệu đám mây');
    }

    const data = await res.json();
    updateLastSyncTime();
    return { success: true, syncKey, message: `Đã đẩy dữ liệu thành công với mã: "${syncKey}"` };
  } catch (e) {
    // Fallback to Quick Sync code format if offline
    return { success: false, message: e.message || 'Không thể kết nối máy chủ' };
  }
}

/**
 * Pull cloud data to local using short sync key (e.g. phutrong2511)
 */
export async function pullFromCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa nhập Mã Đồng Bộ (Ví dụ: phutrong2511)' };

  // If user pasted a VOCA1_ offline code, import it directly
  if (syncKey.startsWith('voca1_') || syncKey.startsWith('VOCA1_')) {
    return importQuickSyncCode(syncKey);
  }

  try {
    const res = await fetch(`${API_ENDPOINT}?key=${encodeURIComponent(syncKey)}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Mã "${syncKey}" chưa có dữ liệu trên đám mây. Hãy bấm Đẩy Lên (Push) từ máy có dữ liệu trước.`);
      }
      throw new Error('Lỗi tải dữ liệu đám mây');
    }

    const result = await res.json();
    if (!result.data) {
      throw new Error('Dữ liệu đám mây không hợp lệ');
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
    return { success: true, message: `Đồng bộ thành công dữ liệu từ mã: "${syncKey}"!` };
  } catch (e) {
    return { success: false, message: e.message || 'Lỗi tải dữ liệu đám mây' };
  }
}

export async function createNewSyncSlot() {
  const syncKey = getSyncKey() || 'phutrong2511';
  setSyncKey(syncKey);
  return pushToCloud();
}

export async function autoSync() {
  const syncKey = getSyncKey();
  if (!syncKey) return;
  await pullFromCloud();
}

// ─── 📦 QUICK SYNC OFFLINE FALLBACK ───
export function exportQuickSyncCode() {
  try {
    const payload = {
      v: 1,
      d: getDecks(),
      c: getCards(),
      s: getSettings(),
      h: getHistory(),
    };
    return 'VOCA1_' + btoa(encodeURIComponent(JSON.stringify(payload)).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode('0x' + p1)));
  } catch { return ''; }
}

export function importQuickSyncCode(code) {
  try {
    let raw = code.trim();
    if (raw.toUpperCase().startsWith('VOCA1_')) raw = raw.slice(6);
    const json = decodeURIComponent(Array.prototype.map.call(atob(raw), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const data = JSON.parse(json);
    if (data.d) localStorage.setItem('vocaFlash_decks', JSON.stringify(data.d));
    if (data.c) localStorage.setItem('vocaFlash_cards', JSON.stringify(data.c));
    if (data.s) localStorage.setItem('vocaFlash_settings', JSON.stringify(data.s));
    if (data.h) localStorage.setItem('vocaFlash_studyHistory', JSON.stringify(data.h));
    updateLastSyncTime();
    return { success: true, message: `Đã nhập xong dữ liệu!` };
  } catch (e) {
    return { success: false, message: 'Mã không hợp lệ' };
  }
}
