// stats.js — Statistics View

import { getCards, getHistory, getStreak, getLongestStreak } from '../data.js';
import { drawBarChart, drawDonutChart } from '../utils/chart.js';

export function renderStats(container) {
  const cards = getCards();
  const history = getHistory();
  const streak = getStreak();
  const longestStreak = getLongestStreak();
  const totalReviewed = cards.reduce((s, c) => s + (c.stats?.totalReviews || 0), 0);
  const totalCorrect = cards.reduce((s, c) => s + (c.stats?.correctCount || 0), 0);
  const retention = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;

  // Get last 14 days data
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    last14.push({
      label: dayLabel,
      reviewed: history[key]?.reviewed || 0,
      correct: history[key]?.correct || 0,
    });
  }

  // Top difficult words (most incorrect)
  const difficultWords = [...cards]
    .filter(c => c.stats?.incorrectCount > 0)
    .sort((a, b) => b.stats.incorrectCount - a.stats.incorrectCount)
    .slice(0, 10);

  container.innerHTML = `
    <div class="stats-view">
      <div class="stats-header">
        <button class="btn btn-ghost btn-sm" onclick="location.hash='#dashboard'">← Quay về</button>
        <h1>📊 Thống kê</h1>
      </div>

      <div class="stats-overview-grid">
        <div class="stat-card-lg">
          <canvas id="retentionChart" width="120" height="120"></canvas>
        </div>
        <div class="stat-card-lg">
          <div class="stat-big-value">${streak}<span class="stat-emoji">🔥</span></div>
          <div class="stat-big-label">Streak hiện tại</div>
          <div class="stat-sub">Dài nhất: ${longestStreak} ngày</div>
        </div>
        <div class="stat-card-lg">
          <div class="stat-big-value">${totalReviewed}</div>
          <div class="stat-big-label">Tổng lượt ôn</div>
          <div class="stat-sub">Đúng: ${totalCorrect} · Sai: ${totalReviewed - totalCorrect}</div>
        </div>
        <div class="stat-card-lg">
          <div class="stat-big-value">${cards.length}</div>
          <div class="stat-big-label">Tổng thẻ</div>
          <div class="stat-sub">Trong tất cả deck</div>
        </div>
      </div>

      <div class="stats-chart-section">
        <h2>Hoạt động 14 ngày qua</h2>
        <div class="chart-container">
          <canvas id="activityChart"></canvas>
        </div>
      </div>

      ${difficultWords.length > 0 ? `
        <div class="stats-chart-section">
          <h2>🔴 Top từ khó nhất</h2>
          <div class="difficult-words-list">
            ${difficultWords.map((c, i) => `
              <div class="difficult-word-item">
                <span class="difficult-rank">${i + 1}</span>
                <span class="difficult-word">${c.front}</span>
                <span class="difficult-meaning">${c.back}</span>
                <span class="difficult-stats">
                  <span class="text-danger">✗ ${c.stats.incorrectCount}</span> /
                  <span class="text-success">✓ ${c.stats.correctCount}</span>
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${Object.keys(history).length > 0 ? `
        <div class="stats-chart-section">
          <h2>Lịch sử theo chế độ</h2>
          <div class="mode-history">
            ${getModeBreakdown(history)}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Draw charts after DOM is ready
  requestAnimationFrame(() => {
    const retentionCanvas = document.getElementById('retentionChart');
    if (retentionCanvas) {
      drawDonutChart(retentionCanvas, {
        value: retention,
        max: 100,
        color: retention >= 80 ? '#00B894' : retention >= 50 ? '#FDCB6E' : '#FF6B6B',
        label: `${retention}%`,
        sublabel: 'Tỉ lệ nhớ',
      });
    }

    const activityCanvas = document.getElementById('activityChart');
    if (activityCanvas) {
      drawBarChart(activityCanvas, {
        labels: last14.map(d => d.label),
        data: last14.map(d => d.reviewed),
        title: 'Số thẻ đã ôn mỗi ngày',
      });
    }
  });
}

function getModeBreakdown(history) {
  const modes = {};
  Object.values(history).forEach(day => {
    if (day.modes) {
      Object.entries(day.modes).forEach(([mode, count]) => {
        modes[mode] = (modes[mode] || 0) + count;
      });
    }
  });

  const modeNames = {
    flashcard: '🃏 Flashcard',
    srs: '🧠 SRS',
    quiz: '📝 Quiz',
    typing: '⌨️ Typing',
    matching: '🔗 Ghép cặp',
    listening: '🎧 Listening',
  };

  const total = Object.values(modes).reduce((s, v) => s + v, 0) || 1;

  return Object.entries(modes)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="mode-stat-item">
          <span class="mode-stat-name">${modeNames[mode] || mode}</span>
          <div class="mode-stat-bar-bg">
            <div class="mode-stat-bar" style="width:${pct}%"></div>
          </div>
          <span class="mode-stat-count">${count}</span>
        </div>
      `;
    }).join('');
}
