// ============================================
// debt.js — Debt Management Module (Hutang/Cicilan)
// ============================================

/**
 * Initialize debt page
 */
async function initDebtPage() {
  await renderDebtStats();
  await renderDebtList();
}

/**
 * Render debt statistics cards
 */
async function renderDebtStats() {
  const debts = await getAllDebts();

  const totalDebt = debts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.totalPaid, 0);
  const totalRemaining = debts.reduce((sum, d) => sum + d.remaining, 0);
  const unpaidCount = debts.filter(d => d.status === 'unpaid').length;

  // Get unique debtor names with unpaid debts
  const uniqueDebtors = new Set(
    debts.filter(d => d.status === 'unpaid').map(d => d.debtorName)
  );

  setTextContent('stat-total-debt', formatRupiah(totalRemaining));
  setTextContent('stat-total-paid-debt', formatRupiah(totalPaid));
  setTextContent('stat-debtor-count', uniqueDebtors.size + ' orang');
  setTextContent('stat-debt-transactions', unpaidCount + ' hutang');
}

/**
 * Render debt list grouped by debtor
 */
async function renderDebtList(searchQuery = '', filterStatus = 'all') {
  const container = document.getElementById('debt-list');
  if (!container) return;

  let debts = await getAllDebts();

  // Filter by status
  if (filterStatus === 'unpaid') {
    debts = debts.filter(d => d.status === 'unpaid');
  } else if (filterStatus === 'paid') {
    debts = debts.filter(d => d.status === 'paid');
  }

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    debts = debts.filter(d => d.debtorName.toLowerCase().includes(q));
  }

  if (debts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💳</div>
        <h4>Belum ada hutang</h4>
        <p>${searchQuery ? 'Tidak ditemukan hutang yang cocok' : 'Hutang akan muncul setelah checkout dengan opsi hutang'}</p>
      </div>
    `;
    return;
  }

  // Group by debtor name
  const grouped = {};
  debts.forEach(debt => {
    if (!grouped[debt.debtorName]) {
      grouped[debt.debtorName] = {
        name: debt.debtorName,
        debts: [],
        totalRemaining: 0,
        totalDebt: 0,
        totalPaid: 0,
        hasUnpaid: false
      };
    }
    grouped[debt.debtorName].debts.push(debt);
    grouped[debt.debtorName].totalRemaining += debt.remaining;
    grouped[debt.debtorName].totalDebt += debt.totalDebt;
    grouped[debt.debtorName].totalPaid += debt.totalPaid;
    if (debt.status === 'unpaid') {
      grouped[debt.debtorName].hasUnpaid = true;
    }
  });

  // Sort: unpaid debtors first, then by remaining amount descending
  const sortedGroups = Object.values(grouped).sort((a, b) => {
    if (a.hasUnpaid !== b.hasUnpaid) return a.hasUnpaid ? -1 : 1;
    return b.totalRemaining - a.totalRemaining;
  });

  container.innerHTML = sortedGroups.map(group => {
    const paidPercent = group.totalDebt > 0
      ? Math.round((group.totalPaid / group.totalDebt) * 100)
      : 0;

    const statusClass = group.totalRemaining <= 0 ? 'paid' : 'unpaid';
    const statusText = group.totalRemaining <= 0 ? '✅ Lunas' : `Sisa: ${formatRupiah(group.totalRemaining)}`;
    const statusBadge = group.totalRemaining <= 0
      ? '<span class="debt-badge paid">Lunas</span>'
      : '<span class="debt-badge unpaid">Belum Lunas</span>';

    const debtItemsHtml = group.debts.map(debt => {
      const debtStatusClass = debt.status === 'paid' ? 'paid' : 'unpaid';
      const debtPaidPercent = debt.totalDebt > 0
        ? Math.round((debt.totalPaid / debt.totalDebt) * 100)
        : 0;

      return `
        <div class="debt-sub-item ${debtStatusClass}" onclick="showDebtDetail(${debt.id})">
          <div class="debt-sub-info">
            <div class="debt-sub-date">${formatDate(debt.createdAt)}</div>
            <div class="debt-sub-items">${debt.items.map(i => i.name).join(', ')}</div>
          </div>
          <div class="debt-sub-right">
            <div class="debt-sub-amount ${debtStatusClass}">${debt.status === 'paid' ? '✅ Lunas' : formatRupiah(debt.remaining)}</div>
            <div class="debt-sub-progress">
              <div class="debt-progress-bar">
                <div class="debt-progress-fill" style="width:${debtPaidPercent}%"></div>
              </div>
              <span class="debt-progress-text">${debtPaidPercent}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="debt-card">
        <div class="debt-card-header" onclick="toggleDebtExpand(this)">
          <div class="debt-card-left">
            <div class="debt-debtor-avatar">${group.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="debt-debtor-name">${escapeHtml(group.name)}</div>
              <div class="debt-debtor-meta">${group.debts.length} transaksi hutang</div>
            </div>
          </div>
          <div class="debt-card-right">
            ${statusBadge}
            <div class="debt-remaining-amount ${statusClass}">${statusText}</div>
            <div class="debt-progress-bar main">
              <div class="debt-progress-fill" style="width:${paidPercent}%"></div>
            </div>
          </div>
          <div class="debt-expand-icon">▼</div>
        </div>
        <div class="debt-card-body collapsed">
          ${debtItemsHtml}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Toggle expand/collapse of debtor card body
 */
function toggleDebtExpand(headerEl) {
  const card = headerEl.closest('.debt-card');
  const body = card.querySelector('.debt-card-body');
  const icon = card.querySelector('.debt-expand-icon');

  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    body.classList.add('expanded');
    icon.textContent = '▲';
  } else {
    body.classList.remove('expanded');
    body.classList.add('collapsed');
    icon.textContent = '▼';
  }
}

/**
 * Show debt detail modal
 */
async function showDebtDetail(debtId) {
  const debt = await getDebtById(debtId);
  if (!debt) return;

  const modal = document.getElementById('debt-detail-modal');
  const body = document.getElementById('debt-detail-content');
  if (!modal || !body) return;

  const paidPercent = debt.totalDebt > 0
    ? Math.round((debt.totalPaid / debt.totalDebt) * 100)
    : 0;

  const itemsHtml = debt.items.map(item => {
    const isKg = item.unit === 'kg' && item.weight;
    const qtyText = isKg ? `${formatQty(item.weight, 'kg')} x${item.qty}` : `x${item.qty}`;
    return `
      <div class="receipt-item">
        <span class="receipt-item-name">${escapeHtml(item.name)}</span>
        <span class="receipt-item-qty">${qtyText}</span>
        <span class="receipt-item-total">${formatRupiah(item.subtotal)}</span>
      </div>
    `;
  }).join('');

  const paymentsHtml = (debt.payments && debt.payments.length > 0)
    ? debt.payments.map((p, i) => `
      <div class="payment-history-item">
        <div class="payment-history-left">
          <span class="payment-history-num">#${i + 1}</span>
          <span class="payment-history-date">${formatDate(p.date)}</span>
        </div>
        <span class="payment-history-amount">+${formatRupiah(p.amount)}</span>
      </div>
    `).join('')
    : '<div class="payment-history-empty">Belum ada pembayaran</div>';

  const statusBadgeHtml = debt.status === 'paid'
    ? '<span class="debt-badge paid large">✅ LUNAS</span>'
    : '<span class="debt-badge unpaid large">⏳ BELUM LUNAS</span>';

  body.innerHTML = `
    <div class="debt-detail">
      <div class="debt-detail-header">
        <div class="debt-detail-avatar">${debt.debtorName.charAt(0).toUpperCase()}</div>
        <div>
          <div class="debt-detail-name">${escapeHtml(debt.debtorName)}</div>
          <div class="debt-detail-date">${formatDate(debt.createdAt)}</div>
        </div>
        ${statusBadgeHtml}
      </div>

      <div class="debt-detail-progress-section">
        <div class="debt-detail-progress-info">
          <span>Pembayaran</span>
          <span>${paidPercent}%</span>
        </div>
        <div class="debt-progress-bar large">
          <div class="debt-progress-fill" style="width:${paidPercent}%"></div>
        </div>
        <div class="debt-detail-amounts">
          <div class="debt-amount-item">
            <span class="debt-amount-label">Total Hutang</span>
            <span class="debt-amount-value">${formatRupiah(debt.totalDebt)}</span>
          </div>
          <div class="debt-amount-item">
            <span class="debt-amount-label">Sudah Bayar</span>
            <span class="debt-amount-value paid">${formatRupiah(debt.totalPaid)}</span>
          </div>
          <div class="debt-amount-item">
            <span class="debt-amount-label">Sisa</span>
            <span class="debt-amount-value remaining">${formatRupiah(debt.remaining)}</span>
          </div>
        </div>
      </div>

      <div class="debt-detail-section">
        <h4>🛒 Item Belanja</h4>
        <div class="receipt-items">${itemsHtml}</div>
      </div>

      <div class="debt-detail-section">
        <h4>💰 Riwayat Pembayaran</h4>
        <div class="payment-history-list">${paymentsHtml}</div>
      </div>

      ${debt.status === 'unpaid' ? `
        <div class="debt-detail-actions">
          <button class="btn btn-primary" onclick="openPaymentModal(${debt.id})">💰 Bayar Cicilan</button>
          <button class="btn btn-danger-outline" onclick="confirmDeleteDebt(${debt.id}, '${escapeHtml(debt.debtorName).replace(/'/g, "\\'")}')">🗑️ Hapus</button>
        </div>
      ` : `
        <div class="debt-detail-actions">
          <div class="debt-paid-info">
            <span>✅ Lunas pada ${debt.paidAt ? formatDate(debt.paidAt) : '-'}</span>
          </div>
          <button class="btn btn-danger-outline" onclick="confirmDeleteDebt(${debt.id}, '${escapeHtml(debt.debtorName).replace(/'/g, "\\'")}')">🗑️ Hapus</button>
        </div>
      `}
    </div>
  `;

  modal.classList.add('active');
}

/**
 * Close debt detail modal
 */
function closeDebtDetailModal() {
  const modal = document.getElementById('debt-detail-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Open payment modal for installment
 */
async function openPaymentModal(debtId) {
  const debt = await getDebtById(debtId);
  if (!debt || debt.status === 'paid') return;

  const modal = document.getElementById('payment-modal');
  const nameEl = document.getElementById('payment-debtor-name');
  const remainingEl = document.getElementById('payment-remaining');
  const input = document.getElementById('payment-cicilan-amount');
  const payBtn = document.getElementById('payment-process-btn');

  if (nameEl) nameEl.textContent = debt.debtorName;
  if (remainingEl) remainingEl.textContent = formatRupiah(debt.remaining);
  if (input) {
    input.value = '';
    input.max = debt.remaining;
    input.placeholder = `Maks ${formatRupiah(debt.remaining)}`;
  }

  // Quick payment buttons
  const quickContainer = document.getElementById('payment-quick-buttons');
  if (quickContainer) {
    const quickAmounts = generateQuickPayments(debt.remaining);
    quickContainer.innerHTML = quickAmounts.map(amt => `
      <button class="quick-cash-btn" onclick="setPaymentAmount(${amt})">${formatRupiahShort(amt)}</button>
    `).join('') + `
      <button class="quick-cash-btn" onclick="setPaymentAmount(${debt.remaining})" style="border-color:var(--accent);color:var(--accent);">Lunas</button>
    `;
  }

  if (payBtn) {
    payBtn.onclick = () => processDebtPayment(debtId);
  }

  // Close debt detail modal first
  closeDebtDetailModal();

  if (modal) modal.classList.add('active');
}

/**
 * Close payment modal
 */
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Set payment amount from quick button
 */
function setPaymentAmount(amount) {
  const input = document.getElementById('payment-cicilan-amount');
  if (input) {
    input.value = amount;
  }
}

/**
 * Process debt installment payment
 */
async function processDebtPayment(debtId) {
  const debt = await getDebtById(debtId);
  if (!debt || debt.status === 'paid') {
    showToast('Hutang sudah lunas!', 'error');
    return;
  }

  const input = document.getElementById('payment-cicilan-amount');
  const amount = parseInt(input?.value) || 0;

  if (amount <= 0) {
    showToast('Masukkan jumlah pembayaran!', 'error');
    return;
  }

  if (amount > debt.remaining) {
    showToast('Jumlah melebihi sisa hutang!', 'error');
    return;
  }

  // Add payment record
  if (!debt.payments) debt.payments = [];
  debt.payments.push({
    amount: amount,
    date: new Date().toISOString()
  });

  // Update totals
  debt.totalPaid += amount;
  debt.remaining = debt.totalDebt - debt.totalPaid;

  // Check if fully paid
  if (debt.remaining <= 0) {
    debt.remaining = 0;
    debt.status = 'paid';
    debt.paidAt = new Date().toISOString();
  }

  try {
    await updateDebt(debt);
    closePaymentModal();

    if (debt.status === 'paid') {
      showToast(`Hutang ${debt.debtorName} LUNAS! 🎉`, 'success');
    } else {
      showToast(`Pembayaran ${formatRupiah(amount)} berhasil! Sisa: ${formatRupiah(debt.remaining)}`, 'success');
    }

    // Refresh debt page
    await initDebtPage();
  } catch (err) {
    console.error('Payment error:', err);
    showToast('Gagal memproses pembayaran', 'error');
  }
}

/**
 * Confirm delete debt
 */
function confirmDeleteDebt(debtId, debtorName) {
  const modal = document.getElementById('confirm-debt-delete-modal');
  const nameEl = document.getElementById('confirm-debt-name');
  const confirmBtn = document.getElementById('confirm-debt-delete-btn');

  if (nameEl) nameEl.textContent = debtorName;
  if (confirmBtn) {
    confirmBtn.onclick = () => executeDeleteDebt(debtId);
  }

  // Close detail modal
  closeDebtDetailModal();

  if (modal) modal.classList.add('active');
}

/**
 * Execute debt deletion
 */
async function executeDeleteDebt(debtId) {
  try {
    await deleteDebt(debtId);
    closeConfirmDebtDeleteModal();
    showToast('Hutang berhasil dihapus 🗑️', 'success');
    await initDebtPage();
  } catch (err) {
    console.error('Delete debt error:', err);
    showToast('Gagal menghapus hutang', 'error');
  }
}

/**
 * Close confirm debt delete modal
 */
function closeConfirmDebtDeleteModal() {
  const modal = document.getElementById('confirm-debt-delete-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Generate quick payment amounts based on remaining debt
 */
function generateQuickPayments(remaining) {
  const amounts = [];
  const steps = [5000, 10000, 20000, 50000, 100000];

  for (const step of steps) {
    if (step < remaining) {
      amounts.push(step);
    }
  }

  // Add half amount if reasonable
  const half = Math.round(remaining / 2 / 1000) * 1000;
  if (half > 0 && half < remaining && !amounts.includes(half)) {
    amounts.push(half);
    amounts.sort((a, b) => a - b);
  }

  // Keep max 5 quick buttons
  return amounts.slice(0, 5);
}

/**
 * Format rupiah in short form for buttons
 */
function formatRupiahShort(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}jt`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}rb`;
  }
  return amount.toString();
}

/**
 * Get current debt filter status
 */
function getCurrentDebtFilter() {
  const activeChip = document.querySelector('#debt-filter-chips .chip.active');
  return activeChip ? activeChip.dataset.filter : 'all';
}

/**
 * Open debtor name modal for debt checkout
 */
function openDebtorNameModal() {
  if (cart.length === 0) {
    showToast('Keranjang kosong!', 'error');
    return;
  }

  const modal = document.getElementById('debtor-name-modal');
  const input = document.getElementById('debtor-name-input');
  const totalEl = document.getElementById('debtor-total-display');

  if (totalEl) totalEl.textContent = formatRupiah(getCartTotal());
  if (input) input.value = '';

  if (modal) modal.classList.add('active');

  // Focus input after animation
  setTimeout(() => { if (input) input.focus(); }, 300);
}

/**
 * Close debtor name modal
 */
function closeDebtorNameModal() {
  const modal = document.getElementById('debtor-name-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Process debt checkout — save transaction + create debt record
 */
async function processDebtCheckout() {
  const input = document.getElementById('debtor-name-input');
  const debtorName = input?.value.trim();

  if (!debtorName) {
    showToast('Masukkan nama penghutang!', 'error');
    return;
  }

  if (cart.length === 0) {
    showToast('Keranjang kosong!', 'error');
    return;
  }

  const subtotal = getCartSubtotal();
  const total = getCartTotal();

  // Create transaction record (same as normal checkout but payment = 0)
  const transaction = {
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      pricePerKg: item.pricePerKg || null,
      qty: item.qty,
      weight: item.weight || null,
      unit: item.unit || 'pcs',
      subtotal: item.price * item.qty
    })),
    subtotal: subtotal,
    discount: currentDiscount,
    total: total,
    payment: 0,
    change: 0,
    itemCount: getCartItemCount(),
    isDebt: true,
    debtorName: debtorName
  };

  try {
    // Update stock
    const stockUsage = {};
    for (const item of cart) {
      const usage = item.weight ? item.weight * item.qty : item.qty;
      stockUsage[item.id] = (stockUsage[item.id] || 0) + usage;
    }
    for (const [productId, usage] of Object.entries(stockUsage)) {
      const product = await getProductById(parseInt(productId));
      if (product) {
        product.stock = Math.max(0, product.stock - usage);
        await updateProduct(product);
      }
    }

    // Save transaction
    const txId = await addTransaction(transaction);

    // Create debt record
    const debt = {
      debtorName: debtorName,
      transactionId: txId,
      items: transaction.items,
      totalDebt: total,
      totalPaid: 0,
      remaining: total,
      status: 'unpaid',
      payments: [],
      paidAt: null
    };

    await addDebt(debt);

    // Close modal
    closeDebtorNameModal();

    // Clear cart and discount
    cart = [];
    currentDiscount = 0;
    const paymentInput = document.getElementById('payment-amount');
    if (paymentInput) paymentInput.value = '';
    renderCart();
    await renderCashierProducts(
      getCurrentCashierCategory(),
      document.getElementById('cashier-search')?.value || ''
    );

    showToast(`Hutang ${debtorName} (${formatRupiah(total)}) tersimpan! 📝`, 'success');
  } catch (err) {
    console.error('Debt checkout error:', err);
    showToast('Gagal menyimpan hutang', 'error');
  }
}
