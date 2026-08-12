// chart.js — Simple canvas chart utilities

/**
 * Draw a bar chart on a canvas element
 * @param {HTMLCanvasElement} canvas
 * @param {Object} options - { labels, data, barColor, labelColor, gridColor, title }
 */
export function drawBarChart(canvas, options) {
  const {
    labels = [],
    data = [],
    barColor = '#6C5CE7',
    labelColor = '#8888A0',
    gridColor = 'rgba(136, 136, 160, 0.15)',
    title = '',
    accentColor = '#00D2D3',
  } = options;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const padding = { top: title ? 40 : 20, right: 20, bottom: 40, left: 45 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  ctx.clearRect(0, 0, W, H);

  // Title
  if (title) {
    ctx.fillStyle = '#E8E8F0';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 24);
  }

  const maxVal = Math.max(...data, 1);
  const step = niceStep(maxVal);
  const gridMax = Math.ceil(maxVal / step) * step;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = labelColor;
  ctx.textAlign = 'right';

  for (let v = 0; v <= gridMax; v += step) {
    const y = padding.top + chartH - (v / gridMax) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(W - padding.right, y);
    ctx.stroke();
    ctx.fillText(v.toString(), padding.left - 8, y + 4);
  }

  // Bars
  const barCount = labels.length;
  if (barCount === 0) return;
  const barGap = 6;
  const barWidth = Math.min(40, (chartW - barGap * (barCount + 1)) / barCount);
  const totalBarsWidth = barCount * barWidth + (barCount - 1) * barGap;
  const startX = padding.left + (chartW - totalBarsWidth) / 2;

  // Draw bars with rounded tops
  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barWidth + barGap);
    const barH = (data[i] / gridMax) * chartH;
    const y = padding.top + chartH - barH;
    const radius = Math.min(4, barWidth / 2);

    // Gradient bar
    const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
    grad.addColorStop(0, barColor);
    grad.addColorStop(1, accentColor);
    ctx.fillStyle = grad;

    if (barH > radius * 2) {
      ctx.beginPath();
      ctx.moveTo(x, padding.top + chartH);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.closePath();
      ctx.fill();
    } else if (barH > 0) {
      ctx.fillRect(x, y, barWidth, barH);
    }

    // Label
    ctx.fillStyle = labelColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barWidth / 2, H - padding.bottom + 18);

    // Value on top
    if (data[i] > 0) {
      ctx.fillStyle = '#E8E8F0';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText(data[i].toString(), x + barWidth / 2, y - 6);
    }
  }
}

/**
 * Draw a donut/ring chart
 */
export function drawDonutChart(canvas, options) {
  const {
    value = 0,
    max = 100,
    color = '#6C5CE7',
    bgColor = 'rgba(136, 136, 160, 0.15)',
    label = '',
    sublabel = '',
  } = options;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const cx = W / 2;
  const cy = H / 2 - 8;
  const radius = Math.min(W, H) / 2 - 16;
  const lineWidth = 10;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  ctx.clearRect(0, 0, W, H);

  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = bgColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Value ring
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Center text
  ctx.fillStyle = '#E8E8F0';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);

  if (sublabel) {
    ctx.fillStyle = '#8888A0';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(sublabel, cx, cy + 18);
  }
}

function niceStep(maxVal) {
  if (maxVal <= 5) return 1;
  if (maxVal <= 10) return 2;
  if (maxVal <= 25) return 5;
  if (maxVal <= 50) return 10;
  if (maxVal <= 100) return 20;
  if (maxVal <= 250) return 50;
  return Math.pow(10, Math.floor(Math.log10(maxVal)));
}
