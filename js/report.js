// ============================================
// report.js — Sales Report & Chart Module
// ============================================

let reportPeriod = 'daily'; // 'daily' or 'weekly'
let reportOffset = 0; // 0 = current period, -1 = previous, etc.

/**
 * Initialize report page
 */
async function initReportPage() {
  reportOffset = 0;
  await renderReport();
}

/**
 * Render full report (stats + chart + top products)
 */
async function renderReport() {
  const transactions = await getAllTransactions();
  const { dateRange, groupedData, labels, periodLabel } = getReportData(transactions);

  renderPeriodLabel(periodLabel);
  renderReportStats(transactions, dateRange);
  renderSalesChart(groupedData, labels);
  renderTopProducts(transactions, dateRange);
}

/**
 * Get report data based on current period and offset
 */
function getReportData(transactions) {
  const now = new Date();

  if (reportPeriod === 'daily') {
    return getDailyReportData(transactions, now);
  } else {
    return getWeeklyReportData(transactions, now);
  }
}

/**
 * Get daily report data (7 days)
 */
function getDailyReportData(transactions, now) {
  const days = 7;
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (reportOffset * days));

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  // Reset time
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const dateRange = { start: startDate, end: endDate };

  // Group by day
  const groupedData = [];
  const labels = [];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = 0; i < days; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const dayStr = day.toDateString();

    const dayTx = transactions.filter(tx =>
      new Date(tx.date).toDateString() === dayStr
    );

    const revenue = dayTx.reduce((sum, tx) => {
      if (tx.isDebt) return sum; // debt doesn't count as immediate revenue
      return sum + tx.total;
    }, 0);

    const debtAmount = dayTx.reduce((sum, tx) => {
      if (tx.isDebt) return sum + tx.total;
      return sum;
    }, 0);

    groupedData.push({
      revenue,
      debtAmount,
      totalAll: revenue + debtAmount,
      count: dayTx.length,
      date: day
    });

    labels.push({
      main: dayNames[day.getDay()],
      sub: `${day.getDate()}/${day.getMonth() + 1}`
    });
  }

  const periodLabel = `${formatDateCompact(startDate)} — ${formatDateCompact(endDate)}`;

  return { dateRange, groupedData, labels, periodLabel };
}

/**
 * Get weekly report data (4 weeks)
 */
function getWeeklyReportData(transactions, now) {
  const weeks = 4;
  const currentMonday = getMonday(now);

  const endMonday = new Date(currentMonday);
  endMonday.setDate(endMonday.getDate() + (reportOffset * 7 * weeks));

  const groupedData = [];
  const labels = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(endMonday);
    weekStart.setDate(weekStart.getDate() - (i * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekTx = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= weekStart && txDate <= weekEnd;
    });

    const revenue = weekTx.reduce((sum, tx) => {
      if (tx.isDebt) return sum;
      return sum + tx.total;
    }, 0);

    const debtAmount = weekTx.reduce((sum, tx) => {
      if (tx.isDebt) return sum + tx.total;
      return sum;
    }, 0);

    groupedData.push({
      revenue,
      debtAmount,
      totalAll: revenue + debtAmount,
      count: weekTx.length,
      date: weekStart
    });

    labels.push({
      main: `Mg ${weeks - i}`,
      sub: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
    });
  }

  const firstWeekStart = groupedData[0]?.date || now;
  const lastWeekEnd = new Date(groupedData[groupedData.length - 1]?.date || now);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

  const dateRange = { start: firstWeekStart, end: lastWeekEnd };
  const periodLabel = `${formatDateCompact(firstWeekStart)} — ${formatDateCompact(lastWeekEnd)}`;

  return { dateRange, groupedData, labels, periodLabel };
}

/**
 * Render period label text
 */
function renderPeriodLabel(label) {
  setTextContent('report-period-label', label);
}

/**
 * Render report statistics
 */
function renderReportStats(transactions, dateRange) {
  const periodTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= dateRange.start && d <= dateRange.end;
  });

  const cashTx = periodTx.filter(tx => !tx.isDebt);
  const debtTx = periodTx.filter(tx => tx.isDebt);

  const totalCash = cashTx.reduce((sum, tx) => sum + tx.total, 0);
  const totalDebt = debtTx.reduce((sum, tx) => sum + tx.total, 0);
  const avgTransaction = periodTx.length > 0
    ? Math.round((totalCash + totalDebt) / periodTx.length)
    : 0;

  setTextContent('report-stat-cash', formatRupiah(totalCash));
  setTextContent('report-stat-debt', formatRupiah(totalDebt));
  setTextContent('report-stat-count', periodTx.length + ' transaksi');
  setTextContent('report-stat-avg', formatRupiah(avgTransaction));
}

/**
 * Render sales chart using Canvas API
 */
function renderSalesChart(groupedData, labels) {
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Set canvas size
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = 220;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Chart dimensions
  const paddingLeft = 14;
  const paddingRight = 14;
  const paddingTop = 20;
  const paddingBottom = 48;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value
  const maxVal = Math.max(...groupedData.map(d => d.totalAll), 1);

  // Bar dimensions
  const barCount = groupedData.length;
  const groupWidth = chartWidth / barCount;
  const barWidth = Math.min(groupWidth * 0.55, 42);
  const barGap = (groupWidth - barWidth) / 2;

  // Draw grid lines (subtle)
  const gridLines = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= gridLines; i++) {
    const y = paddingTop + (chartHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
  }

  // Draw bars
  groupedData.forEach((data, i) => {
    const x = paddingLeft + (groupWidth * i) + barGap;

    // Revenue bar (green gradient)
    const revenueH = chartHeight * (data.revenue / maxVal);
    const revenueY = paddingTop + chartHeight - revenueH;

    if (data.revenue > 0) {
      const grad = ctx.createLinearGradient(x, revenueY, x, revenueY + revenueH);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.7)');
      ctx.fillStyle = grad;

      drawRoundedBar(ctx, x, revenueY, barWidth, revenueH, 4);
    }

    // Debt bar (stacked on top, orange)
    if (data.debtAmount > 0) {
      const debtH = chartHeight * (data.debtAmount / maxVal);
      const debtY = revenueY - debtH;

      const gradDebt = ctx.createLinearGradient(x, debtY, x, debtY + debtH);
      gradDebt.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
      gradDebt.addColorStop(1, 'rgba(249, 115, 22, 0.7)');
      ctx.fillStyle = gradDebt;

      drawRoundedBar(ctx, x, debtY, barWidth, debtH, 4);
    }

    // Value label on top (only if there's data)
    if (data.totalAll > 0) {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.font = '600 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const totalH = chartHeight * (data.totalAll / maxVal);
      const labelY = paddingTop + chartHeight - totalH - 6;
      ctx.fillText(formatRupiahCompact(data.totalAll), x + barWidth / 2, labelY);
    }

    // Bottom label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i].main, x + barWidth / 2, height - paddingBottom + 16);

    ctx.fillStyle = 'rgba(100, 116, 139, 0.7)';
    ctx.font = '500 8px Inter, sans-serif';
    ctx.fillText(labels[i].sub, x + barWidth / 2, height - paddingBottom + 28);
  });

  // Draw legend
  const legendY = height - 6;
  const legendX = width / 2 - 60;

  // Cash legend
  ctx.fillStyle = '#10b981';
  ctx.fillRect(legendX, legendY - 8, 10, 10);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
  ctx.font = '500 9px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Tunai', legendX + 14, legendY);

  // Debt legend
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(legendX + 60, legendY - 8, 10, 10);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
  ctx.fillText('Hutang', legendX + 74, legendY);
}

/**
 * Draw a bar with rounded top corners
 */
function drawRoundedBar(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

/**
 * Render top selling products
 */
function renderTopProducts(transactions, dateRange) {
  const container = document.getElementById('report-top-products');
  if (!container) return;

  const periodTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= dateRange.start && d <= dateRange.end;
  });

  // Aggregate products
  const productMap = {};
  periodTx.forEach(tx => {
    tx.items.forEach(item => {
      const key = item.name;
      if (!productMap[key]) {
        productMap[key] = { name: item.name, qty: 0, revenue: 0 };
      }
      productMap[key].qty += item.qty;
      productMap[key].revenue += item.subtotal || (item.price * item.qty);
    });
  });

  const sorted = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="report-empty">Belum ada data penjualan di periode ini</div>
    `;
    return;
  }

  const maxQty = sorted[0].qty;

  container.innerHTML = sorted.map((p, i) => {
    const fillPercent = (p.qty / maxQty) * 100;
    const medals = ['🥇', '🥈', '🥉'];
    const rank = i < 3 ? medals[i] : `#${i + 1}`;

    return `
      <div class="top-product-item">
        <div class="top-product-rank">${rank}</div>
        <div class="top-product-info">
          <div class="top-product-name">${escapeHtml(p.name)}</div>
          <div class="top-product-bar-bg">
            <div class="top-product-bar-fill" style="width:${fillPercent}%"></div>
          </div>
        </div>
        <div class="top-product-stats">
          <div class="top-product-qty">${p.qty}x</div>
          <div class="top-product-revenue">${formatRupiah(p.revenue)}</div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Switch report period (daily/weekly)
 */
function setReportPeriod(period) {
  reportPeriod = period;
  reportOffset = 0;

  // Update chip active states
  document.querySelectorAll('#report-period-chips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.period === period);
  });

  renderReport();
}

/**
 * Navigate report period (prev/next)
 */
function navigateReport(direction) {
  reportOffset += direction;
  // Prevent going to future
  if (reportOffset > 0) {
    reportOffset = 0;
    return;
  }
  renderReport();
}

/**
 * Format date compact (e.g. "12 Jun")
 */
function formatDateCompact(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Format rupiah compact for chart labels
 */
function formatRupiahCompact(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}jt`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}rb`;
  }
  return amount.toString();
}

/**
 * Get Monday of current week
 */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
