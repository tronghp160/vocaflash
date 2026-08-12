// deckDetail.js — Deck Detail View with card management & dictionary lookup

import { getDeck, getCardsByDeck, saveCard, deleteCard, saveDeck, lookupWord, exportDeck, importDeck } from '../data.js';
import { isDue } from '../srs.js';
import { escapeHtml, WORD_TYPES } from '../utils/helpers.js';
import { speak } from '../utils/speech.js';
import { getSettings } from '../data.js';

export function renderDeckDetail(container, deckId) {
  const deck = getDeck(deckId);
  if (!deck) {
    container.innerHTML = `<div class="empty-state"><p>Không tìm thấy deck.</p><button class="btn btn-ghost" onclick="location.hash='#dashboard'">← Về trang chính</button></div>`;
    return;
  }

  const cards = getCardsByDeck(deckId);
  const dueCount = cards.filter(c => isDue(c)).length;
  const settings = getSettings();
  let searchQuery = '';

  function render() {
    const filteredCards = searchQuery
      ? cards.filter(c => c.front.toLowerCase().includes(searchQuery) || c.back.toLowerCase().includes(searchQuery))
      : getCardsByDeck(deckId);

    container.innerHTML = `
      <div class="deck-detail">
        <div class="deck-detail-header">
          <button class="btn btn-ghost btn-sm" onclick="location.hash='#dashboard'">← Quay về</button>
          <div class="deck-detail-info" style="--deck-color: ${deck.color || '#6C5CE7'}">
            <div class="deck-color-dot"></div>
            <div>
              <h1 class="deck-detail-name">${escapeHtml(deck.name)}</h1>
              <p class="deck-detail-desc">${escapeHtml(deck.description || 'Chưa có mô tả')}</p>
              <span class="deck-detail-meta">${filteredCards.length} thẻ${dueCount > 0 ? ` · ${dueCount} cần ôn` : ''}</span>
            </div>
          </div>
          <div class="deck-detail-actions-top">
            <button class="btn btn-ghost btn-xs" id="btnEditDeck" title="Sửa deck">✏️</button>
            <button class="btn btn-ghost btn-xs" id="btnExportDeck" title="Export deck">📤</button>
            <button class="btn btn-ghost btn-xs" id="btnImportDeck" title="Import thẻ">📥</button>
          </div>
        </div>

        <!-- Study Modes -->
        <div class="modes-grid">
          <button class="mode-btn" data-mode="flashcard">
            <span class="mode-icon">🃏</span>
            <span class="mode-name">Flashcard</span>
          </button>
          <button class="mode-btn ${dueCount > 0 ? 'mode-highlight' : ''}" data-mode="srs">
            <span class="mode-icon">🧠</span>
            <span class="mode-name">SRS</span>
            ${dueCount > 0 ? `<span class="mode-badge">${dueCount}</span>` : ''}
          </button>
          <button class="mode-btn" data-mode="quiz-en">
            <span class="mode-icon">📝</span>
            <span class="mode-name">Quiz EN→VI</span>
          </button>
          <button class="mode-btn" data-mode="quiz-vi">
            <span class="mode-icon">📝</span>
            <span class="mode-name">Quiz VI→EN</span>
          </button>
          <button class="mode-btn" data-mode="typing">
            <span class="mode-icon">⌨️</span>
            <span class="mode-name">Typing</span>
          </button>
          <button class="mode-btn" data-mode="matching">
            <span class="mode-icon">🔗</span>
            <span class="mode-name">Ghép cặp</span>
          </button>
          <button class="mode-btn" data-mode="listening">
            <span class="mode-icon">🎧</span>
            <span class="mode-name">Listening</span>
          </button>
        </div>

        <!-- Card List -->
        <div class="section-header">
          <h2>Danh sách thẻ</h2>
          <div class="card-list-actions">
            <input type="text" class="form-input form-input-sm search-input" id="cardSearch"
                   placeholder="🔍 Tìm từ..." value="${searchQuery}">
            <button class="btn btn-primary btn-sm" id="btnNewCard">+ Thêm thẻ</button>
          </div>
        </div>

        ${filteredCards.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🗂️</div>
            <h3>${searchQuery ? 'Không tìm thấy' : 'Chưa có thẻ nào'}</h3>
            <p>${searchQuery ? 'Thử tìm kiếm khác' : 'Thêm thẻ từ vựng đầu tiên!'}</p>
          </div>
        ` : `
          <div class="card-list">
            ${filteredCards.map(card => `
              <div class="card-item" data-card-id="${card.id}">
                <div class="card-item-main">
                  <div class="card-item-front">
                    <strong>${escapeHtml(card.front)}</strong>
                    ${card.phonetic ? `<span class="card-item-phonetic">${escapeHtml(card.phonetic)}</span>` : ''}
                    ${card.wordType ? `<span class="word-type-badge-sm">${card.wordType}</span>` : ''}
                  </div>
                  <div class="card-item-back">${escapeHtml(card.back)}</div>
                </div>
                <div class="card-item-actions">
                  <button class="btn-icon btn-card-speak" data-word="${escapeHtml(card.front)}" title="Phát âm">🔊</button>
                  <button class="btn-icon btn-card-edit" data-id="${card.id}" title="Sửa">✏️</button>
                  <button class="btn-icon btn-card-delete" data-id="${card.id}" title="Xóa">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Card Form Modal -->
      <div class="modal-overlay" id="cardModal" style="display:none">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 id="cardModalTitle">Thêm thẻ mới</h3>
            <button class="btn-close" id="btnCloseCardModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group form-group-grow">
                <label>Từ tiếng Anh <span class="required">*</span></label>
                <div class="input-with-btn">
                  <input type="text" id="cardFront" class="form-input" placeholder="VD: ubiquitous">
                  <button class="btn btn-primary btn-sm" id="btnLookup" title="Tự đề xuất tất cả thông tin">⚡ Đề xuất tự động</button>
                </div>
              </div>
            </div>
            <div class="lookup-results" id="lookupResults" style="display:none"></div>
            <div class="form-row">
              <div class="form-group form-group-grow">
                <label>Nghĩa tiếng Việt <span class="required">*</span></label>
                <input type="text" id="cardBack" class="form-input" placeholder="VD: có mặt ở khắp nơi">
              </div>
              <div class="form-group" style="width:180px">
                <label>Loại từ</label>
                <select id="cardWordType" class="form-input">
                  <option value="">— Chọn —</option>
                  ${WORD_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Phiên âm</label>
              <div class="input-with-btn">
                <input type="text" id="cardPhonetic" class="form-input" placeholder="VD: /juːˈbɪk.wɪ.təs/">
                <button class="btn btn-ghost btn-sm" id="btnPreviewSpeak" title="Nghe phát âm">🔊</button>
              </div>
            </div>
            <div class="form-group">
              <label>Ví dụ tiếng Anh</label>
              <input type="text" id="cardExample" class="form-input" placeholder="VD: Smartphones have become ubiquitous in modern society.">
            </div>
            <div class="form-group">
              <label>Ví dụ tiếng Việt</label>
              <input type="text" id="cardExampleVi" class="form-input" placeholder="VD: Điện thoại thông minh đã trở nên phổ biến khắp nơi...">
            </div>
            <div class="form-group">
              <label>Hình ảnh <span class="optional">(Chọn từ đề xuất hoặc dán URL)</span></label>
              <div class="input-with-btn">
                <input type="text" id="cardImageUrl" class="form-input" placeholder="Dán URL hình ảnh hoặc chọn bên dưới...">
                <button class="btn btn-ghost btn-sm" id="btnSearchImage" title="Tìm thêm ảnh trên Google">🖼️ Google</button>
              </div>
              <div class="image-gallery" id="imageGallery" style="display:none"></div>
              <div class="image-preview" id="imagePreview"></div>
            </div>
            <div class="form-group">
              <label>Ghi chú <span class="optional">(tùy chọn)</span></label>
              <input type="text" id="cardNote" class="form-input" placeholder="Ghi chú thêm...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btnCancelCard">Hủy</button>
            <button class="btn btn-primary" id="btnSaveCard">Lưu thẻ</button>
          </div>
        </div>
      </div>

      <!-- Edit Deck Modal -->
      <div class="modal-overlay" id="editDeckModal" style="display:none">
        <div class="modal">
          <div class="modal-header">
            <h3>Sửa Deck</h3>
            <button class="btn-close" id="btnCloseEditDeck">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Tên deck</label>
              <input type="text" id="editDeckName" class="form-input" value="${escapeHtml(deck.name)}">
            </div>
            <div class="form-group">
              <label>Mô tả</label>
              <input type="text" id="editDeckDesc" class="form-input" value="${escapeHtml(deck.description || '')}">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btnCancelEditDeck">Hủy</button>
            <button class="btn btn-primary" id="btnSaveEditDeck">Lưu</button>
          </div>
        </div>
      </div>

      <input type="file" id="importFileInput" accept=".json" style="display:none">
    `;

    bindEvents();
  }

  function bindEvents() {
    // Mode buttons
    container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        location.hash = `#study/${deckId}/${btn.dataset.mode}`;
      });
    });

    // Search
    container.querySelector('#cardSearch')?.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      render();
      // Re-focus search input and restore cursor position
      const searchInput = container.querySelector('#cardSearch');
      if (searchInput) {
        searchInput.focus();
        searchInput.selectionStart = searchInput.selectionEnd = searchQuery.length;
      }
    });

    // Speak buttons
    container.querySelectorAll('.btn-card-speak').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(btn.dataset.word, settings.speechRate);
      });
    });

    // Delete card
    container.querySelectorAll('.btn-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Xóa thẻ này?')) {
          deleteCard(btn.dataset.id);
          render();
        }
      });
    });

    // Edit card
    container.querySelectorAll('.btn-card-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCardModal(btn.dataset.id);
      });
    });

    // New card
    container.querySelector('#btnNewCard')?.addEventListener('click', () => openCardModal(null));

    // Card modal
    const cardModal = container.querySelector('#cardModal');
    const closeCardModal = () => { cardModal.style.display = 'none'; };
    container.querySelector('#btnCloseCardModal')?.addEventListener('click', closeCardModal);
    container.querySelector('#btnCancelCard')?.addEventListener('click', closeCardModal);
    cardModal?.addEventListener('click', (e) => { if (e.target === cardModal) closeCardModal(); });

    // Lookup
    container.querySelector('#btnLookup')?.addEventListener('click', handleLookup);

    // Preview speak
    container.querySelector('#btnPreviewSpeak')?.addEventListener('click', () => {
      const word = container.querySelector('#cardFront').value.trim();
      if (word) speak(word, settings.speechRate);
    });

    // Search image
    container.querySelector('#btnSearchImage')?.addEventListener('click', () => {
      const word = container.querySelector('#cardFront').value.trim();
      if (word) window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(word + ' vocabulary')}`, '_blank');
    });

    // Image preview
    container.querySelector('#cardImageUrl')?.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const preview = container.querySelector('#imagePreview');
      if (url) {
        preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'text-muted\\'>Không tải được ảnh</span>'">`;
      } else {
        preview.innerHTML = '';
      }
    });

    // Save card
    container.querySelector('#btnSaveCard')?.addEventListener('click', handleSaveCard);

    // Edit deck
    container.querySelector('#btnEditDeck')?.addEventListener('click', () => {
      container.querySelector('#editDeckModal').style.display = 'flex';
    });
    container.querySelector('#btnCloseEditDeck')?.addEventListener('click', () => {
      container.querySelector('#editDeckModal').style.display = 'none';
    });
    container.querySelector('#btnCancelEditDeck')?.addEventListener('click', () => {
      container.querySelector('#editDeckModal').style.display = 'none';
    });
    container.querySelector('#btnSaveEditDeck')?.addEventListener('click', () => {
      const name = container.querySelector('#editDeckName').value.trim();
      if (!name) return;
      saveDeck({ ...deck, name, description: container.querySelector('#editDeckDesc').value.trim() });
      location.hash = `#deck/${deckId}`;
      render();
    });

    // Export deck
    container.querySelector('#btnExportDeck')?.addEventListener('click', () => {
      const json = exportDeck(deckId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}_vocaflash.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import cards
    container.querySelector('#btnImportDeck')?.addEventListener('click', () => {
      container.querySelector('#importFileInput').click();
    });
    container.querySelector('#importFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = importDeck(ev.target.result);
        alert(result.message);
        if (result.success) render();
      };
      reader.readAsText(file);
    });
  }

  let editingCardId = null;

  function openCardModal(cardId) {
    editingCardId = cardId;
    const modal = container.querySelector('#cardModal');
    const title = container.querySelector('#cardModalTitle');

    if (cardId) {
      const card = getCardsByDeck(deckId).find(c => c.id === cardId);
      if (!card) return;
      title.textContent = 'Sửa thẻ';
      container.querySelector('#cardFront').value = card.front || '';
      container.querySelector('#cardBack').value = card.back || '';
      container.querySelector('#cardPhonetic').value = card.phonetic || '';
      container.querySelector('#cardWordType').value = card.wordType || '';
      container.querySelector('#cardExample').value = card.example || '';
      container.querySelector('#cardExampleVi').value = card.exampleVi || '';
      container.querySelector('#cardImageUrl').value = card.imageUrl || '';
      container.querySelector('#cardNote').value = card.note || '';
      // Show image preview
      if (card.imageUrl) {
        container.querySelector('#imagePreview').innerHTML = `<img src="${card.imageUrl}" alt="Preview">`;
      }
    } else {
      title.textContent = 'Thêm thẻ mới';
      container.querySelector('#cardFront').value = '';
      container.querySelector('#cardBack').value = '';
      container.querySelector('#cardPhonetic').value = '';
      container.querySelector('#cardWordType').value = '';
      container.querySelector('#cardExample').value = '';
      container.querySelector('#cardExampleVi').value = '';
      container.querySelector('#cardImageUrl').value = '';
      container.querySelector('#cardNote').value = '';
      container.querySelector('#imagePreview').innerHTML = '';
    }

    container.querySelector('#lookupResults').style.display = 'none';
    modal.style.display = 'flex';
    container.querySelector('#cardFront').focus();
  }

  async function handleLookup() {
    const word = container.querySelector('#cardFront').value.trim();
    if (!word) return;

    const btn = container.querySelector('#btnLookup');
    const resultsDiv = container.querySelector('#lookupResults');
    const galleryDiv = container.querySelector('#imageGallery');

    btn.disabled = true;
    btn.textContent = '⏳ Đang phân tích...';

    const result = await lookupWord(word);

    btn.disabled = false;
    btn.innerHTML = '⚡ Đề xuất tự động';

    if (!result.success) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `<div class="lookup-error">❌ ${result.message}</div>`;
      return;
    }

    // Auto-fill fields if currently empty
    if (result.viTranslation) {
      container.querySelector('#cardBack').value = result.viTranslation;
    }
    if (result.wordType) {
      container.querySelector('#cardWordType').value = result.wordType;
    }
    if (result.phonetic) {
      container.querySelector('#cardPhonetic').value = result.phonetic;
    }
    if (result.exampleEn) {
      container.querySelector('#cardExample').value = result.exampleEn;
    }
    if (result.exampleVi) {
      container.querySelector('#cardExampleVi').value = result.exampleVi;
    }

    // Render Image Gallery suggestions
    if (result.images && result.images.length > 0) {
      galleryDiv.style.display = 'flex';
      galleryDiv.innerHTML = `
        <div class="gallery-title">🖼️ Chọn hình ảnh đề xuất:</div>
        <div class="gallery-list">
          ${result.images.map(img => `
            <img src="${img.url}" class="gallery-thumb" title="${escapeHtml(img.title)}" alt="Suggestion">
          `).join('')}
        </div>
      `;

      galleryDiv.querySelectorAll('.gallery-thumb').forEach(imgEl => {
        imgEl.addEventListener('click', () => {
          galleryDiv.querySelectorAll('.gallery-thumb').forEach(i => i.classList.remove('selected'));
          imgEl.classList.add('selected');
          const url = imgEl.src;
          container.querySelector('#cardImageUrl').value = url;
          container.querySelector('#imagePreview').innerHTML = `<img src="${url}" alt="Selected Image">`;
        });
      });
    } else {
      galleryDiv.style.display = 'none';
    }

    // Render detailed meanings list for alternative picks
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div class="lookup-header">
        <span>📖 Đã tự điền từ vựng: <strong>${result.word}</strong></span>
        ${result.phonetic ? `<span class="lookup-phonetic">${result.phonetic}</span>` : ''}
      </div>
      ${result.meanings && result.meanings.length > 0 ? `
        <div class="lookup-list-title">Định nghĩa tiếng Anh (Nhấn để chọn):</div>
        <div class="lookup-list">
          ${result.meanings.slice(0, 6).map((m, i) => `
            <button class="lookup-item" data-index="${i}">
              <span class="lookup-type">${m.wordType}</span>
              <span class="lookup-def">${escapeHtml(m.definition)}</span>
              ${m.example ? `<span class="lookup-example">"${escapeHtml(m.example)}"</span>` : ''}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    // Click on alternative English meaning to update example/type
    resultsDiv.querySelectorAll('.lookup-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        const meaning = result.meanings[idx];
        if (meaning.mappedType) container.querySelector('#cardWordType').value = meaning.mappedType;
        if (meaning.example) container.querySelector('#cardExample').value = meaning.example;
      });
    });
  }

  function handleSaveCard() {
    const front = container.querySelector('#cardFront').value.trim();
    const back = container.querySelector('#cardBack').value.trim();
    if (!front || !back) {
      if (!front) container.querySelector('#cardFront').classList.add('input-error');
      if (!back) container.querySelector('#cardBack').classList.add('input-error');
      return;
    }

    const cardData = {
      deckId,
      front,
      back,
      phonetic: container.querySelector('#cardPhonetic').value.trim(),
      wordType: container.querySelector('#cardWordType').value,
      example: container.querySelector('#cardExample').value.trim(),
      exampleVi: container.querySelector('#cardExampleVi').value.trim(),
      imageUrl: container.querySelector('#cardImageUrl').value.trim(),
      note: container.querySelector('#cardNote').value.trim(),
    };

    if (editingCardId) {
      cardData.id = editingCardId;
    }

    saveCard(cardData);
    container.querySelector('#cardModal').style.display = 'none';
    editingCardId = null;
    render();
  }

  render();
}
