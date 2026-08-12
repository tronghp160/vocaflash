// typing.js — Typing Mode (Gõ từ tiếng Anh)

import { shuffleArray, diffChars } from '../utils/helpers.js';
import { speak } from '../utils/speech.js';
import { updateCardStats, recordStudy, getSettings } from '../data.js';

export function initTyping(container, cards, onFinish) {
  const settings = getSettings();
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

    // Mask the word in the example
    const maskedExample = card.example
      ? card.example.replace(new RegExp(card.front, 'gi'), '______')
      : '';

    container.innerHTML = `
      <div class="study-progress">
        <div class="progress-bar"><div class="progress-fill typing-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${current + 1} / ${sessionCards.length}</span>
      </div>
      <div class="typing-container">
        <div class="typing-prompt">
          <div class="typing-label">Gõ từ tiếng Anh cho nghĩa:</div>
          <div class="typing-meaning">${card.back}</div>
          ${card.wordType ? `<span class="word-type-badge">${card.wordType}</span>` : ''}
          ${maskedExample ? `<div class="typing-example">"${maskedExample}"</div>` : ''}
          ${card.exampleVi ? `<div class="typing-example-vi">${card.exampleVi}</div>` : ''}
        </div>
        <div class="typing-input-area">
          <input type="text" id="typingInput" class="typing-input" placeholder="Gõ từ tiếng Anh..." autocomplete="off" autofocus>
          <button class="btn btn-primary" id="btnCheck">Kiểm tra</button>
        </div>
        <div class="typing-feedback" id="typingFeedback"></div>
        <div class="typing-next ${answered ? 'visible' : ''}" id="typingNext">
          <button class="btn btn-ghost" id="btnNext">Tiếp theo →</button>
        </div>
      </div>
    `;

    const input = container.querySelector('#typingInput');
    const btnCheck = container.querySelector('#btnCheck');

    input.focus();

    btnCheck.addEventListener('click', () => checkAnswer(card));
    input.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        if (!answered) checkAnswer(card);
        else next();
      }
    });

    container.querySelector('#btnNext')?.addEventListener('click', () => next());
  }

  function checkAnswer(card) {
    if (answered) return;
    answered = true;

    const input = container.querySelector('#typingInput');
    const feedback = container.querySelector('#typingFeedback');
    const userAnswer = input.value.trim();
    const correctAnswer = card.front;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      correctCount++;
      updateCardStats(card.id, true);
      feedback.innerHTML = `
        <div class="typing-correct">
          <span class="typing-result-icon">✅</span>
          <span>Chính xác!</span>
          <button class="btn-speak-inline" id="btnSpeakResult">🔊</button>
        </div>
      `;
      input.classList.add('input-correct');
    } else {
      wrongCards.push(card);
      updateCardStats(card.id, false);
      const diff = diffChars(userAnswer, correctAnswer);
      const diffHtml = diff.map(d => {
        if (d.status === 'correct') return `<span class="char-correct">${d.char}</span>`;
        if (d.status === 'wrong') return `<span class="char-wrong">${d.char}</span>`;
        if (d.status === 'missing') return `<span class="char-missing">${d.char}</span>`;
        if (d.status === 'extra') return `<span class="char-extra">${d.char}</span>`;
        return d.char;
      }).join('');

      feedback.innerHTML = `
        <div class="typing-wrong">
          <span class="typing-result-icon">❌</span>
          <div>
            <div>Bạn gõ: <span class="typing-diff">${diffHtml || '<em>(trống)</em>'}</span></div>
            <div>Đáp án: <strong class="typing-answer">${correctAnswer}</strong>
              <button class="btn-speak-inline" id="btnSpeakResult">🔊</button>
            </div>
          </div>
        </div>
      `;
      input.classList.add('input-wrong');
    }

    container.querySelector('#typingNext').classList.add('visible');
    input.disabled = true;
    container.querySelector('#btnCheck').disabled = true;

    container.querySelector('#btnSpeakResult')?.addEventListener('click', () => {
      speak(card.front, settings.speechRate);
    });
  }

  function next() {
    current++;
    render();
  }

  function showResult() {
    const total = sessionCards.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    recordStudy('typing', total, correctCount);

    container.innerHTML = `
      <div class="result-screen">
        <div class="result-icon">⌨️</div>
        <h2>Kết quả Typing!</h2>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-value">${total}</span>
            <span class="result-stat-label">Tổng từ</span>
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
            <h3>Từ gõ sai:</h3>
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
  return () => {};
}
