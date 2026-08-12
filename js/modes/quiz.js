// quiz.js — Quiz Mode (Trắc nghiệm EN↔VI)

import { shuffleArray, pickRandom } from '../utils/helpers.js';
import { speak } from '../utils/speech.js';
import { updateCardStats, recordStudy, getSettings } from '../data.js';

export function initQuiz(container, cards, onFinish, direction = 'en-vi') {
  const settings = getSettings();
  const allCards = [...cards];
  const sessionCards = shuffleArray(cards).slice(0, settings.cardsPerSession);
  let current = 0;
  let correctCount = 0;
  let answered = false;
  const wrongCards = [];
  const startTime = Date.now();

  function render() {
    if (current >= sessionCards.length) {
      showResult();
      return;
    }
    answered = false;
    const card = sessionCards[current];
    const progress = (current / sessionCards.length) * 100;

    // Generate 3 wrong answers from other cards
    const wrongAnswers = pickRandom(
      allCards.map(c => direction === 'en-vi' ? c.back : c.front),
      3,
      [direction === 'en-vi' ? card.back : card.front]
    );
    const correctAnswer = direction === 'en-vi' ? card.back : card.front;
    const options = shuffleArray([correctAnswer, ...wrongAnswers]);

    const question = direction === 'en-vi' ? card.front : card.back;
    const questionLabel = direction === 'en-vi' ? 'Nghĩa tiếng Việt của từ:' : 'Từ tiếng Anh của:';

    container.innerHTML = `
      <div class="study-progress">
        <div class="progress-bar"><div class="progress-fill quiz-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${current + 1} / ${sessionCards.length}</span>
      </div>
      <div class="quiz-container">
        <div class="quiz-question-label">${questionLabel}</div>
        <div class="quiz-question">
          ${direction === 'en-vi' ? `<button class="btn-speak-inline" id="btnSpeak">🔊</button>` : ''}
          <span>${question}</span>
          ${card.phonetic && direction === 'en-vi' ? `<div class="quiz-phonetic">${card.phonetic}</div>` : ''}
        </div>
        <div class="quiz-options">
          ${options.map((opt, i) => `
            <button class="quiz-option" data-answer="${opt}" data-index="${i}">
              <span class="quiz-option-key">${i + 1}</span>
              <span class="quiz-option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#btnSpeak')?.addEventListener('click', () => {
      speak(card.front, settings.speechRate);
    });

    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn, correctAnswer, card));
    });

    container._keyHandler = (e) => {
      const keyMap = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
      const idx = keyMap[e.code];
      if (idx !== undefined && !answered) {
        const btn = container.querySelectorAll('.quiz-option')[idx];
        if (btn) handleAnswer(btn, correctAnswer, card);
      }
      if (answered && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        next();
      }
    };
    document.addEventListener('keydown', container._keyHandler);
  }

  function handleAnswer(btn, correctAnswer, card) {
    if (answered) return;
    answered = true;

    const selected = btn.dataset.answer;
    const isCorrect = selected === correctAnswer;

    if (isCorrect) {
      correctCount++;
      btn.classList.add('correct');
      updateCardStats(card.id, true);
    } else {
      btn.classList.add('wrong');
      wrongCards.push(card);
      updateCardStats(card.id, false);
      // Highlight correct answer
      container.querySelectorAll('.quiz-option').forEach(b => {
        if (b.dataset.answer === correctAnswer) b.classList.add('correct');
      });
    }

    // Disable all buttons
    container.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

    // Auto-advance after delay
    setTimeout(() => next(), isCorrect ? 800 : 1800);
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
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    recordStudy('quiz', total, correctCount);

    container.innerHTML = `
      <div class="result-screen">
        <div class="result-icon">${pct >= 80 ? '🏆' : pct >= 50 ? '📝' : '📖'}</div>
        <h2>Kết quả Quiz!</h2>
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
            <span class="result-stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            <span class="result-stat-label">Thời gian</span>
          </div>
        </div>
        ${wrongCards.length > 0 ? `
          <div class="result-wrong-list">
            <h3>Câu trả lời sai:</h3>
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
