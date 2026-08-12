// srsReview.js — SRS Review Mode (Ôn tập thông minh SM-2)

import { speak } from '../utils/speech.js';
import { updateCardSRS, updateCardStats, recordStudy, getSettings } from '../data.js';
import { calculateSRS, previewIntervals, intervalText } from '../srs.js';

export function initSRSReview(container, cards, onFinish) {
  const settings = getSettings();
  let current = 0;
  let flipped = false;
  let results = []; // { card, quality }

  function render() {
    if (current >= cards.length) {
      showResult();
      return;
    }
    const card = cards[current];
    const progress = (current / cards.length) * 100;
    const preview = previewIntervals(card.srs || { interval: 0, repetition: 0, easeFactor: 2.5 });

    container.innerHTML = `
      <div class="study-progress">
        <div class="progress-bar"><div class="progress-fill srs-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${current + 1} / ${cards.length}</span>
      </div>
      <div class="flashcard-container">
        <div class="flashcard-3d srs-card ${flipped ? 'flipped' : ''}" id="flashcard3d">
          <div class="flashcard-face flashcard-front">
            <button class="btn-speak" id="btnSpeak" title="Phát âm">🔊</button>
            <div class="flashcard-word">${card.front}</div>
            <div class="flashcard-phonetic">${card.phonetic || ''}</div>
            ${card.wordType ? `<span class="word-type-badge">${card.wordType}</span>` : ''}
            <div class="flashcard-hint">Nhấn để xem đáp án</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <button class="btn-speak" id="btnSpeakBack" title="Phát âm">🔊</button>
            <div class="flashcard-meaning">${card.back}</div>
            ${card.example ? `<div class="flashcard-example">"${card.example}"</div>` : ''}
            ${card.exampleVi ? `<div class="flashcard-example-vi">${card.exampleVi}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="srs-actions ${flipped ? 'visible' : ''}">
        <button class="btn btn-srs btn-again" data-quality="1">
          <span class="srs-btn-label">Lại</span>
          <span class="srs-btn-interval">${intervalText(preview.again)}</span>
        </button>
        <button class="btn btn-srs btn-hard" data-quality="3">
          <span class="srs-btn-label">Khó</span>
          <span class="srs-btn-interval">${intervalText(preview.hard)}</span>
        </button>
        <button class="btn btn-srs btn-good" data-quality="4">
          <span class="srs-btn-label">Tốt</span>
          <span class="srs-btn-interval">${intervalText(preview.good)}</span>
        </button>
        <button class="btn btn-srs btn-easy" data-quality="5">
          <span class="srs-btn-label">Dễ</span>
          <span class="srs-btn-interval">${intervalText(preview.easy)}</span>
        </button>
      </div>
    `;

    // Flip card
    const fc = container.querySelector('#flashcard3d');
    fc.addEventListener('click', () => {
      if (!flipped) {
        flipped = true;
        fc.classList.add('flipped');
        container.querySelector('.srs-actions').classList.add('visible');
      }
    });

    // Speak buttons
    container.querySelector('#btnSpeak')?.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(card.front, settings.speechRate);
    });
    container.querySelector('#btnSpeakBack')?.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(card.front, settings.speechRate);
    });

    // SRS rating buttons
    container.querySelectorAll('.btn-srs').forEach(btn => {
      btn.addEventListener('click', () => {
        const quality = parseInt(btn.dataset.quality);
        const newSrs = calculateSRS(
          card.srs || { interval: 0, repetition: 0, easeFactor: 2.5 },
          quality
        );
        updateCardSRS(card.id, newSrs);
        updateCardStats(card.id, quality >= 3);
        results.push({ card, quality });
        next();
      });
    });

    // Keyboard
    container._keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!flipped) {
          flipped = true;
          fc.classList.add('flipped');
          container.querySelector('.srs-actions').classList.add('visible');
        }
      } else if (flipped) {
        const keyMap = { Digit1: 1, Digit2: 3, Digit3: 4, Digit4: 5 };
        const quality = keyMap[e.code];
        if (quality) {
          const newSrs = calculateSRS(card.srs || { interval: 0, repetition: 0, easeFactor: 2.5 }, quality);
          updateCardSRS(card.id, newSrs);
          updateCardStats(card.id, quality >= 3);
          results.push({ card, quality });
          next();
        }
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
    const correct = results.filter(r => r.quality >= 3).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    recordStudy('srs', total, correct);

    const again = results.filter(r => r.quality === 1);

    container.innerHTML = `
      <div class="result-screen">
        <div class="result-icon">🧠</div>
        <h2>Ôn tập hoàn tất!</h2>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-value">${total}</span>
            <span class="result-stat-label">Đã ôn</span>
          </div>
          <div class="result-stat success">
            <span class="result-stat-value">${correct}</span>
            <span class="result-stat-label">Nhớ</span>
          </div>
          <div class="result-stat danger">
            <span class="result-stat-value">${total - correct}</span>
            <span class="result-stat-label">Quên</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">${pct}%</span>
            <span class="result-stat-label">Tỉ lệ</span>
          </div>
        </div>
        ${again.length > 0 ? `
          <div class="result-wrong-list">
            <h3>Cần ôn lại:</h3>
            <ul>${again.map(r => `<li><strong>${r.card.front}</strong> — ${r.card.back}</li>`).join('')}</ul>
          </div>
        ` : ''}
        <div class="result-actions">
          <button class="btn btn-ghost" id="btnBack">← Quay về</button>
        </div>
      </div>
    `;

    container.querySelector('#btnBack')?.addEventListener('click', onFinish);
  }

  render();
  return () => { document.removeEventListener('keydown', container._keyHandler); };
}
