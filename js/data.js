// data.js — localStorage CRUD for decks, cards, settings, study history

import { generateId, todayStr } from './utils/helpers.js';
import { getInitialSRS } from './srs.js';

const KEYS = {
  decks: 'vocaFlash_decks',
  cards: 'vocaFlash_cards',
  settings: 'vocaFlash_settings',
  history: 'vocaFlash_studyHistory',
};

// ─── SAMPLE DATA SEEDING ────────────────────────────────
const SAMPLE_DECKS = [
  {
    id: 'deck_sample_1',
    name: 'IELTS Vocabulary',
    description: 'Từ vựng IELTS quan trọng band 6.5+',
    color: '#6C5CE7',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'deck_sample_2',
    name: 'Giao Tiếp Hàng Ngày',
    description: 'Cụm từ & từ vựng dùng trong cuộc sống',
    color: '#00D2D3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const SAMPLE_CARDS = [
  {
    id: 'card_sample_101',
    deckId: 'deck_sample_1',
    front: 'ubiquitous',
    back: 'có mặt ở khắp nơi, phổ biến',
    phonetic: '/juːˈbɪk.wɪ.təs/',
    wordType: 'adjective',
    example: 'Smartphones have become ubiquitous in modern society.',
    exampleVi: 'Điện thoại thông minh đã trở nên phổ biến khắp nơi trong xã hội hiện đại.',
    note: 'Đồng nghĩa: omnipresent, pervasive',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_102',
    deckId: 'deck_sample_1',
    front: 'meticulous',
    back: 'tỉ mỉ, cẩn thận, chu đáo',
    phonetic: '/məˈtɪk.jə.ləs/',
    wordType: 'adjective',
    example: 'He is always meticulous about his work.',
    exampleVi: 'Anh ấy luôn luôn tỉ mỉ trong công việc của mình.',
    note: 'Đồng nghĩa: careful, thorough',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_103',
    deckId: 'deck_sample_1',
    front: 'resilient',
    back: 'kiên cường, có khả năng phục hồi nhanh',
    phonetic: '/rɪˈzɪl.jənt/',
    wordType: 'adjective',
    example: 'Children are remarkably resilient to changes.',
    exampleVi: 'Trẻ em thích nghi và phục hồi rất nhanh trước những sự thay đổi.',
    note: 'Thường đi với to',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_104',
    deckId: 'deck_sample_1',
    front: 'scrutinize',
    back: 'xem xét kỹ lưỡng, nghiên cứu cẩn thận',
    phonetic: '/ˈskruː.tə.naɪz/',
    wordType: 'verb',
    example: 'The inspector will scrutinize all documents.',
    exampleVi: 'Thanh tra sẽ kiểm tra kỹ lưỡng tất cả tài liệu.',
    note: 'Danh từ: scrutiny',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_105',
    deckId: 'deck_sample_1',
    front: 'ambiguity',
    back: 'mơ hồ, đa nghĩa, không rõ ràng',
    phonetic: '/ˌæm.bɪˈɡjuː.ə.ti/',
    wordType: 'noun',
    example: 'You must avoid ambiguity in your essay.',
    exampleVi: 'Bạn phải tránh sự mơ hồ trong bài luận của mình.',
    note: 'Tính từ: ambiguous',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_106',
    deckId: 'deck_sample_1',
    front: 'profound',
    back: 'sâu sắc, thâm thúy, lớn lao',
    phonetic: '/prəˈfaʊnd/',
    wordType: 'adjective',
    example: 'The book had a profound impact on my perspective.',
    exampleVi: 'Cuốn sách đã có ảnh hưởng sâu sắc đến góc nhìn của tôi.',
    note: '',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_201',
    deckId: 'deck_sample_2',
    front: 'break the ice',
    back: 'làm quen, phá tan sự gượng gạo ban đầu',
    phonetic: '/breɪk ði aɪs/',
    wordType: 'idiom',
    example: 'A simple joke helped break the ice at the meeting.',
    exampleVi: 'Một trò đùa đơn giản giúp không khí cuộc họp trở nên thân thiện hơn.',
    note: '',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_202',
    deckId: 'deck_sample_2',
    front: 'hit the nail on the head',
    back: 'nói chính xác, đoán trúng phóc',
    phonetic: '/hɪt ðə neɪl ɒn ðə hed/',
    wordType: 'idiom',
    example: 'You hit the nail on the head with your analysis.',
    exampleVi: 'Bạn đã chỉ ra hoàn toàn chính xác với phân tích của mình.',
    note: '',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_203',
    deckId: 'deck_sample_2',
    front: 'out of the blue',
    back: 'bất ngờ, không báo trước',
    phonetic: '/aʊt əv ðə bluː/',
    wordType: 'phrase',
    example: 'She called me out of the blue yesterday.',
    exampleVi: 'Cô ấy bất ngờ gọi cho tôi vào ngày hôm qua.',
    note: 'Đồng nghĩa: unexpectedly',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  },
  {
    id: 'card_sample_204',
    deckId: 'deck_sample_2',
    front: 'spill the beans',
    back: 'tiết lộ bí mật',
    phonetic: '/spɪl ðə biːnz/',
    wordType: 'idiom',
    example: 'Don\'t spill the beans about the surprise party!',
    exampleVi: 'Đừng tiết lộ bí mật về bữa tiệc bất ngờ nhé!',
    note: '',
    srs: getInitialSRS(),
    stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 }
  }
];

// ─── Generic storage helpers ────────────────────────────
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch {
    return null;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── DECKS ──────────────────────────────────────────────
export function getDecks() {
  let decks = load(KEYS.decks);
  if (!decks || decks.length === 0) {
    save(KEYS.decks, SAMPLE_DECKS);
    save(KEYS.cards, SAMPLE_CARDS);
    return SAMPLE_DECKS;
  }
  return decks;
}

export function getDeck(id) {
  return getDecks().find(d => d.id === id) || null;
}

export function saveDeck(deck) {
  const decks = getDecks();
  const idx = decks.findIndex(d => d.id === deck.id);
  if (idx >= 0) {
    decks[idx] = { ...decks[idx], ...deck, updatedAt: new Date().toISOString() };
  } else {
    decks.push({
      id: generateId('deck'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...deck,
    });
  }
  save(KEYS.decks, decks);
  triggerAutoCloudPush();
  return decks;
}

export function deleteDeck(id) {
  const decks = getDecks().filter(d => d.id !== id);
  save(KEYS.decks, decks);
  // Also delete all cards in this deck
  const cards = getCards().filter(c => c.deckId !== id);
  save(KEYS.cards, cards);
  triggerAutoCloudPush();
  return decks;
}

// ─── CARDS ──────────────────────────────────────────────
export function getCards() {
  return load(KEYS.cards) || [];
}

export function getCardsByDeck(deckId) {
  return getCards().filter(c => c.deckId === deckId);
}

export function getCard(id) {
  return getCards().find(c => c.id === id) || null;
}

let syncTimeout = null;
function triggerAutoCloudPush() {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    import('./cloud.js').then(m => m.pushToCloud()).catch(() => {});
  }, 1000);
}

export function saveCard(card) {
  const cards = getCards();
  const idx = cards.findIndex(c => c.id === card.id);
  if (idx >= 0) {
    cards[idx] = { ...cards[idx], ...card };
  } else {
    cards.push({
      id: generateId('card'),
      createdAt: new Date().toISOString(),
      srs: getInitialSRS(),
      stats: { totalReviews: 0, correctCount: 0, incorrectCount: 0 },
      ...card,
    });
  }
  save(KEYS.cards, cards);
  triggerAutoCloudPush();
  return cards;
}

export function deleteCard(id) {
  const cards = getCards().filter(c => c.id !== id);
  save(KEYS.cards, cards);
  triggerAutoCloudPush();
  return cards;
}

export function updateCardSRS(cardId, newSrs) {
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.srs = newSrs;
    save(KEYS.cards, cards);
    triggerAutoCloudPush();
  }
}

export function updateCardStats(cardId, correct) {
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.stats.totalReviews += 1;
    if (correct) card.stats.correctCount += 1;
    else card.stats.incorrectCount += 1;
    save(KEYS.cards, cards);
    triggerAutoCloudPush();
  }
}

// ─── SETTINGS ───────────────────────────────────────────
const DEFAULT_SETTINGS = {
  cardsPerSession: 20,
  speechRate: 1,
  autoPlayAudio: false,
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(load(KEYS.settings) || {}) };
}

export function saveSettings(settings) {
  save(KEYS.settings, { ...getSettings(), ...settings });
}

// ─── STUDY HISTORY ──────────────────────────────────────
// Format: { "2026-08-12": { reviewed: 15, correct: 12, modes: { flashcard: 5, quiz: 10 } } }
export function getHistory() {
  return load(KEYS.history) || {};
}

export function recordStudy(mode, count, correctCount = 0) {
  const history = getHistory();
  const today = todayStr();
  if (!history[today]) {
    history[today] = { reviewed: 0, correct: 0, modes: {} };
  }
  history[today].reviewed += count;
  history[today].correct += correctCount;
  history[today].modes[mode] = (history[today].modes[mode] || 0) + count;
  save(KEYS.history, history);
}

export function getStreak() {
  const history = getHistory();
  const today = new Date();
  let streak = 0;
  let date = new Date(today);

  // Check if studied today
  const todayKey = todayStr();
  if (!history[todayKey] || history[todayKey].reviewed === 0) {
    // Check yesterday — user might not have studied today yet
    date.setDate(date.getDate() - 1);
  }

  while (true) {
    const key = date.toISOString().split('T')[0];
    if (history[key] && history[key].reviewed > 0) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getLongestStreak() {
  const history = getHistory();
  const dates = Object.keys(history).filter(d => history[d].reviewed > 0).sort();
  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

// ─── IMPORT / EXPORT ────────────────────────────────────
export function exportAllData() {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    decks: getDecks(),
    cards: getCards(),
    settings: getSettings(),
    history: getHistory(),
  }, null, 2);
}

export function importAllData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.decks) save(KEYS.decks, data.decks);
    if (data.cards) save(KEYS.cards, data.cards);
    if (data.settings) save(KEYS.settings, data.settings);
    if (data.history) save(KEYS.history, data.history);
    return { success: true, message: `Đã import ${(data.decks || []).length} deck, ${(data.cards || []).length} thẻ.` };
  } catch (e) {
    return { success: false, message: 'File JSON không hợp lệ: ' + e.message };
  }
}

export function exportDeck(deckId) {
  const deck = getDeck(deckId);
  const cards = getCardsByDeck(deckId);
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    deck,
    cards,
  }, null, 2);
}

export function importDeck(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.deck) throw new Error('Không tìm thấy dữ liệu deck');

    // Generate new IDs to avoid conflicts
    const newDeckId = generateId('deck');
    const deck = { ...data.deck, id: newDeckId, createdAt: new Date().toISOString() };
    saveDeck(deck);

    if (data.cards && Array.isArray(data.cards)) {
      data.cards.forEach(card => {
        saveCard({
          ...card,
          id: generateId('card'),
          deckId: newDeckId,
        });
      });
    }
    return { success: true, message: `Đã import deck "${deck.name}" với ${(data.cards || []).length} thẻ.` };
  } catch (e) {
    return { success: false, message: 'File JSON không hợp lệ: ' + e.message };
  }
}

export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

// ─── DICTIONARY, TRANSLATION & IMAGE APIS ────────────────
export async function translateText(text) {
  if (!text || !text.trim()) return '';
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|vi`);
    if (!res.ok) return '';
    const data = await res.json();
    return data.responseData?.translatedText || '';
  } catch {
    return '';
  }
}

export async function searchImages(query) {
  if (!query || !query.trim()) return [];
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query.trim())}&gsrlimit=8&prop=pageimages&pithumbsize=400&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.query || !data.query.pages) return [];

    const images = [];
    Object.values(data.query.pages).forEach(page => {
      if (page.thumbnail && page.thumbnail.source) {
        images.push({
          url: page.thumbnail.source,
          title: page.title ? page.title.replace('File:', '') : query,
        });
      }
    });
    return images;
  } catch {
    return [];
  }
}

export function mapWordType(pos) {
  if (!pos) return '';
  const p = pos.toLowerCase().trim();
  if (p.includes('noun') || p === 'n') return 'noun';
  if (p.includes('verb') || p === 'v') return 'verb';
  if (p.includes('adj') || p.includes('adjective')) return 'adjective';
  if (p.includes('adv') || p.includes('adverb')) return 'adverb';
  if (p.includes('prep') || p.includes('preposition')) return 'preposition';
  if (p.includes('conj') || p.includes('conjunction')) return 'conjunction';
  if (p.includes('interj') || p.includes('interjection')) return 'interjection';
  if (p.includes('pron') || p.includes('pronoun')) return 'pronoun';
  if (p.includes('det') || p.includes('determiner')) return 'determiner';
  if (p.includes('phrase')) return 'phrase';
  if (p.includes('idiom')) return 'idiom';
  return '';
}

export async function lookupWord(word) {
  const cleanWord = word.trim();
  if (!cleanWord) return { success: false, message: 'Nhập từ tiếng Anh' };

  try {
    // Run translation, image search, and dictionary API in parallel
    const [dictRes, viTranslation, images] = await Promise.all([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      translateText(cleanWord),
      searchImages(cleanWord),
    ]);

    let phonetic = '';
    let wordType = '';
    let meanings = [];
    let exampleEn = '';

    if (dictRes && Array.isArray(dictRes) && dictRes.length > 0) {
      const entry = dictRes[0];
      phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find(p => p.text)?.text) || '';

      for (const meaning of entry.meanings || []) {
        const mappedType = mapWordType(meaning.partOfSpeech);
        if (!wordType && mappedType) wordType = mappedType;

        for (const def of meaning.definitions || []) {
          if (!exampleEn && def.example) exampleEn = def.example;

          meanings.push({
            wordType: meaning.partOfSpeech || '',
            mappedType: mappedType,
            definition: def.definition || '',
            example: def.example || '',
          });
        }
      }
    }

    // Auto translate top definition if available
    let definitionVi = viTranslation;
    let exampleVi = '';
    if (exampleEn) {
      exampleVi = await translateText(exampleEn);
    }

    return {
      success: true,
      word: cleanWord,
      phonetic,
      wordType,
      viTranslation: definitionVi,
      exampleEn,
      exampleVi,
      meanings,
      images,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

