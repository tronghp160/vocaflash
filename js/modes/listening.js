// listening.js — Listening Mode (Nghe phát âm, chọn nghĩa)

import { shuffleArray, pickRandom } from '../utils/helpers.js';
import { speak } from '../utils/speech.js';
import { updateCardStats, recordStudy, getSettings } from '../data.js';

export function initListening(container, cards, onFinish) {
  const settings = getSettings();
  const allCards = [...cards];
  const sessionCards = shuffleArray(cards).slice(0, settings.cardsPerSession);
  let current = 0;
  let correctCount = 0;
  let answered = false;
  const wrongCards = [];

  function render() {
    if (current >= sessionCards.length) {
      showResult();
      return;
    }
    answered = false;
    const card = sessionCards[current];
    const progress = (current / sessionCards.length) * 100;

    // Generate options
    const wrongAnswers = pickRandom(
      allCards.map(c => c.back),
      3,
      [card.back]
    );
    const options = shuffleArray([card.back, ...wrongAnswers]);

    container.innerHTML = `
      <div class="study-progress">
        <div class="progress-bar"><div class="progress-fill listening-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${current + 1} / ${sessionCards.length}</span>
      </div>
      <div class="listening-container">
        <div class="listening-prompt">
          <div class="listening-label">Nghe và chọn nghĩa đúng:</div>
          <button class="listening-play-btn" id="btnPlay">
            <span class="play-icon">🔊</span>
            <span>Phát âm</span>
          </button>
          <button class="listening-replay-btn" id="btnReplay">Phát lại</button>
        </div>
        <div class="quiz-options">
          ${options.map((opt, i) => `
            <button class="quiz-option" data-answer="${opt}" data-index="${i}">
              <span class="quiz-option-key">${i + 1}</span>
              <span class="quiz-option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
        <div class="listening-reveal" id="listeningReveal"></div>
      </div>
    `;

    // Auto-play on load
    setTimeout(() => speak(card.front, settings.speechRate), 300);

    container.querySelector('#btnPlay').addEventListener('click', () => {
      speak(card.front, settings.speechRate);
    });
    container.querySelector('#btnReplay').addEventListener('click', () => {
      speak(card.front, settings.speechRate);
    });

    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn, card));
    });

    container._keyHandler = (e) => {
      const keyMap = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
      const idx = keyMap[e.code];
      if (idx !== undefined && !answered) {
        const btn = container.querySelectorAll('.quiz-option')[idx];
        if (btn) handleAnswer(btn, card);
      }
      if (e.code === 'KeyR') {
        speak(card.front, settings.speechRate);
      }
      if (answered && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        next();
      }
    };
    document.addEventListener('keydown', container._keyHandler);
  }

  function handleAnswer(btn, card) {
    if (answered) return;
    answered = true;

    const selected = btn.dataset.answer;
    const isCorrect = selected === card.back;

    if (isCorrect) {
      correctCount++;
      btn.classList.add('correct');
      updateCardStats(card.id, true);
    } else {
      btn.classList.add('wrong');
      wrongCards.push(card);
      updateCardStats(card.id, false);
      container.querySelectorAll('.quiz-option').forEach(b => {
        if (b.dataset.answer === card.back) b.classList.add('correct');
      });
    }

    container.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

    // Reveal the word
    const reveal = container.querySelector('#listeningReveal');
    reveal.innerHTML = `
      <div class="listening-word-reveal">
        <strong>${card.front}</strong>
        ${card.phonetic ? `<span class="quiz-phonetic">${card.phonetic}</span>` : ''}
      </div>
    `;

    setTimeout(() => next(), isCorrect ? 1000 : 2000);
  }

  function next() {
    document.removeEventListener('keydown', container._keyHandler);
    current++;
    render();
  }

  function showResult() {
    document.removeEventListener('keydown', container._keyHandler);
    const total = sessionCards.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    recordStudy('listening', total, correctCount);

    container.innerHTML = `
      <div class="result-screen">
        <div class="result-icon">🎧</div>
        <h2>Kết quả Listening!</h2>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-value">${total}</span>
            <span class="result-stat-label">Tổng câu</span>
          </div>
          <div class="result-stat success">
            <span class="result-stat-value">${correctCount}</span>
            <span class="result-stat-label">Đúng</span>
          </div>
          <div class="result-stat danger">
            <span class="result-stat-value">${total - correctCount}</span>
            <span class="result-stat-label">Sai</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">${pct}%</span>
            <span class="result-stat-label">Tỉ lệ</span>
          </div>
        </div>
        ${wrongCards.length > 0 ? `
          <div class="result-wrong-list">
            <h3>Từ nghe sai:</h3>
            <ul>${wrongCards.map(c => `<li><strong>${c.front}</strong> — ${c.back}</li>`).join('')}</ul>
          </div>
        ` : ''}
        <div class="result-actions">
          <button class="btn btn-primary" id="btnRetry">🔄 Làm lại</button>
          <button class="btn btn-ghost" id="btnBack">← Quay về</button>
        </div>
      </div>
    `;

    container.querySelector('#btnRetry')?.addEventListener('click', () => {
      current = 0; correctCount = 0; wrongCards.length = 0; render();
    });
    container.querySelector('#btnBack')?.addEventListener('click', onFinish);
  }

  render();
  return () => { document.removeEventListener('keydown', container._keyHandler); };
}
