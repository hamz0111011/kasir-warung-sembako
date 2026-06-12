// ============================================
// db.js — IndexedDB Database Layer
// Warung Sembako Kasir PWA
// ============================================

const DB_NAME = 'warung_kasir_db';
const DB_VERSION = 2;

const CATEGORIES = [
  'Sembako',
  'Minuman',
  'Snack',
  'Rokok',
  'Bumbu Dapur',
  'Peralatan Mandi',
  'Pembersih',
  'Baking',
  'Obat',
  'Lainnya'
];

const DEFAULT_PRODUCTS = [
  // Sembako
  { name: 'Beras 5kg', price: 65000, category: 'Sembako', stock: 50, unit: 'pcs' },
  { name: 'Beras 25kg', price: 310000, category: 'Sembako', stock: 20, unit: 'pcs' },
  { name: 'Beras (per kg)', price: 13000, category: 'Sembako', stock: 100, unit: 'kg' },
  { name: 'Minyak Goreng 1L', price: 18000, category: 'Sembako', stock: 40, unit: 'pcs' },
  { name: 'Minyak Goreng 2L', price: 35000, category: 'Sembako', stock: 30, unit: 'pcs' },
  { name: 'Gula Pasir (per kg)', price: 16000, category: 'Sembako', stock: 60, unit: 'kg' },
  { name: 'Tepung Terigu (per kg)', price: 12000, category: 'Sembako', stock: 35, unit: 'kg' },
  { name: 'Telur (per kg)', price: 28000, category: 'Sembako', stock: 40, unit: 'kg' },
  { name: 'Mie Instan Goreng', price: 3500, category: 'Sembako', stock: 100, unit: 'pcs' },
  { name: 'Mie Instan Kuah', price: 3000, category: 'Sembako', stock: 100, unit: 'pcs' },
  { name: 'Susu Kental Manis', price: 10000, category: 'Sembako', stock: 30, unit: 'pcs' },

  // Minuman
  { name: 'Aqua 600ml', price: 4000, category: 'Minuman', stock: 80, unit: 'pcs' },
  { name: 'Aqua 1500ml', price: 7000, category: 'Minuman', stock: 40, unit: 'pcs' },
  { name: 'Teh Botol Sosro', price: 5000, category: 'Minuman', stock: 50, unit: 'pcs' },
  { name: 'Teh Pucuk Harum', price: 4000, category: 'Minuman', stock: 50, unit: 'pcs' },
  { name: 'Kopi Sachet Kapal Api', price: 2000, category: 'Minuman', stock: 100, unit: 'pcs' },
  { name: 'Kopi Sachet Good Day', price: 2500, category: 'Minuman', stock: 80, unit: 'pcs' },
  { name: 'Susu Ultra 250ml', price: 6000, category: 'Minuman', stock: 40, unit: 'pcs' },
  { name: 'Sprite 390ml', price: 6000, category: 'Minuman', stock: 40, unit: 'pcs' },
  { name: 'Coca Cola 390ml', price: 6000, category: 'Minuman', stock: 40, unit: 'pcs' },
  { name: 'Fanta 390ml', price: 6000, category: 'Minuman', stock: 40, unit: 'pcs' },

  // Snack
  { name: 'Chitato 68g', price: 10000, category: 'Snack', stock: 30, unit: 'pcs' },
  { name: 'Lays 68g', price: 10000, category: 'Snack', stock: 30, unit: 'pcs' },
  { name: 'Oreo 133g', price: 10000, category: 'Snack', stock: 25, unit: 'pcs' },
  { name: 'Biskuit Roma Kelapa', price: 5000, category: 'Snack', stock: 40, unit: 'pcs' },
  { name: 'Wafer Tango', price: 6000, category: 'Snack', stock: 30, unit: 'pcs' },
  { name: 'Roti Tawar', price: 15000, category: 'Snack', stock: 15, unit: 'pcs' },
  { name: 'Beng-Beng', price: 3000, category: 'Snack', stock: 50, unit: 'pcs' },
  { name: 'Silverqueen 30g', price: 8000, category: 'Snack', stock: 25, unit: 'pcs' },

  // Rokok
  { name: 'Gudang Garam Filter', price: 28000, category: 'Rokok', stock: 30, unit: 'pcs' },
  { name: 'Djarum Super 12', price: 25000, category: 'Rokok', stock: 30, unit: 'pcs' },
  { name: 'Surya 12', price: 22000, category: 'Rokok', stock: 30, unit: 'pcs' },
  { name: 'Sampoerna Mild', price: 30000, category: 'Rokok', stock: 30, unit: 'pcs' },
  { name: 'LA Bold', price: 22000, category: 'Rokok', stock: 25, unit: 'pcs' },

  // Bumbu Dapur
  { name: 'Kecap Manis ABC 275ml', price: 12000, category: 'Bumbu Dapur', stock: 20, unit: 'pcs' },
  { name: 'Kecap Manis Bango 275ml', price: 14000, category: 'Bumbu Dapur', stock: 20, unit: 'pcs' },
  { name: 'Sambal ABC 335ml', price: 15000, category: 'Bumbu Dapur', stock: 20, unit: 'pcs' },
  { name: 'Garam Refina 500g', price: 5000, category: 'Bumbu Dapur', stock: 30, unit: 'pcs' },
  { name: 'Merica Bubuk 50g', price: 8000, category: 'Bumbu Dapur', stock: 20, unit: 'pcs' },
  { name: 'Penyedap Rasa Royco', price: 2000, category: 'Bumbu Dapur', stock: 50, unit: 'pcs' },
  { name: 'Santan Kara 65ml', price: 5000, category: 'Bumbu Dapur', stock: 30, unit: 'pcs' },
  { name: 'Saus Tomat ABC 335ml', price: 12000, category: 'Bumbu Dapur', stock: 20, unit: 'pcs' },

  // Peralatan Mandi
  { name: 'Sabun Mandi Lifebuoy', price: 4000, category: 'Peralatan Mandi', stock: 30, unit: 'pcs' },
  { name: 'Sabun Mandi Dettol', price: 5000, category: 'Peralatan Mandi', stock: 25, unit: 'pcs' },
  { name: 'Shampoo Sachet', price: 1500, category: 'Peralatan Mandi', stock: 60, unit: 'pcs' },
  { name: 'Shampoo Clear 160ml', price: 18000, category: 'Peralatan Mandi', stock: 15, unit: 'pcs' },
  { name: 'Shampoo Pantene 160ml', price: 20000, category: 'Peralatan Mandi', stock: 15, unit: 'pcs' },
  { name: 'Pasta Gigi Pepsodent 120g', price: 10000, category: 'Peralatan Mandi', stock: 20, unit: 'pcs' },
  { name: 'Sikat Gigi Formula', price: 8000, category: 'Peralatan Mandi', stock: 20, unit: 'pcs' },
  { name: 'Deodoran Rexona Sachet', price: 3000, category: 'Peralatan Mandi', stock: 30, unit: 'pcs' },
  { name: 'Sabun Cuci Muka Pond\'s', price: 5000, category: 'Peralatan Mandi', stock: 20, unit: 'pcs' },

  // Pembersih
  { name: 'Sabun Cuci Piring Sunlight', price: 10000, category: 'Pembersih', stock: 20, unit: 'pcs' },
  { name: 'Deterjen Rinso 800g', price: 18000, category: 'Pembersih', stock: 20, unit: 'pcs' },
  { name: 'Deterjen Attack 800g', price: 20000, category: 'Pembersih', stock: 15, unit: 'pcs' },
  { name: 'Pewangi Molto Sachet', price: 1500, category: 'Pembersih', stock: 40, unit: 'pcs' },
  { name: 'Pembersih Lantai SoKlin', price: 12000, category: 'Pembersih', stock: 15, unit: 'pcs' },
  { name: 'Tissue Paseo 250 Sheet', price: 12000, category: 'Pembersih', stock: 15, unit: 'pcs' },
  { name: 'Pembalut Charm', price: 8000, category: 'Pembersih', stock: 20, unit: 'pcs' },
  { name: 'Sabun Colek Ekonomi', price: 3000, category: 'Pembersih', stock: 30, unit: 'pcs' },
  { name: 'Karbol Wipol 800ml', price: 14000, category: 'Pembersih', stock: 10, unit: 'pcs' },

  // Baking
  { name: 'Tepung Terigu Segitiga Biru 1kg', price: 13000, category: 'Baking', stock: 20, unit: 'pcs' },
  { name: 'Tepung Maizena 150g', price: 8000, category: 'Baking', stock: 15, unit: 'pcs' },
  { name: 'Tepung Beras 500g', price: 10000, category: 'Baking', stock: 15, unit: 'pcs' },
  { name: 'Baking Powder 45g', price: 5000, category: 'Baking', stock: 20, unit: 'pcs' },
  { name: 'Soda Kue 81g', price: 4000, category: 'Baking', stock: 20, unit: 'pcs' },
  { name: 'Vanili Bubuk 5g', price: 1500, category: 'Baking', stock: 30, unit: 'pcs' },
  { name: 'Coklat Bubuk 75g', price: 10000, category: 'Baking', stock: 15, unit: 'pcs' },
  { name: 'Mentega Blue Band 200g', price: 12000, category: 'Baking', stock: 15, unit: 'pcs' },
  { name: 'Susu Bubuk 27g', price: 3000, category: 'Baking', stock: 25, unit: 'pcs' },
  { name: 'Fermipan Ragi 11g', price: 4000, category: 'Baking', stock: 20, unit: 'pcs' },

  // Obat
  { name: 'Paracetamol Strip', price: 4000, category: 'Obat', stock: 30, unit: 'pcs' },
  { name: 'Bodrex', price: 3000, category: 'Obat', stock: 25, unit: 'pcs' },
  { name: 'Paramex', price: 3000, category: 'Obat', stock: 25, unit: 'pcs' },
  { name: 'Tolak Angin', price: 5000, category: 'Obat', stock: 20, unit: 'pcs' },
  { name: 'Promag', price: 3000, category: 'Obat', stock: 20, unit: 'pcs' },
  { name: 'Diapet', price: 5000, category: 'Obat', stock: 15, unit: 'pcs' },
  { name: 'Betadine 5ml', price: 8000, category: 'Obat', stock: 15, unit: 'pcs' },
  { name: 'Minyak Kayu Putih 30ml', price: 15000, category: 'Obat', stock: 15, unit: 'pcs' },
  { name: 'Hansaplast 10 Lembar', price: 6000, category: 'Obat', stock: 20, unit: 'pcs' },
  { name: 'Antangin', price: 4000, category: 'Obat', stock: 20, unit: 'pcs' },
];

let db = null;

/**
 * Open/initialize the IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Products store
      if (!database.objectStoreNames.contains('products')) {
        const productStore = database.createObjectStore('products', {
          keyPath: 'id',
          autoIncrement: true
        });
        productStore.createIndex('category', 'category', { unique: false });
        productStore.createIndex('name', 'name', { unique: false });
      }

      // Transactions store
      if (!database.objectStoreNames.contains('transactions')) {
        const txStore = database.createObjectStore('transactions', {
          keyPath: 'id',
          autoIncrement: true
        });
        txStore.createIndex('date', 'date', { unique: false });
      }

      // Debts store (added in v2)
      if (!database.objectStoreNames.contains('debts')) {
        const debtStore = database.createObjectStore('debts', {
          keyPath: 'id',
          autoIncrement: true
        });
        debtStore.createIndex('debtorName', 'debtorName', { unique: false });
        debtStore.createIndex('status', 'status', { unique: false });
        debtStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = async (event) => {
      db = event.target.result;
      // Seed default products if empty
      await seedDefaultProducts();
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Seed default products if the store is empty
 */
async function seedDefaultProducts() {
  const products = await getAllProducts();
  if (products.length === 0) {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    for (const product of DEFAULT_PRODUCTS) {
      store.add({ ...product, createdAt: new Date().toISOString() });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }
}

// ============================================
// PRODUCT CRUD Operations
// ============================================

function getAllProducts() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getProductsByCategory(category) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const index = store.index('category');
    const request = index.getAll(category);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getProductById(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function addProduct(product) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const request = store.add({
      ...product,
      createdAt: new Date().toISOString()
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function updateProduct(product) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const request = store.put(product);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

// ============================================
// TRANSACTION Operations
// ============================================

function addTransaction(transaction) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const request = store.add({
      ...transaction,
      date: new Date().toISOString()
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllTransactions() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by date descending (newest first)
      const results = request.result.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
      resolve(results);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

function getTransactionById(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function deleteTransaction(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

// ============================================
// DEBT Operations
// ============================================

function addDebt(debt) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('debts', 'readwrite');
    const store = tx.objectStore('debts');
    const request = store.add({
      ...debt,
      createdAt: new Date().toISOString()
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllDebts() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('debts', 'readonly');
    const store = tx.objectStore('debts');
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by date descending (newest first)
      const results = request.result.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      resolve(results);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

function getDebtById(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('debts', 'readonly');
    const store = tx.objectStore('debts');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function updateDebt(debt) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('debts', 'readwrite');
    const store = tx.objectStore('debts');
    const request = store.put(debt);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function deleteDebt(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('debts', 'readwrite');
    const store = tx.objectStore('debts');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function getDebtsByStatus(status) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('debts', 'readonly');
    const store = tx.objectStore('debts');
    const index = store.index('status');
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ============================================
// Utility: Format currency to Rupiah
// ============================================

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr));
}

function formatDateShort(dateStr) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateStr));
}

// ============================================
// Reset Database
// ============================================

/**
 * Confirm reset data (shows browser confirm dialog)
 */
function confirmResetData() {
  if (confirm('⚠️ RESET DATA\n\nSemua produk, riwayat transaksi, dan data hutang akan dihapus dan dikembalikan ke data awal.\n\nLanjutkan?')) {
    resetDatabase();
  }
}

/**
 * Reset the entire database and re-seed defaults
 */
async function resetDatabase() {
  try {
    // Close existing connection
    if (db) {
      db.close();
      db = null;
    }

    // Delete the database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
      request.onblocked = () => resolve(); // proceed even if blocked
    });

    // Re-open (will trigger onupgradeneeded + seed defaults)
    await openDB();

    // Clear cart
    cart = [];
    renderCart();

    // Refresh current page
    await switchPage(currentPage);

    showToast('Data berhasil direset! 🔄', 'success');
  } catch (err) {
    console.error('Reset error:', err);
    showToast('Gagal mereset data', 'error');
  }
}
