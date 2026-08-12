// study.js — Study View (dispatcher for all 6 modes)

import { getCardsByDeck, getDeck, getCards } from '../data.js';
import { isDue } from '../srs.js';
import { initFlashcard } from '../modes/flashcard.js';
import { initSRSReview } from '../modes/srsReview.js';
import { initQuiz } from '../modes/quiz.js';
import { initTyping } from '../modes/typing.js';
import { initMatching } from '../modes/matching.js';
import { initListening } from '../modes/listening.js';

const MODE_INFO = {
  flashcard: { icon: '🃏', name: 'Flashcard', minCards: 1 },
  srs: { icon: '🧠', name: 'Ôn tập SRS', minCards: 1 },
  'quiz-en': { icon: '📝', name: 'Quiz EN → VI', minCards: 4 },
  'quiz-vi': { icon: '📝', name: 'Quiz VI → EN', minCards: 4 },
  typing: { icon: '⌨️', name: 'Typing', minCards: 1 },
  matching: { icon: '🔗', name: 'Ghép cặp', minCards: 4 },
  listening: { icon: '🎧', name: 'Listening', minCards: 4 },
};

export function renderStudy(container, deckId, mode) {
  const deck = getDeck(deckId);
  const allCards = getCardsByDeck(deckId);
  const info = MODE_INFO[mode] || MODE_INFO.flashcard;

  if (!deck) {
    container.innerHTML = `<div class="empty-state"><p>Không tìm thấy deck.</p><button class="btn btn-ghost" onclick="location.hash='#dashboard'">← Về trang chính</button></div>`;
    return;
  }

  // For SRS mode, filter only due cards
  let cards = allCards;
  if (mode === 'srs') {
    cards = allCards.filter(c => isDue(c));
    if (cards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h2>Không có thẻ cần ôn!</h2>
          <p>Tất cả thẻ trong deck này đều chưa đến hạn ôn tập.</p>
          <button class="btn btn-ghost" id="btnBack">← Quay về</button>
        </div>
      `;
      container.querySelector('#btnBack').addEventListener('click', () => {
        location.hash = `#deck/${deckId}`;
      });
      return;
    }
  }

  if (cards.length < info.minCards) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h2>Chưa đủ thẻ!</h2>
        <p>Cần ít nhất ${info.minCards} thẻ để sử dụng chế độ ${info.name}. Hiện có ${cards.length} thẻ.</p>
        <button class="btn btn-ghost" id="btnBack">← Quay về</button>
      </div>
    `;
    container.querySelector('#btnBack').addEventListener('click', () => {
      location.hash = `#deck/${deckId}`;
    });
    return;
  }

  // Study header
  container.innerHTML = `
    <div class="study-view">
      <div class="study-header">
        <button class="btn btn-ghost btn-sm" id="btnExit">✕ Thoát</button>
        <div class="study-title">${info.icon} ${info.name} — ${deck.name}</div>
        <div></div>
      </div>
      <div class="study-body" id="studyBody"></div>
    </div>
  `;

  const studyBody = container.querySelector('#studyBody');
  const onFinish = () => { location.hash = `#deck/${deckId}`; };

  container.querySelector('#btnExit').addEventListener('click', () => {
    if (confirm('Bạn có muốn thoát phiên học?')) onFinish();
  });

  // Dispatch to correct mode
  let cleanup = null;
  switch (mode) {
    case 'flashcard':
      cleanup = initFlashcard(studyBody, cards, onFinish);
      break;
    case 'srs':
      cleanup = initSRSReview(studyBody, cards, onFinish);
      break;
    case 'quiz-en':
      cleanup = initQuiz(studyBody, cards, onFinish, 'en-vi');
      break;
    case 'quiz-vi':
      cleanup = initQuiz(studyBody, cards, onFinish, 'vi-en');
      break;
    case 'typing':
      cleanup = initTyping(studyBody, cards, onFinish);
      break;
    case 'matching':
      cleanup = initMatching(studyBody, cards, onFinish);
      break;
    case 'listening':
      cleanup = initListening(studyBody, cards, onFinish);
      break;
  }

  // Return cleanup function for router
  return cleanup;
}
