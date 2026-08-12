// settings.js — Settings View

import { getSettings, saveSettings, exportAllData, importAllData, clearAllData } from '../data.js';

export function renderSettings(container) {
  const settings = getSettings();

  container.innerHTML = `
    <div class="settings-view">
      <div class="settings-header">
        <button class="btn btn-ghost btn-sm" onclick="location.hash='#dashboard'">← Quay về</button>
        <h1>⚙️ Cài đặt</h1>
      </div>

      <div class="settings-section">
        <h2>Học tập</h2>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>Số thẻ mỗi phiên học</label>
            <span class="settings-desc">Giới hạn số thẻ trong mỗi phiên Flashcard, Quiz, Typing, Listening</span>
          </div>
          <div class="settings-item-control">
            <input type="number" id="cardsPerSession" class="form-input form-input-sm" style="width:80px"
                   value="${settings.cardsPerSession}" min="5" max="100" step="5">
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>Tốc độ phát âm</label>
            <span class="settings-desc">Điều chỉnh tốc độ đọc từ tiếng Anh (0.5 = chậm, 1.5 = nhanh)</span>
          </div>
          <div class="settings-item-control">
            <input type="range" id="speechRate" class="form-range" min="0.5" max="1.5" step="0.1" value="${settings.speechRate}">
            <span id="speechRateValue" class="range-value">${settings.speechRate}x</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>Tự động phát âm</label>
            <span class="settings-desc">Tự động phát âm khi lật thẻ trong chế độ Flashcard</span>
          </div>
          <div class="settings-item-control">
            <label class="toggle">
              <input type="checkbox" id="autoPlayAudio" ${settings.autoPlayAudio ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>⚡ Đồng bộ Siêu Tốc (Laptop ↔ Điện thoại)</h2>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>1. Lấy Mã Đồng Bộ từ máy này</label>
            <span class="settings-desc">Bấm để copy mã dữ liệu từ thiết bị này (Laptop) mang sang Điện thoại</span>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-primary btn-sm" id="btnCopyQuickCode">📋 Copy Mã Đồng Bộ</button>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>2. Nhập Mã Đồng Bộ vào thiết bị này</label>
            <span class="settings-desc">Dán Mã Đồng Bộ (bắt đầu bằng VOCA1_...) vào đây để tải dữ liệu về</span>
          </div>
          <div class="settings-item-control" style="flex:1; max-width:320px">
            <div class="input-with-btn">
              <input type="text" id="syncKeyInput" class="form-input form-input-sm" placeholder="Dán mã VOCA1_... vào đây">
              <button class="btn btn-success btn-sm" id="btnImportQuickCode">📥 Đồng bộ ngay</button>
            </div>
          </div>
        </div>
        <div class="settings-item" id="syncActionsRow">
          <div class="settings-item-info">
            <label>Trạng thái</label>
            <span class="settings-desc" id="syncStatusText">Sẵn sàng đồng bộ</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Dữ liệu local</h2>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>Xuất tất cả dữ liệu</label>
            <span class="settings-desc">Tải file JSON chứa tất cả deck, thẻ, lịch sử học</span>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-secondary btn-sm" id="btnExportAll">📤 Export</button>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>Nhập dữ liệu</label>
            <span class="settings-desc">Import file JSON đã export trước đó (sẽ ghi đè dữ liệu hiện tại)</span>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-secondary btn-sm" id="btnImportAll">📥 Import</button>
            <input type="file" id="importFileAll" accept=".json" style="display:none">
          </div>
        </div>
        <div class="settings-item settings-item-danger">
          <div class="settings-item-info">
            <label>Xóa tất cả dữ liệu</label>
            <span class="settings-desc">⚠️ Xóa vĩnh viễn tất cả deck, thẻ, lịch sử. Không thể hoàn tác!</span>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-danger btn-sm" id="btnClearAll">🗑️ Xóa hết</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Thông tin</h2>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>VocaFlash</label>
            <span class="settings-desc">Web app học từ vựng cá nhân · Phiên bản 1.0</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <label>Phím tắt</label>
            <span class="settings-desc">
              <strong>Flashcard/SRS:</strong> Space = lật, ←/→ = chưa biết/biết, 1-4 = đánh giá SRS<br>
              <strong>Quiz/Listening:</strong> 1-4 = chọn đáp án, R = phát lại<br>
              <strong>Typing:</strong> Enter = kiểm tra / tiếp theo
            </span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Save settings on change
  const saveAll = () => {
    saveSettings({
      cardsPerSession: parseInt(container.querySelector('#cardsPerSession').value) || 20,
      speechRate: parseFloat(container.querySelector('#speechRate').value) || 1,
      autoPlayAudio: container.querySelector('#autoPlayAudio').checked,
    });
  };

  container.querySelector('#cardsPerSession').addEventListener('change', saveAll);
  container.querySelector('#autoPlayAudio').addEventListener('change', saveAll);
  container.querySelector('#speechRate').addEventListener('input', (e) => {
    container.querySelector('#speechRateValue').textContent = `${e.target.value}x`;
    saveAll();
  });

  // Cloud sync setup
  import('../cloud.js').then(cloud => {
    const syncKeyInput = container.querySelector('#syncKeyInput');
    const syncStatusText = container.querySelector('#syncStatusText');

    container.querySelector('#btnCopyQuickCode')?.addEventListener('click', () => {
      const code = cloud.exportQuickSyncCode();
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          syncStatusText.textContent = '✅ Đã sao chép Mã Đồng Bộ vào clipboard! Hãy dán sang Điện thoại.';
          alert('Đã copy Mã Đồng Bộ! Hãy mở Zalo/Ghi chú để gửi mã này sang Điện thoại.');
        }).catch(() => {
          prompt('Mã Đồng Bộ của bạn (hãy bôi đen và copy):', code);
        });
      } else {
        alert('Không có dữ liệu để đồng bộ.');
      }
    });

    container.querySelector('#btnImportQuickCode')?.addEventListener('click', () => {
      const code = syncKeyInput.value.trim();
      if (!code) {
        alert('Vui lòng dán Mã Đồng Bộ (bắt đầu bằng VOCA1_...) vào ô trước khi bấm nút.');
        return;
      }
      const res = cloud.importQuickSyncCode(code);
      alert(res.message);
      if (res.success) {
        syncStatusText.textContent = '✅ Đã đồng bộ dữ liệu mới thành công!';
        renderSettings(container);
      } else {
        syncStatusText.textContent = res.message;
      }
    });
  });

  // Export
  container.querySelector('#btnExportAll').addEventListener('click', () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocaflash_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  container.querySelector('#btnImportAll').addEventListener('click', () => {
    container.querySelector('#importFileAll').click();
  });
  container.querySelector('#importFileAll').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Import sẽ ghi đè dữ liệu hiện tại. Tiếp tục?')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importAllData(ev.target.result);
      alert(result.message);
      if (result.success) renderSettings(container);
    };
    reader.readAsText(file);
  });

  // Clear all
  container.querySelector('#btnClearAll').addEventListener('click', () => {
    if (confirm('⚠️ XÓA TẤT CẢ dữ liệu? Hành động này KHÔNG THỂ hoàn tác!')) {
      if (confirm('Bạn thực sự chắc chắn? Gõ OK để xác nhận.')) {
        clearAllData();
        alert('Đã xóa tất cả dữ liệu.');
        location.hash = '#dashboard';
      }
    }
  });
}
