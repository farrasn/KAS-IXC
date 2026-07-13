/* ============================================
   KasKu - Kas Kelas IX C
   Application Logic
   ============================================ */

// ── State ─────────────────────────────────────
const state = {
  currentUser: null,
  currentView: 'dashboard',
  transactions: [],
  members: [],
  rekap: [],
  summary: null,
  isConnected: false
};

// ── Initialize ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  const qfDate = document.getElementById('qfDate');
  const pgDate = document.getElementById('pgDate');
  if (qfDate) qfDate.value = today;
  if (pgDate) pgDate.value = today;

  // Set default nominal
  const qfNominal = document.getElementById('qfNominal');
  if (qfNominal) qfNominal.value = CONFIG.DEFAULT_NOMINAL;

  // Setup event listeners
  setupEventListeners();

  // Check connection & load data
  checkConnection();
  showApp();
}

// ── Event Listeners ───────────────────────────
function setupEventListeners() {
  // Quick add form
  document.getElementById('quickAddForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleQuickAdd();
  });

  // Pengeluaran form
  document.getElementById('pengeluaranForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handlePengeluaran();
  });

  // Search inputs
  document.getElementById('searchTransaksi').addEventListener('input', (e) => {
    renderAllTransactions(e.target.value, document.getElementById('filterTipe').value);
  });

  document.getElementById('filterTipe').addEventListener('change', (e) => {
    renderAllTransactions(document.getElementById('searchTransaksi').value, e.target.value);
  });

  document.getElementById('searchAnggota').addEventListener('input', (e) => {
    renderMembers(e.target.value);
  });

  document.getElementById('searchRekap').addEventListener('input', (e) => {
    renderRekap(e.target.value);
  });

  // Add member on Enter
  document.getElementById('newMemberName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  });

  // Mobile sidebar
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
}

// ============================================
// APP INIT
// ============================================

function showApp() {
  // Check if Google Sheets URL is configured
  if (!CONFIG.GOOGLE_SCRIPT_URL || CONFIG.GOOGLE_SCRIPT_URL === '') {
    document.getElementById('configAlert').classList.remove('hidden');
    updateConnectionStatus(false);
  } else {
    document.getElementById('configAlert').classList.add('hidden');
  }

  // Load data
  refreshData();
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(view) {
  state.currentView = view;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Update view sections
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.add('active');

  // Update header
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Ringkasan kas kelas' },
    transaksi: { title: 'Transaksi', subtitle: 'Riwayat semua transaksi' },
    anggota: { title: 'Anggota', subtitle: 'Kelola anggota kelas' },
    rekap: { title: 'Rekap', subtitle: 'Rekap pembayaran per anggota' },
    pengeluaran: { title: 'Pengeluaran', subtitle: 'Catat pengeluaran kas' }
  };

  const t = titles[view] || { title: 'KasKu', subtitle: '' };
  document.getElementById('viewTitle').textContent = t.title;
  document.getElementById('viewSubtitle').textContent = t.subtitle;

  // Close mobile sidebar
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============================================
// DATA - Google Sheets API
// ============================================

async function apiGet(action) {
  if (!CONFIG.GOOGLE_SCRIPT_URL) {
    return { success: false, error: 'Google Sheets URL belum dikonfigurasi' };
  }

  try {
    const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=${action}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('API GET Error:', err);
    return { success: false, error: err.message };
  }
}

async function apiPost(payload) {
  if (!CONFIG.GOOGLE_SCRIPT_URL) {
    return { success: false, error: 'Google Sheets URL belum dikonfigurasi' };
  }

  try {
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('API POST Error:', err);
    return { success: false, error: err.message };
  }
}

async function checkConnection() {
  if (!CONFIG.GOOGLE_SCRIPT_URL) {
    updateConnectionStatus(false);
    return;
  }

  try {
    const result = await apiGet('getSummary');
    updateConnectionStatus(result.success === true);
  } catch {
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(isConnected) {
  state.isConnected = isConnected;
  const statusEl = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  
  if (isConnected) {
    statusEl.className = 'connection-status online';
    textEl.textContent = 'Terhubung';
  } else {
    statusEl.className = 'connection-status offline';
    textEl.textContent = 'Offline';
  }
}

// ── Data Loading ──────────────────────────────

async function refreshData() {
  if (!CONFIG.GOOGLE_SCRIPT_URL) return;

  showLoading('Memuat data dari Google Sheets...');

  try {
    // Fetch all data in parallel
    const [summaryRes, transRes, membersRes, rekapRes] = await Promise.all([
      apiGet('getSummary'),
      apiGet('getTransactions'),
      apiGet('getMembers'),
      apiGet('getRekap')
    ]);

    if (summaryRes.success) {
      state.summary = summaryRes.data;
      renderSummary();
    }

    if (transRes.success) {
      state.transactions = transRes.data || [];
      renderRecentTransactions();
      renderAllTransactions();
      renderPengeluaran();
    }

    if (membersRes.success) {
      state.members = membersRes.data || [];
      renderMembers();
      populateMemberSelect();
      document.getElementById('memberCount').textContent = state.members.length;
    }

    if (rekapRes.success) {
      state.rekap = rekapRes.data || [];
      renderRekap();
    }

    updateConnectionStatus(true);
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Gagal memuat data: ' + err.message, 'error');
    updateConnectionStatus(false);
  } finally {
    hideLoading();
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderSummary() {
  const s = state.summary;
  if (!s) return;

  document.getElementById('statTotalKas').textContent = formatCurrency(s.totalKas);
  document.getElementById('statSudahBayar').textContent = s.sudahBayarBulanIni;
  document.getElementById('statBelumBayar').textContent = s.belumBayarBulanIni;
  document.getElementById('statTotalAnggota').textContent = s.totalAnggota;
}

function renderRecentTransactions() {
  const tbody = document.getElementById('recentTransactions');
  const recent = state.transactions.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="table-empty">
          <div class="table-empty-icon">—</div>
          <p>Belum ada transaksi</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = recent.map(t => `
    <tr>
      <td>${formatDateDisplay(t.tanggal)}</td>
      <td>${escapeHtml(t.nama)}</td>
      <td>
        <span class="nominal ${t.tipe === 'Pengeluaran' ? 'negative' : 'positive'}">
          ${t.tipe === 'Pengeluaran' ? '-' : '+'}${formatCurrency(t.nominal)}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderAllTransactions(searchQuery = '', filterTipe = '') {
  const tbody = document.getElementById('allTransactions');
  let filtered = [...state.transactions];

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.nama.toLowerCase().includes(q) || 
      t.keterangan.toLowerCase().includes(q) ||
      t.dicatatOleh.toLowerCase().includes(q)
    );
  }

  // Filter by type
  if (filterTipe) {
    filtered = filtered.filter(t => t.tipe === filterTipe);
  }

  // Update count
  document.getElementById('totalTransaksiCount').textContent = `${filtered.length} transaksi`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          <div class="table-empty-icon">—</div>
          <p>${searchQuery || filterTipe ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td>${formatDateDisplay(t.tanggal)}</td>
      <td>${escapeHtml(t.nama)}</td>
      <td><span class="badge ${t.tipe === 'Pengeluaran' ? 'badge-error' : 'badge-success'}">${t.tipe}</span></td>
      <td>
        <span class="nominal ${t.tipe === 'Pengeluaran' ? 'negative' : 'positive'}">
          ${t.tipe === 'Pengeluaran' ? '-' : '+'}${formatCurrency(t.nominal)}
        </span>
      </td>
      <td style="color:var(--text-secondary)">${escapeHtml(t.keterangan || '-')}</td>
      <td style="color:var(--text-secondary)">${escapeHtml(t.dicatatOleh)}</td>
      <td>
        <button class="member-action-btn delete" onclick="confirmDeleteTransaction('${t.id}')" title="Hapus">×</button>
      </td>
    </tr>
  `).join('');
}

function renderPengeluaran() {
  const tbody = document.getElementById('pengeluaranTable');
  const pengeluaran = state.transactions.filter(t => t.tipe === 'Pengeluaran');

  if (pengeluaran.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <div class="table-empty-icon">—</div>
          <p>Belum ada pengeluaran</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = pengeluaran.map(t => `
    <tr>
      <td>${formatDateDisplay(t.tanggal)}</td>
      <td><span class="nominal negative">-${formatCurrency(t.nominal)}</span></td>
      <td style="color:var(--text-secondary)">${escapeHtml(t.keterangan || '-')}</td>
      <td style="color:var(--text-secondary)">${escapeHtml(t.dicatatOleh)}</td>
      <td>
        <button class="member-action-btn delete" onclick="confirmDeleteTransaction('${t.id}')" title="Hapus">×</button>
      </td>
    </tr>
  `).join('');
}

function renderMembers(searchQuery = '') {
  const grid = document.getElementById('membersGrid');
  let filtered = [...state.members];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m => m.nama.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">—</div>
        <h3>${searchQuery ? 'Tidak ditemukan' : 'Belum ada anggota'}</h3>
        <p>${searchQuery ? 'Coba kata kunci lain' : 'Tambahkan anggota kelas menggunakan form di atas'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((m, i) => `
    <div class="member-card" style="animation-delay: ${i * 0.03}s">
      <div class="member-avatar">${getInitials(m.nama)}</div>
      <div class="member-info">
        <div class="member-name">${escapeHtml(m.nama)}</div>
        <div class="member-meta">No. ${m.no} · ${m.status}</div>
      </div>
      <div class="member-actions">
        <button class="member-action-btn delete" onclick="confirmDeleteMember('${escapeHtml(m.nama)}')" title="Hapus">×</button>
      </div>
    </div>
  `).join('');
}

function renderRekap(searchQuery = '') {
  const tbody = document.getElementById('rekapTable');
  let filtered = [...state.rekap];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => r.nama.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="table-empty">
          <div class="table-empty-icon">—</div>
          <p>${searchQuery ? 'Tidak ditemukan' : 'Belum ada data rekap'}</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="member-avatar" style="width:32px; height:32px; font-size:12px;">${getInitials(r.nama)}</div>
          ${escapeHtml(r.nama)}
        </div>
      </td>
      <td><span class="nominal positive">${formatCurrency(r.totalDibayar)}</span></td>
      <td><span class="badge badge-neutral">${r.jumlahPembayaran}x</span></td>
      <td style="color:var(--text-secondary)">${r.terakhirBayar === '-' ? '-' : formatDateDisplay(r.terakhirBayar)}</td>
    </tr>
  `).join('');
}

function populateMemberSelect() {
  const select = document.getElementById('qfMember');
  const currentValue = select.value;

  // Keep the placeholder option
  select.innerHTML = '<option value="">— Pilih Anggota —</option>';

  state.members.forEach(m => {
    const option = document.createElement('option');
    option.value = m.nama;
    option.textContent = m.nama;
    select.appendChild(option);
  });

  // Restore selection if possible
  if (currentValue) select.value = currentValue;
}

// ============================================
// ACTIONS
// ============================================

async function handleQuickAdd() {
  const member = document.getElementById('qfMember').value;
  const nominal = document.getElementById('qfNominal').value;
  const date = document.getElementById('qfDate').value;
  const note = document.getElementById('qfNote').value;

  if (!member) {
    showToast('Pilih anggota terlebih dahulu!', 'error');
    return;
  }
  if (!nominal || Number(nominal) <= 0) {
    showToast('Nominal harus lebih dari 0!', 'error');
    return;
  }
  if (!date) {
    showToast('Pilih tanggal terlebih dahulu!', 'error');
    return;
  }

  showLoading('Menyimpan pembayaran...');

  const result = await apiPost({
    action: 'addTransaction',
    nama: member,
    nominal: Number(nominal),
    tanggal: date,
    keterangan: note || 'Pembayaran Kas',
    tipe: 'Pemasukan',
    dicatatOleh: 'Pengurus'
  });

  hideLoading();

  if (result.success) {
    showToast(`Pembayaran ${member} berhasil disimpan!`, 'success');
    // Reset form
    document.getElementById('qfMember').value = '';
    document.getElementById('qfNote').value = '';
    document.getElementById('qfNominal').value = CONFIG.DEFAULT_NOMINAL;
    // Refresh data
    refreshData();
  } else {
    showToast('Gagal menyimpan: ' + (result.error || 'Unknown error'), 'error');
  }
}

async function handlePengeluaran() {
  const nominal = document.getElementById('pgNominal').value;
  const date = document.getElementById('pgDate').value;
  const note = document.getElementById('pgNote').value;

  if (!nominal || Number(nominal) <= 0) {
    showToast('Nominal harus lebih dari 0!', 'error');
    return;
  }
  if (!date) {
    showToast('Pilih tanggal!', 'error');
    return;
  }
  if (!note) {
    showToast('Isi keterangan pengeluaran!', 'error');
    return;
  }

  showLoading('Menyimpan pengeluaran...');

  const result = await apiPost({
    action: 'addTransaction',
    nama: 'Pengeluaran',
    nominal: Number(nominal),
    tanggal: date,
    keterangan: note,
    tipe: 'Pengeluaran',
    dicatatOleh: 'Pengurus'
  });

  hideLoading();

  if (result.success) {
    showToast('Pengeluaran berhasil dicatat!', 'success');
    document.getElementById('pgNominal').value = '';
    document.getElementById('pgNote').value = '';
    refreshData();
  } else {
    showToast('Gagal menyimpan: ' + (result.error || 'Unknown error'), 'error');
  }
}

async function addMember() {
  const input = document.getElementById('newMemberName');
  const name = input.value.trim();

  if (!name) {
    showToast('Masukkan nama anggota!', 'error');
    input.focus();
    return;
  }

  const btn = document.getElementById('addMemberBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Menambahkan...';

  const result = await apiPost({
    action: 'addMember',
    nama: name
  });

  btn.disabled = false;
  btn.textContent = '➕ Tambah';

  if (result.success) {
    showToast(`Anggota "${name}" berhasil ditambahkan!`, 'success');
    input.value = '';
    input.focus();
    refreshData();
  } else {
    showToast(result.error || 'Gagal menambahkan anggota', 'error');
  }
}

function confirmDeleteMember(nama) {
  showConfirm(
    'Hapus Anggota',
    `Apakah Anda yakin ingin menghapus anggota "${nama}"?`,
    async () => {
      showLoading('Menghapus anggota...');
      const result = await apiPost({
        action: 'deleteMember',
        nama: nama
      });
      hideLoading();

      if (result.success) {
        showToast('Anggota berhasil dihapus!', 'success');
        refreshData();
      } else {
        showToast(result.error || 'Gagal menghapus anggota', 'error');
      }
    }
  );
}

function confirmDeleteTransaction(id) {
  showConfirm(
    'Hapus Transaksi',
    'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak bisa dibatalkan.',
    async () => {
      showLoading('Menghapus transaksi...');
      const result = await apiPost({
        action: 'deleteTransaction',
        id: id
      });
      hideLoading();

      if (result.success) {
        showToast('Transaksi berhasil dihapus!', 'success');
        refreshData();
      } else {
        showToast(result.error || 'Gagal menghapus transaksi', 'error');
      }
    }
  );
}

// ============================================
// UI UTILITIES
// ============================================

// ── Toast Notifications ───────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✓', error: '×', info: '•' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Loading Overlay ───────────────────────────
function showLoading(text = 'Memuat data...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// ── Confirm Modal ─────────────────────────────
function showConfirm(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').classList.add('active');

  const confirmBtn = document.getElementById('confirmAction');
  // Clone to remove old listeners
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

  newBtn.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

// ── Formatting ────────────────────────────────
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return 'Rp' + num.toLocaleString('id-ID');
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Keyboard shortcut: Escape to close modals ─
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeSidebar();
  }
});
