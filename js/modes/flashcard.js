// flashcard.js — Flashcard Mode (Lật thẻ 3D)

import { shuffleArray } from '../utils/helpers.js';
import { speak } from '../utils/speech.js';
import { updateCardStats, recordStudy, getSettings } from '../data.js';

export function initFlashcard(container, cards, onFinish) {
  const shuffled = shuffleArray(cards);
  const settings = getSettings();
  const sessionCards = shuffled.slice(0, settings.cardsPerSession);
  let current = 0;
  let flipped = false;
  let knownCount = 0;
  let unknownCount = 0;
  const unknownCards = [];

  function render() {
    if (current >= sessionCards.length) {
      showResult();
      return;
    }
    const card = sessionCards[current];
    const progress = ((current) / sessionCards.length) * 100;

    container.innerHTML = `
      <div class="study-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${current + 1} / ${sessionCards.length}</span>
      </div>
      <div class="flashcard-container">
        <div class="flashcard-3d ${flipped ? 'flipped' : ''}" id="flashcard3d">
          <div class="flashcard-face flashcard-front">
            <button class="btn-speak" id="btnSpeak" title="Phát âm">🔊</button>
            <div class="flashcard-word">${card.front}</div>
            <div class="flashcard-phonetic">${card.phonetic || ''}</div>
            ${card.wordType ? `<span class="word-type-badge">${card.wordType}</span>` : ''}
            ${card.imageUrl ? `<img src="${card.imageUrl}" class="flashcard-img" alt="${card.front}">` : ''}
            <div class="flashcard-hint">Nhấn để lật thẻ</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <button class="btn-speak" id="btnSpeakBack" title="Phát âm">🔊</button>
            <div class="flashcard-meaning">${card.back}</div>
            ${card.example ? `<div class="flashcard-example">"${card.example}"</div>` : ''}
            ${card.exampleVi ? `<div class="flashcard-example-vi">${card.exampleVi}</div>` : ''}
            ${card.note ? `<div class="flashcard-note">📝 ${card.note}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="flashcard-actions ${flipped ? 'visible' : ''}">
        <button class="btn btn-danger" id="btnUnknown">❌ Chưa biết</button>
        <button class="btn btn-success" id="btnKnown">✅ Biết rồi</button>
      </div>
    `;

    // Event listeners
    const fc = container.querySelector('#flashcard3d');
    fc.addEventListener('click', () => {
      if (!flipped) {
        flipped = true;
        fc.classList.add('flipped');
        container.querySelector('.flashcard-actions').classList.add('visible');
        if (settings.autoPlayAudio) speak(card.front, settings.speechRate);
      }
    });

    container.querySelector('#btnSpeak')?.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(card.front, settings.speechRate);
    });

    container.querySelector('#btnSpeakBack')?.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(card.front, settings.speechRate);
    });

    container.querySelector('#btnKnown')?.addEventListener('click', () => {
      knownCount++;
      updateCardStats(card.id, true);
      next();
    });

    container.querySelector('#btnUnknown')?.addEventListener('click', () => {
      unknownCount++;
      unknownCards.push(card);
      updateCardStats(card.id, false);
      next();
    });

    // Keyboard support
    container._keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!flipped) {
          flipped = true;
          fc.classList.add('flipped');
          container.querySelector('.flashcard-actions').classList.add('visible');
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (flipped) { knownCount++; updateCardStats(card.id, true); next(); }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (flipped) { unknownCount++; unknownCards.push(card); updateCardStats(card.id, false); next(); }
      }
    };
    document.addEventListener('keydown', container._keyHandler);
  }

  function next() {
    document.removeEventListener('keydown', container._keyHandler);
    current++;
    flipped = false;
    render();
  }

  function showResult() {
    document.removeEventListener('keydown', container._keyHandler);
    const total = knownCount + unknownCount;
    const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0;
    recordStudy('flashcard', total, knownCount);

    container.innerHTML = `
      <div class="result-screen">
        <div class="result-icon">${pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2>Hoàn thành!</h2>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-value">${total}</span>
            <span class="result-stat-label">Tổng thẻ</span>
          </div>
          <div class="result-stat success">
            <span class="result-stat-value">${knownCount}</span>
            <span class="result-stat-label">Biết rồi</span>
          </div>
          <div class="result-stat danger">
            <span class="result-stat-value">${unknownCount}</span>
            <span class="result-stat-label">Chưa biết</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">${pct}%</span>
            <span class="result-stat-label">Tỉ lệ</span>
          </div>
        </div>
        ${unknownCards.length > 0 ? `
          <div class="result-wrong-list">
            <h3>Từ chưa thuộc:</h3>
            <ul>${unknownCards.map(c => `<li><strong>${c.front}</strong> — ${c.back}</li>`).join('')}</ul>
          </div>
        ` : ''}
        <div class="result-actions">
          <button class="btn btn-primary" id="btnRetry">🔄 Học lại</button>
          <button class="btn btn-ghost" id="btnBack">← Quay về</button>
        </div>
      </div>
    `;

    container.querySelector('#btnRetry')?.addEventListener('click', () => {
      current = 0; flipped = false; knownCount = 0; unknownCount = 0; unknownCards.length = 0;
      render();
    });
    container.querySelector('#btnBack')?.addEventListener('click', onFinish);
  }

  render();

  return () => {
    document.removeEventListener('keydown', container._keyHandler);
  };
}
