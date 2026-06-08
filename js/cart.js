// ============================================
// cart.js — Shopping Cart & POS Module
// ============================================

let cart = [];
let currentDiscount = 0;
let weightPickerProductId = null;

// Weight fraction display names
const WEIGHT_LABELS = {
  0.1: '1 ons',
  0.25: '¼ kg',
  0.5: '½ kg',
  0.75: '¾ kg',
  1: '1 kg'
};

/**
 * Format quantity display based on unit
 */
function formatQty(qty, unit) {
  if (unit !== 'kg') return qty;
  // Show nice fraction labels if possible
  if (WEIGHT_LABELS[qty]) return WEIGHT_LABELS[qty];
  // Otherwise show decimal kg
  return `${qty.toFixed(2).replace('.', ',')} kg`;
}

/**
 * Initialize the cashier/POS page
 */
async function initCashierPage() {
  await renderCashierProducts();
  renderCart();
}

/**
 * Render products grid on cashier page
 */
async function renderCashierProducts(filterCategory = 'Semua', searchQuery = '') {
  const grid = document.getElementById('cashier-product-grid');
  if (!grid) return;

  let products = await getAllProducts();

  // Filter by category
  if (filterCategory && filterCategory !== 'Semua') {
    products = products.filter(p => p.category === filterCategory);
  }

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">🔍</div>
        <h4>Produk tidak ditemukan</h4>
        <p>Coba kata kunci atau kategori lain</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const unit = product.unit || 'pcs';
    const isKg = unit === 'kg';
    const stockClass = product.stock <= 0 ? 'out' : product.stock <= 5 ? 'low' : '';
    const stockText = product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}${isKg ? ' kg' : ''}`;
    return `
      <div class="product-card ${product.stock <= 0 ? 'out-of-stock' : ''}" 
           onclick="handleProductClick(${product.id})" 
           ${product.stock <= 0 ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-price">${formatRupiah(product.price)}${isKg ? '/kg' : ''}</div>
        <div class="product-stock ${stockClass}">${stockText}</div>
        ${isKg ? '<div class="product-unit-badge">⚖️ /kg</div>' : ''}
      </div>
    `;
  }).join('');
}

/**
 * Handle product click — show weight picker for kg, or add directly for pcs
 */
async function handleProductClick(productId) {
  const product = await getProductById(productId);
  if (!product) return;

  if ((product.unit || 'pcs') === 'kg') {
    openWeightPicker(product);
  } else {
    addToCart(productId);
  }
}

/**
 * Open weight picker modal for kg products
 */
function openWeightPicker(product) {
  weightPickerProductId = product.id;
  const modal = document.getElementById('weight-picker-modal');
  const info = document.getElementById('weight-picker-info');

  if (info) {
    info.innerHTML = `
      <div class="weight-picker-name">${escapeHtml(product.name)}</div>
      <div class="weight-picker-price">${formatRupiah(product.price)}/kg</div>
      <div class="weight-picker-stock">Stok: ${product.stock} kg</div>
    `;
  }

  // Update price labels
  const prices = { '01': 0.1, '025': 0.25, '05': 0.5, '1': 1 };
  Object.entries(prices).forEach(([id, fraction]) => {
    const el = document.getElementById(`weight-price-${id}`);
    if (el) el.textContent = formatRupiah(Math.round(product.price * fraction));
  });

  if (modal) modal.classList.add('active');
}

/**
 * Add weighted item to cart from weight picker
 */
async function addWeightToCart(weight) {
  if (!weightPickerProductId) return;
  const product = await getProductById(weightPickerProductId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === product.id && item.weight === weight);

  if (existingItem) {
    // Check stock: sum all weights of this product in cart
    const totalInCart = cart
      .filter(i => i.id === product.id)
      .reduce((sum, i) => sum + (i.weight || 0) * i.qty, 0);
    if (totalInCart + weight > product.stock) {
      showToast('Stok tidak mencukupi!', 'error');
      return;
    }
    existingItem.qty++;
  } else {
    const totalInCart = cart
      .filter(i => i.id === product.id)
      .reduce((sum, i) => sum + (i.weight || 0) * i.qty, 0);
    if (totalInCart + weight > product.stock) {
      showToast('Stok tidak mencukupi!', 'error');
      return;
    }
    cart.push({
      id: product.id,
      name: product.name,
      price: Math.round(product.price * weight),
      pricePerKg: product.price,
      qty: 1,
      weight: weight,
      unit: 'kg',
      stock: product.stock,
      cartKey: `${product.id}_${weight}`
    });
  }

  closeWeightPicker();
  renderCart();
  showToast(`${product.name} (${formatQty(weight, 'kg')}) ditambahkan`, 'success');
}

/**
 * Close weight picker modal
 */
function closeWeightPicker() {
  const modal = document.getElementById('weight-picker-modal');
  if (modal) modal.classList.remove('active');
  weightPickerProductId = null;
}

/**
 * Add product to cart (for pcs items)
 */
async function addToCart(productId) {
  const product = await getProductById(productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId && !item.weight);

  if (existingItem) {
    if (existingItem.qty >= product.stock) {
      showToast('Stok tidak mencukupi!', 'error');
      return;
    }
    existingItem.qty++;
  } else {
    if (product.stock <= 0) {
      showToast('Stok habis!', 'error');
      return;
    }
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      unit: product.unit || 'pcs',
      stock: product.stock
    });
  }

  renderCart();
  showToast(`${product.name} ditambahkan`, 'success');
}

/**
 * Update item quantity in cart
 */
function updateCartQty(cartIndex, delta) {
  const item = cart[cartIndex];
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart.splice(cartIndex, 1);
  } else if (!item.weight && item.qty > item.stock) {
    item.qty = item.stock;
    showToast('Melebihi stok tersedia!', 'error');
  }

  renderCart();
}

/**
 * Remove item from cart
 */
function removeFromCart(cartIndex) {
  cart.splice(cartIndex, 1);
  renderCart();
}

/**
 * Clear entire cart
 */
function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  currentDiscount = 0;
  renderCart();
  document.getElementById('payment-amount').value = '';
  showToast('Keranjang dikosongkan', 'success');
}

/**
 * Set discount amount
 */
function setDiscount(amount) {
  currentDiscount = amount;
  renderCart();
  if (amount > 0) {
    showToast(`Potongan ${formatRupiah(amount)} diterapkan`, 'success');
  }
}

/**
 * Get cart total
 */
/**
 * Get cart subtotal (before discount)
 */
function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * Get cart total (after discount)
 */
function getCartTotal() {
  const subtotal = getCartSubtotal();
  return Math.max(0, subtotal - currentDiscount);
}

/**
 * Get total items count
 */
function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Render the cart panel
 */
function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const cartBadge = document.getElementById('cart-badge');
  const totalEl = document.getElementById('cart-total');
  const subtotalEl = document.getElementById('cart-subtotal');
  const itemCountEl = document.getElementById('cart-item-count');
  const checkoutBtn = document.getElementById('checkout-btn');
  const discountDisplay = document.getElementById('discount-display');

  const subtotal = getCartSubtotal();
  const total = getCartTotal();
  const itemCount = getCartItemCount();

  // Update badge
  if (cartBadge) cartBadge.textContent = itemCount;

  // Update subtotal & total
  if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
  if (totalEl) totalEl.textContent = formatRupiah(total);
  if (itemCountEl) itemCountEl.textContent = `${itemCount} item`;

  // Update discount display
  if (discountDisplay) {
    if (currentDiscount > 0) {
      discountDisplay.textContent = `Potongan: -${formatRupiah(currentDiscount)}`;
      discountDisplay.className = 'discount-display active';
    } else {
      discountDisplay.textContent = 'Tidak ada potongan';
      discountDisplay.className = 'discount-display';
    }
  }

  // Update discount button active states
  [500, 1000, 2000].forEach(val => {
    const btn = document.getElementById(`discount-${val}`);
    if (btn) btn.classList.toggle('active', currentDiscount === val);
  });
  const clearBtn = document.getElementById('discount-clear');
  if (clearBtn) clearBtn.classList.toggle('active', currentDiscount === 0 && cart.length > 0);

  // Update checkout button
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

  // Render items
  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Keranjang kosong</p>
        <p style="font-size:0.75rem;margin-top:4px;">Pilih produk untuk mulai transaksi</p>
      </div>
    `;
    updateChangeDisplay();
    return;
  }

  cartItemsEl.innerHTML = cart.map((item, index) => {
    const isKg = item.unit === 'kg' && item.weight;
    const unitLabel = isKg ? `${formatRupiah(item.pricePerKg)}/kg · ${formatQty(item.weight, 'kg')}` : `${formatRupiah(item.price)} / pcs`;
    return `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">${unitLabel}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus" onclick="updateCartQty(${index}, -1)">−</button>
        <span class="cart-item-qty">${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
      </div>
      <div class="cart-item-subtotal">${formatRupiah(item.price * item.qty)}</div>
    </div>
  `;
  }).join('');

  updateChangeDisplay();
}

/**
 * Update change amount display
 */
function updateChangeDisplay() {
  const paymentInput = document.getElementById('payment-amount');
  const changeDisplay = document.getElementById('change-display');
  if (!paymentInput || !changeDisplay) return;

  const total = getCartTotal();
  const payment = parseInt(paymentInput.value) || 0;

  if (cart.length === 0 || payment === 0) {
    changeDisplay.className = 'change-display neutral';
    changeDisplay.textContent = 'Masukkan jumlah bayar';
    return;
  }

  const change = payment - total;

  if (change >= 0) {
    changeDisplay.className = 'change-display positive';
    changeDisplay.textContent = `Kembalian: ${formatRupiah(change)}`;
  } else {
    changeDisplay.className = 'change-display negative';
    changeDisplay.textContent = `Kurang: ${formatRupiah(Math.abs(change))}`;
  }
}

/**
 * Set quick cash amount
 */
function setQuickCash(amount) {
  const paymentInput = document.getElementById('payment-amount');
  if (paymentInput) {
    paymentInput.value = amount;
    updateChangeDisplay();
  }
}

/**
 * Set exact payment amount
 */
function setExactCash() {
  const total = getCartTotal();
  const paymentInput = document.getElementById('payment-amount');
  if (paymentInput) {
    paymentInput.value = total;
    updateChangeDisplay();
  }
}

/**
 * Process checkout
 */
async function processCheckout() {
  if (cart.length === 0) {
    showToast('Keranjang kosong!', 'error');
    return;
  }

  const subtotal = getCartSubtotal();
  const total = getCartTotal();
  const paymentInput = document.getElementById('payment-amount');
  const payment = parseInt(paymentInput.value) || 0;

  if (payment < total) {
    showToast('Pembayaran kurang!', 'error');
    return;
  }

  const change = payment - total;

  // Create transaction record
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
    payment: payment,
    change: change,
    itemCount: getCartItemCount()
  };

  try {
    // Update stock for each product
    // Group items by product id and sum up stock usage
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

    // Show receipt
    showReceiptModal({ ...transaction, id: txId, date: new Date().toISOString() });

    // Clear cart and discount
    cart = [];
    currentDiscount = 0;
    paymentInput.value = '';
    renderCart();
    await renderCashierProducts(
      getCurrentCashierCategory(),
      document.getElementById('cashier-search')?.value || ''
    );

    showToast('Transaksi berhasil! ✅', 'success');
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('Gagal memproses transaksi', 'error');
  }
}

/**
 * Show receipt modal after checkout
 */
function showReceiptModal(transaction) {
  const modal = document.getElementById('receipt-modal');
  const body = document.getElementById('receipt-content');
  if (!modal || !body) return;

  body.innerHTML = generateReceiptHTML(transaction);
  modal.classList.add('active');
}

/**
 * Generate receipt HTML
 */
function generateReceiptHTML(tx) {
  const itemsHtml = tx.items.map(item => {
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

  const discountHtml = (tx.discount && tx.discount > 0) ? `
    <div class="receipt-row">
      <span>Subtotal</span>
      <span>${formatRupiah(tx.subtotal || tx.total + tx.discount)}</span>
    </div>
    <div class="receipt-row receipt-discount">
      <span>✂️ Potongan</span>
      <span>-${formatRupiah(tx.discount)}</span>
    </div>
  ` : '';

  return `
    <div class="receipt" id="printable-receipt">
      <div class="receipt-header">
        <h4>🏪 Warung Sembako</h4>
        <p>${formatDate(tx.date)}</p>
        <p>No: #${String(tx.id).padStart(4, '0')}</p>
      </div>
      <div class="receipt-items">
        ${itemsHtml}
      </div>
      <div class="receipt-footer">
        <div class="receipt-row">
          <span>Total Item</span>
          <span>${tx.itemCount} pcs</span>
        </div>
        ${discountHtml}
        <div class="receipt-row grand-total">
          <span>TOTAL</span>
          <span class="amount">${formatRupiah(tx.total)}</span>
        </div>
        <div class="receipt-row">
          <span>Bayar</span>
          <span>${formatRupiah(tx.payment)}</span>
        </div>
        <div class="receipt-row">
          <span>Kembalian</span>
          <span>${formatRupiah(tx.change)}</span>
        </div>
      </div>
    </div>
    <button class="btn-print" onclick="printReceipt()">🖨️ Cetak Struk</button>
  `;
}

/**
 * Print receipt
 */
function printReceipt() {
  window.print();
}

/**
 * Get current cashier category filter
 */
function getCurrentCashierCategory() {
  const activeChip = document.querySelector('#cashier-categories .chip.active');
  return activeChip ? activeChip.dataset.category : 'Semua';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
