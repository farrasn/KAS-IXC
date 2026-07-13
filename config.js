/* ============================================
   KONFIGURASI KAS KELAS IX C
   ============================================
   Ubah pengaturan di bawah sesuai kebutuhan.
   ============================================ */

const CONFIG = {
  // ── Info Kelas ──────────────────────────────
  APP_NAME: 'Kas IX C',
  CLASS_NAME: 'Kelas IX C',
  SCHOOL_NAME: 'SMP',
  ACADEMIC_YEAR: '2025/2026',

  // ── Nominal Kas Default (Rp) ────────────────
  // Ubah angka ini jika nominal kas berubah
  DEFAULT_NOMINAL: 3000,

  // ── Google Apps Script URL ──────────────────
  // Paste URL Google Apps Script Web App di sini
  // Lihat SETUP.md untuk panduan lengkap
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbykbRxDlMr9X80dTqOitk4wmE1uoL519vOjrAaqQxYT1YlcwYyF3FprJSBtAOkcy6YELg/exec',

  // ── Akun Pengurus Kelas ─────────────────────
  // Ubah password sesuai keinginan
  USERS: [
    {
      username: 'ketua',
      password: 'ketua123',
      role: 'Ketua',
      name: 'Ketua Kelas'
    },
    {
      username: 'wakil',
      password: 'wakil123',
      role: 'Wakil Ketua',
      name: 'Wakil Ketua'
    },
    {
      username: 'sekretaris1',
      password: 'sekre1_123',
      role: 'Sekretaris 1',
      name: 'Sekretaris 1'
    },
    {
      username: 'sekretaris2',
      password: 'sekre2_123',
      role: 'Sekretaris 2',
      name: 'Sekretaris 2'
    },
    {
      username: 'bendahara1',
      password: 'bendahara1_123',
      role: 'Bendahara 1',
      name: 'Bendahara 1'
    },
    {
      username: 'bendahara2',
      password: 'bendahara2_123',
      role: 'Bendahara 2',
      name: 'Bendahara 2'
    }
  ]
};
