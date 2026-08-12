// helpers.js — Utility functions

export function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return formatDate(dateStr);
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function pickRandom(arr, count, exclude = []) {
  const filtered = arr.filter(item => !exclude.includes(item));
  const shuffled = shuffleArray(filtered);
  return shuffled.slice(0, count);
}

export function diffChars(input, correct) {
  const result = [];
  const maxLen = Math.max(input.length, correct.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= input.length) {
      result.push({ char: correct[i], status: 'missing' });
    } else if (i >= correct.length) {
      result.push({ char: input[i], status: 'extra' });
    } else if (input[i].toLowerCase() === correct[i].toLowerCase()) {
      result.push({ char: input[i], status: 'correct' });
    } else {
      result.push({ char: input[i], status: 'wrong', expected: correct[i] });
    }
  }
  return result;
}

export const DECK_COLORS = [
  '#6C5CE7', '#00D2D3', '#FF6B6B', '#00B894',
  '#FDCB6E', '#E17055', '#0984E3', '#D63031',
  '#6D5B98', '#00CEC9', '#FD79A8', '#55A3E8',
];

export const WORD_TYPES = [
  { value: 'noun', label: 'Danh từ (n)' },
  { value: 'verb', label: 'Động từ (v)' },
  { value: 'adjective', label: 'Tính từ (adj)' },
  { value: 'adverb', label: 'Trạng từ (adv)' },
  { value: 'preposition', label: 'Giới từ (prep)' },
  { value: 'conjunction', label: 'Liên từ (conj)' },
  { value: 'interjection', label: 'Thán từ (interj)' },
  { value: 'pronoun', label: 'Đại từ (pron)' },
  { value: 'determiner', label: 'Từ hạn định (det)' },
  { value: 'phrase', label: 'Cụm từ' },
  { value: 'idiom', label: 'Thành ngữ' },
];
