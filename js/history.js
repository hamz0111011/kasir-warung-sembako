// ============================================
// history.js — Transaction History Module
// ============================================

/**
 * Initialize history page
 */
async function initHistoryPage() {
  await renderHistoryStats();
  await renderTransactionList();
}

/**
 * Render history statistics cards
 */
async function renderHistoryStats() {
  const transactions = await getAllTransactions();
  const today = new Date().toDateString();

  // Today's transactions
  const todayTx = transactions.filter(tx =>
    new Date(tx.date).toDateString() === today
  );

  const todayRevenue = todayTx.reduce((sum, tx) => sum + tx.total, 0);
  const todayCount = todayTx.length;
  const totalItems = todayTx.reduce((sum, tx) => sum + (tx.itemCount || 0), 0);
  const allTimeRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);

  // Update stat cards
  setTextContent('stat-today-revenue', formatRupiah(todayRevenue));
  setTextContent('stat-today-count', todayCount + ' transaksi');
  setTextContent('stat-today-items', totalItems + ' item');
  setTextContent('stat-all-revenue', formatRupiah(allTimeRevenue));
}

/**
 * Render transaction list
 */
async function renderTransactionList(filterDate = '') {
  const container = document.getElementById('transaction-list');
  if (!container) return;

  let transactions = await getAllTransactions();

  // Filter by date
  if (filterDate) {
    transactions = transactions.filter(tx => {
      const txDate = new Date(tx.date).toISOString().split('T')[0];
      return txDate === filterDate;
    });
  }

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h4>Belum ada transaksi</h4>
        <p>${filterDate ? 'Tidak ada transaksi di tanggal ini' : 'Transaksi akan muncul di sini setelah checkout'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = transactions.map(tx => {
    const itemPreview = tx.items
      .map(i => `${i.name} x${i.qty}`)
      .join(', ');

    return `
      <div class="transaction-card" onclick="showTransactionDetail(${tx.id})">
        <div class="transaction-card-header">
          <div>
            <div class="transaction-id">#${String(tx.id).padStart(4, '0')}</div>
            <div class="transaction-date">${formatDate(tx.date)}</div>
          </div>
          <div class="transaction-total">${formatRupiah(tx.total)}</div>
        </div>
        <div class="transaction-items-preview">${escapeHtml(itemPreview)}</div>
      </div>
    `;
  }).join('');
}

/**
 * Show transaction detail in modal
 */
async function showTransactionDetail(txId) {
  const tx = await getTransactionById(txId);
  if (!tx) return;

  const modal = document.getElementById('receipt-modal');
  const body = document.getElementById('receipt-content');
  if (!modal || !body) return;

  body.innerHTML = generateReceiptHTML(tx);
  modal.classList.add('active');
}

/**
 * Close receipt modal
 */
function closeReceiptModal() {
  const modal = document.getElementById('receipt-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Helper to safely set text content
 */
function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
