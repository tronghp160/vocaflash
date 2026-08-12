// matching.js — Matching Mode (Ghép cặp EN-VI)

import { shuffleArray } from '../utils/helpers.js';
import { updateCardStats, recordStudy } from '../data.js';

export function initMatching(container, cards, onFinish) {
  const pairCount = Math.min(6, cards.length);
  const selectedCards = shuffleArray(cards).slice(0, pairCount);
  let tiles = [];
  let selected = null;
  let matchedCount = 0;
  let attempts = 0;
  let startTime = Date.now();

  function buildTiles() {
    const enTiles = selectedCards.map(c => ({ id: c.id, text: c.front, type: 'en', matched: false }));
    const viTiles = selectedCards.map(c => ({ id: c.id, text: c.back, type: 'vi', matched: false }));
    tiles = shuffleArray([...enTiles, ...viTiles]);
  }

  function render() {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    container.innerHTML = `
      <div class="matching-header">
        <div class="matching-info">
          <span>🔗 Ghép: <strong>${matchedCount}</strong> / ${pairCount}</span>
          <span>🎯 Lượt: <strong>${attempts}</strong></span>
          <span>⏱️ <span id="matchTimer">${elapsed}</span>s</span>
        </div>
      </div>
      <div class="matching-grid" id="matchingGrid">
        ${tiles.map((tile, i) => `
          <button class="matching-tile ${tile.matched ? 'matched' : ''} ${tile.type}"
                  data-index="${i}" ${tile.matched ? 'disabled' : ''}>
            <span class="matching-tile-text">${tile.text}</span>
            <span class="matching-tile-type">${tile.type === 'en' ? 'EN' : 'VI'}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Timer update
    if (matchedCount < pairCount) {
      container._timerInterval = setInterval(() => {
        const el = document.getElementById('matchTimer');
        if (el) el.textContent = Math.round((Date.now() - startTime) / 1000);
      }, 1000);
    }

    // Tile click handlers
    container.querySelectorAll('.matching-tile:not(.matched)').forEach(btn => {
      btn.addEventListener('click', () => handleTileClick(parseInt(btn.dataset.index)));
    });
  }

  function handleTileClick(index) {
    const tile = tiles[index];
    if (tile.matched) return;

    const btn = container.querySelectorAll('.matching-tile')[index];

    if (selected === null) {
      // First selection
      selected = index;
      btn.classList.add('selected');
    } else if (selected === index) {
      // Deselect
      btn.classList.remove('selected');
      selected = null;
    } else {
      // Second selection — check match
      const firstTile = tiles[selected];
      const secondTile = tile;
      attempts++;

      if (firstTile.id === secondTile.id && firstTile.type !== secondTile.type) {
        // Match!
        firstTile.matched = true;
        secondTile.matched = true;
        matchedCount++;

        const firstBtn = container.querySelectorAll('.matching-tile')[selected];
        firstBtn.classList.remove('selected');
        firstBtn.classList.add('matched', 'match-pop');
        btn.classList.add('matched', 'match-pop');

        updateCardStats(firstTile.id, true);
        selected = null;

        if (matchedCount >= pairCount) {
          clearInterval(container._timerInterval);
          setTimeout(() => showResult(), 600);
        }
      } else {
        // No match — shake both
        const firstBtn = container.querySelectorAll('.matching-tile')[selected];
        firstBtn.classList.add('shake');
        btn.classList.add('shake', 'selected');

        updateCardStats(firstTile.id, false);

        setTimeout(() => {
          firstBtn.classList.remove('selected', 'shake');
          btn.classList.remove('selected', 'shake');
          selected = null;
        }, 500);
      }
    }
  }

  function showResult() {
    clearInterval(container._timerInterval);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const efficiency = pairCount > 0 ? Math.round((pairCount / attempts) * 100) : 0;
    recordStudy('matching', pairCount, pairCount);

    container.innerHTML = `
      <div class="result-screen">
        <div class="result-icon">🔗</div>
        <h2>Ghép cặp hoàn tất!</h2>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-value">${pairCount}</span>
            <span class="result-stat-label">Số cặp</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">${attempts}</span>
            <span class="result-stat-label">Số lượt</span>
          </div>
          <div class="result-stat success">
            <span class="result-stat-value">${efficiency}%</span>
            <span class="result-stat-label">Hiệu quả</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            <span class="result-stat-label">Thời gian</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="btnRetry">🔄 Chơi lại</button>
          <button class="btn btn-ghost" id="btnBack">← Quay về</button>
        </div>
      </div>
    `;

    container.querySelector('#btnRetry')?.addEventListener('click', () => {
      matchedCount = 0; attempts = 0; selected = null; startTime = Date.now();
      buildTiles();
      render();
    });
    container.querySelector('#btnBack')?.addEventListener('click', onFinish);
  }

  buildTiles();
  render();

  return () => {
    clearInterval(container._timerInterval);
  };
}
