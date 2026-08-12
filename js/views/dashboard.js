// dashboard.js — Main Dashboard View

import { getDecks, getCards, getStreak, getHistory, saveDeck, deleteDeck } from '../data.js';
import { isDue } from '../srs.js';
import { DECK_COLORS, todayStr, escapeHtml } from '../utils/helpers.js';

export function renderDashboard(container) {
  const decks = getDecks();
  const allCards = getCards();
  const dueCards = allCards.filter(c => isDue(c));
  const streak = getStreak();
  const history = getHistory();
  const today = todayStr();
  const todayData = history[today] || { reviewed: 0, correct: 0 };
  const totalReviewed = allCards.reduce((sum, c) => sum + (c.stats?.totalReviews || 0), 0);
  const totalCorrect = allCards.reduce((sum, c) => sum + (c.stats?.correctCount || 0), 0);
  const avgRetention = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;

  container.innerHTML = `
    <div class="dashboard">
      <header class="app-header">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">VocaFlash</span>
        </div>
        <nav class="header-nav">
          <button class="btn btn-ghost btn-sm" onclick="location.hash='#stats'">📊 Thống kê</button>
          <button class="btn btn-ghost btn-sm" onclick="location.hash='#settings'">⚙️ Cài đặt</button>
        </nav>
      </header>

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${allCards.length}</div>
          <div class="stat-label">Tổng thẻ</div>
        </div>
        <div class="stat-card ${dueCards.length > 0 ? 'stat-highlight' : ''}">
          <div class="stat-value">${dueCards.length}</div>
          <div class="stat-label">Cần ôn hôm nay</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${streak}🔥</div>
          <div class="stat-label">Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgRetention}%</div>
          <div class="stat-label">Tỉ lệ nhớ</div>
        </div>
      </div>

      <!-- Quick SRS Action -->
      ${dueCards.length > 0 ? `
        <div class="quick-action">
          <button class="btn btn-primary btn-lg pulse" id="btnQuickSRS">
            🧠 Ôn tập ngay — ${dueCards.length} thẻ đến hạn
          </button>
        </div>
      ` : ''}

      <!-- Today's Activity -->
      ${todayData.reviewed > 0 ? `
        <div class="today-activity">
          <span>📅 Hôm nay: đã ôn <strong>${todayData.reviewed}</strong> thẻ, đúng <strong>${todayData.correct}</strong></span>
        </div>
      ` : ''}

      <!-- Deck List -->
      <div class="section-header">
        <h2>Bộ thẻ của bạn</h2>
        <button class="btn btn-primary btn-sm" id="btnNewDeck">+ Thêm Deck</button>
      </div>

      ${decks.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>Chưa có bộ thẻ nào</h3>
          <p>Tạo bộ thẻ đầu tiên để bắt đầu học từ vựng!</p>
        </div>
      ` : `
        <div class="deck-grid">
          ${decks.map(deck => {
            const deckCards = allCards.filter(c => c.deckId === deck.id);
            const deckDue = deckCards.filter(c => isDue(c)).length;
            return `
              <div class="deck-card" data-deck-id="${deck.id}" style="--deck-color: ${deck.color || '#6C5CE7'}">
                <div class="deck-color-bar"></div>
                <div class="deck-card-body">
                  <h3 class="deck-name">${escapeHtml(deck.name)}</h3>
                  <p class="deck-desc">${escapeHtml(deck.description || '')}</p>
                  <div class="deck-meta">
                    <span>${deckCards.length} thẻ</span>
                    ${deckDue > 0 ? `<span class="deck-due-badge">${deckDue} cần ôn</span>` : ''}
                  </div>
                </div>
                <div class="deck-card-actions">
                  <button class="btn btn-ghost btn-xs btn-deck-delete" data-id="${deck.id}" title="Xóa">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>

    <!-- New Deck Modal -->
    <div class="modal-overlay" id="newDeckModal" style="display:none">
      <div class="modal">
        <div class="modal-header">
          <h3>Tạo Deck mới</h3>
          <button class="btn-close" id="btnCloseModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tên deck</label>
            <input type="text" id="deckName" class="form-input" placeholder="VD: IELTS Vocabulary" autofocus>
          </div>
          <div class="form-group">
            <label>Mô tả <span class="optional">(tùy chọn)</span></label>
            <input type="text" id="deckDesc" class="form-input" placeholder="VD: Từ vựng IELTS band 7+">
          </div>
          <div class="form-group">
            <label>Màu sắc</label>
            <div class="color-picker" id="colorPicker">
              ${DECK_COLORS.map((c, i) => `
                <button class="color-swatch ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background:${c}"></button>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="btnCancelDeck">Hủy</button>
          <button class="btn btn-primary" id="btnSaveDeck">Tạo Deck</button>
        </div>
      </div>
    </div>
  `;

  // Event: Click deck card
  container.querySelectorAll('.deck-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-deck-delete')) return;
      location.hash = `#deck/${card.dataset.deckId}`;
    });
  });

  // Event: Quick SRS
  container.querySelector('#btnQuickSRS')?.addEventListener('click', () => {
    // Find first deck with due cards
    const firstDueDeck = decks.find(d => allCards.some(c => c.deckId === d.id && isDue(c)));
    if (firstDueDeck) {
      location.hash = `#study/${firstDueDeck.id}/srs`;
    }
  });

  // Event: Delete deck
  container.querySelectorAll('.btn-deck-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const deck = decks.find(d => d.id === id);
      if (confirm(`Xóa deck "${deck?.name}"? Tất cả thẻ trong deck sẽ bị xóa.`)) {
        deleteDeck(id);
        renderDashboard(container);
      }
    });
  });

  // Event: New Deck Modal
  const modal = container.querySelector('#newDeckModal');
  let selectedColor = DECK_COLORS[0];

  container.querySelector('#btnNewDeck').addEventListener('click', () => {
    modal.style.display = 'flex';
    container.querySelector('#deckName').focus();
  });

  const closeModal = () => { modal.style.display = 'none'; };
  container.querySelector('#btnCloseModal').addEventListener('click', closeModal);
  container.querySelector('#btnCancelDeck').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  container.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      selectedColor = swatch.dataset.color;
    });
  });

  container.querySelector('#btnSaveDeck').addEventListener('click', () => {
    const name = container.querySelector('#deckName').value.trim();
    if (!name) { container.querySelector('#deckName').classList.add('input-error'); return; }
    saveDeck({ name, description: container.querySelector('#deckDesc').value.trim(), color: selectedColor });
    closeModal();
    renderDashboard(container);
  });

  container.querySelector('#deckName').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') container.querySelector('#btnSaveDeck').click();
  });
}
