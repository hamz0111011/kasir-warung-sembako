// ============================================
// app.js — Main Application Controller
// ============================================

let currentPage = 'cashier';
let deferredInstallPrompt = null;

/**
 * Initialize the application
 */
async function initApp() {
  try {
    // Open database
    await openDB();

    // Set up navigation
    setupNavigation();

    // Set up search and filters
    setupCashierFilters();
    setupProductFilters();
    setupHistoryFilters();

    // Set up payment input
    setupPaymentInput();

    // Setup modal close on overlay click
    setupModalCloseHandlers();

    // Update header date
    updateHeaderDate();

    // Register Service Worker
    registerServiceWorker();

    // Handle PWA install prompt
    setupPWAInstall();

    // Load initial page
    await switchPage('cashier');

    console.log('✅ Warung Kasir App initialized successfully');
  } catch (err) {
    console.error('Failed to initialize app:', err);
    showToast('Gagal memuat aplikasi', 'error');
  }
}

/**
 * Setup navigation
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page) switchPage(page);
    });
  });
}

/**
 * Switch to a page
 */
async function switchPage(pageName) {
  currentPage = pageName;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // Update page visibility
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === `page-${pageName}`);
  });

  // Show/hide FAB
  const fab = document.getElementById('fab-add');
  if (fab) fab.classList.toggle('visible', pageName === 'products');

  // Load page data
  switch (pageName) {
    case 'cashier':
      await initCashierPage();
      break;
    case 'products':
      await initProductPage();
      break;
    case 'history':
      await initHistoryPage();
      break;
  }
}

/**
 * Setup cashier page search and category filters
 */
function setupCashierFilters() {
  // Search input
  const searchInput = document.getElementById('cashier-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderCashierProducts(getCurrentCashierCategory(), searchInput.value);
      }, 300);
    });
  }

  // Category chips
  const chipsContainer = document.getElementById('cashier-categories');
  if (chipsContainer) {
    // Build chips
    const allCategories = ['Semua', ...CATEGORIES];
    chipsContainer.innerHTML = allCategories.map((cat, i) => `
      <button class="chip ${i === 0 ? 'active' : ''}" data-category="${cat}">${cat}</button>
    `).join('');

    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      renderCashierProducts(chip.dataset.category, searchInput?.value || '');
    });
  }
}

/**
 * Setup product page search and category filters
 */
function setupProductFilters() {
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderProductList(searchInput.value, getCurrentProductCategory());
      }, 300);
    });
  }

  const chipsContainer = document.getElementById('product-categories');
  if (chipsContainer) {
    const allCategories = ['Semua', ...CATEGORIES];
    chipsContainer.innerHTML = allCategories.map((cat, i) => `
      <button class="chip ${i === 0 ? 'active' : ''}" data-category="${cat}">${cat}</button>
    `).join('');

    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      renderProductList(searchInput?.value || '', chip.dataset.category);
    });
  }
}

/**
 * Setup history page filters
 */
function setupHistoryFilters() {
  const dateInput = document.getElementById('history-date-filter');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      renderTransactionList(dateInput.value);
    });
  }

  const clearBtn = document.getElementById('history-clear-filter');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (dateInput) dateInput.value = '';
      renderTransactionList();
    });
  }
}

/**
 * Setup payment input events
 */
function setupPaymentInput() {
  const paymentInput = document.getElementById('payment-amount');
  if (paymentInput) {
    paymentInput.addEventListener('input', updateChangeDisplay);
  }

  // Unit select hint toggle
  const unitSelect = document.getElementById('product-unit');
  if (unitSelect) {
    unitSelect.addEventListener('change', () => {
      toggleUnitHint(unitSelect.value);
    });
  }
}

/**
 * Setup modal close handlers
 */
function setupModalCloseHandlers() {
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

/**
 * Update header date display
 */
function updateHeaderDate() {
  const dateEl = document.getElementById('header-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 3000);
}

/**
 * Register Service Worker for offline support
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered:', registration.scope);
    } catch (err) {
      console.log('Service Worker registration failed:', err);
    }
  }
}

/**
 * Setup PWA install prompt
 */
function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    // Show install banner
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('visible');
  });

  // Install button
  const installBtn = document.getElementById('btn-install');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;

      if (result.outcome === 'accepted') {
        showToast('Aplikasi berhasil diinstal! 🎉', 'success');
      }

      deferredInstallPrompt = null;
      const banner = document.getElementById('install-banner');
      if (banner) banner.classList.remove('visible');
    });
  }

  // Dismiss button
  const dismissBtn = document.getElementById('btn-dismiss-install');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('install-banner');
      if (banner) banner.classList.remove('visible');
    });
  }

  // Already installed
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('visible');
  });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
