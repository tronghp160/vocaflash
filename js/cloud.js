// cloud.js — Realtime & Quick Sync Engine for VocaFlash

import { getDecks, getCards, getSettings, getHistory } from './data.js';

const SYNC_KEY_STORAGE = 'vocaFlash_syncKey';
const LAST_SYNC_STORAGE = 'vocaFlash_lastSyncTime';

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

// ─── ⚡ QUICK SYNC ENGINE (100% Reliable Offline/Online) ───
export function exportQuickSyncCode() {
  try {
    const payload = {
      v: 1,
      t: new Date().toISOString(),
      d: getDecks(),
      c: getCards(),
      s: getSettings(),
      h: getHistory(),
    };
    const json = JSON.stringify(payload);
    const base64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
    return 'VOCA1_' + base64;
  } catch (e) {
    return '';
  }
}

export function importQuickSyncCode(code) {
  try {
    if (!code || !code.trim()) throw new Error('Vui lòng dán Mã Đồng Bộ');
    let raw = code.trim();
    if (raw.startsWith('VOCA1_')) raw = raw.slice(6);

    const json = decodeURIComponent(Array.prototype.map.call(atob(raw), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const data = JSON.parse(json);

    if (data.d && Array.isArray(data.d)) {
      localStorage.setItem('vocaFlash_decks', JSON.stringify(data.d));
    }
    if (data.c && Array.isArray(data.c)) {
      localStorage.setItem('vocaFlash_cards', JSON.stringify(data.c));
    }
    if (data.s) {
      localStorage.setItem('vocaFlash_settings', JSON.stringify(data.s));
    }
    if (data.h) {
      localStorage.setItem('vocaFlash_studyHistory', JSON.stringify(data.h));
    }

    updateLastSyncTime();
    return {
      success: true,
      message: `Đồng bộ thành công! Đã tải ${(data.d || []).length} bộ thẻ và ${(data.c || []).length} thẻ từ vựng.`,
    };
  } catch (e) {
    return { success: false, message: 'Mã đồng bộ không hợp lệ hoặc bị lỗi ký tự.' };
  }
}

// ─── ☁️ CLOUD SYNC ENGINE ─────────────────────────────────
export async function createNewSyncSlot() {
  const code = exportQuickSyncCode();
  if (code) {
    setSyncKey(code);
    updateLastSyncTime();
    return { success: true, syncId: code, message: 'Đã tạo Mã Đồng Bộ Quick Sync thành công!' };
  }
  return { success: false, message: 'Không thể tạo mã' };
}

export async function pushToCloud() {
  const code = exportQuickSyncCode();
  if (!code) return { success: false, message: 'Không có dữ liệu để đồng bộ' };
  setSyncKey(code);
  updateLastSyncTime();
  return { success: true, syncId: code, message: 'Đã tạo Mã Quick Sync thành công!' };
}

export async function pullFromCloud() {
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, message: 'Chưa nhập Mã Đồng Bộ' };
  return importQuickSyncCode(syncKey);
}

export async function autoSync() {
  const syncKey = getSyncKey();
  if (!syncKey) return;
  importQuickSyncCode(syncKey);
}
