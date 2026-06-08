// ============================================
// products.js — Product Management Module
// ============================================

let currentEditProductId = null;

/**
 * Initialize product management page
 */
async function initProductPage() {
  await renderProductList();
}

/**
 * Render product list
 */
async function renderProductList(searchQuery = '', filterCategory = 'Semua') {
  const container = document.getElementById('product-list-container');
  if (!container) return;

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

  // Sort by category then name
  products.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  // Update product count
  const countEl = document.getElementById('product-count');
  if (countEl) countEl.textContent = `${products.length} produk`;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h4>Tidak ada produk</h4>
        <p>Tambahkan produk baru dengan tombol + di bawah</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="product-list-mobile">
    ${products.map(product => {
      const unit = product.unit || 'pcs';
      const isKg = unit === 'kg';
      const stockClass = product.stock <= 0 ? 'out' : product.stock <= 5 ? 'low' : '';
      const stockText = product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}${isKg ? ' kg' : ''}`;
      return `
        <div class="product-list-item">
          <div class="item-info">
            <div class="item-name">${escapeHtml(product.name)} ${isKg ? '<span class="unit-tag">/kg</span>' : ''}</div>
            <div class="item-meta">${product.category} · <span class="product-stock ${stockClass}">${stockText}</span></div>
          </div>
          <div class="item-price">${formatRupiah(product.price)}${isKg ? '/kg' : ''}</div>
          <div class="item-actions">
            <button class="btn-icon edit" onclick="openEditProduct(${product.id})" title="Edit">✏️</button>
            <button class="btn-icon delete" onclick="confirmDeleteProduct(${product.id}, '${escapeHtml(product.name).replace(/'/g, "\\\'")}')" title="Hapus">🗑️</button>
          </div>
        </div>
      `;
    }).join('')}
  </div>`;
}

/**
 * Open add product modal
 */
function openAddProduct() {
  currentEditProductId = null;
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');

  if (title) title.textContent = 'Tambah Produk';
  if (form) form.reset();

  // Set default category
  const catSelect = document.getElementById('product-category');
  if (catSelect) catSelect.value = 'Sembako';

  // Set default unit
  const unitSelect = document.getElementById('product-unit');
  if (unitSelect) {
    unitSelect.value = 'pcs';
    toggleUnitHint('pcs');
  }

  if (modal) modal.classList.add('active');
}

/**
 * Open edit product modal
 */
async function openEditProduct(productId) {
  const product = await getProductById(productId);
  if (!product) return;

  currentEditProductId = productId;

  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');

  if (title) title.textContent = 'Edit Produk';

  // Fill form
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-stock').value = product.stock;

  const unitSelect = document.getElementById('product-unit');
  if (unitSelect) {
    unitSelect.value = product.unit || 'pcs';
    toggleUnitHint(product.unit || 'pcs');
  }

  if (modal) modal.classList.add('active');
}

/**
 * Save product (add or edit)
 */
async function saveProduct() {
  const name = document.getElementById('product-name').value.trim();
  const price = parseInt(document.getElementById('product-price').value);
  const category = document.getElementById('product-category').value;
  const stock = parseInt(document.getElementById('product-stock').value);
  const unit = document.getElementById('product-unit')?.value || 'pcs';

  // Validation
  if (!name) {
    showToast('Nama produk harus diisi!', 'error');
    return;
  }
  if (!price || price <= 0) {
    showToast('Harga harus lebih dari 0!', 'error');
    return;
  }
  if (isNaN(stock) || stock < 0) {
    showToast('Stok tidak valid!', 'error');
    return;
  }

  try {
    if (currentEditProductId) {
      // Edit existing product
      const product = await getProductById(currentEditProductId);
      if (product) {
        product.name = name;
        product.price = price;
        product.category = category;
        product.stock = stock;
        product.unit = unit;
        await updateProduct(product);
        showToast('Produk berhasil diperbarui ✅', 'success');
      }
    } else {
      // Add new product
      await addProduct({ name, price, category, stock, unit });
      showToast('Produk berhasil ditambahkan ✅', 'success');
    }

    // Close modal and refresh
    closeProductModal();
    await renderProductList(
      document.getElementById('product-search')?.value || '',
      getCurrentProductCategory()
    );

    // Also refresh cashier page products
    await renderCashierProducts(
      getCurrentCashierCategory(),
      document.getElementById('cashier-search')?.value || ''
    );
  } catch (err) {
    console.error('Save product error:', err);
    showToast('Gagal menyimpan produk', 'error');
  }
}

/**
 * Confirm delete product
 */
function confirmDeleteProduct(productId, productName) {
  const modal = document.getElementById('confirm-modal');
  const nameEl = document.getElementById('confirm-product-name');
  const confirmBtn = document.getElementById('confirm-delete-btn');

  if (nameEl) nameEl.textContent = productName;
  if (confirmBtn) {
    confirmBtn.onclick = () => executeDeleteProduct(productId);
  }

  if (modal) modal.classList.add('active');
}

/**
 * Execute product deletion
 */
async function executeDeleteProduct(productId) {
  try {
    await deleteProduct(productId);

    // Remove from cart if present
    cart = cart.filter(i => i.id !== productId);
    renderCart();

    closeConfirmModal();
    showToast('Produk berhasil dihapus 🗑️', 'success');

    await renderProductList(
      document.getElementById('product-search')?.value || '',
      getCurrentProductCategory()
    );

    await renderCashierProducts(
      getCurrentCashierCategory(),
      document.getElementById('cashier-search')?.value || ''
    );
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Gagal menghapus produk', 'error');
  }
}

/**
 * Close product modal
 */
function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
  currentEditProductId = null;
}

/**
 * Close confirm modal
 */
function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Get current product page category filter
 */
function getCurrentProductCategory() {
  const activeChip = document.querySelector('#product-categories .chip.active');
  return activeChip ? activeChip.dataset.category : 'Semua';
}

/**
 * Toggle unit hint visibility
 */
function toggleUnitHint(value) {
  const hint = document.getElementById('unit-hint');
  if (hint) {
    hint.style.display = value === 'kg' ? 'block' : 'none';
  }
}
