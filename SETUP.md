# 📖 Panduan Setup KasKu - Kas Kelas IX C

Panduan langkah demi langkah untuk menghubungkan website KasKu dengan Google Sheets.

---

## Langkah 1: Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **"+ Blank"** untuk membuat spreadsheet baru
3. Beri nama spreadsheet: **"Kas Kelas IX C"**
4. **Jangan tutup tab ini**, kita akan kembali lagi nanti

---

## Langkah 2: Buat Google Apps Script

1. Di spreadsheet yang baru dibuat, klik menu **Extensions** → **Apps Script**
2. Akan terbuka editor Apps Script di tab baru
3. **Hapus semua kode** yang ada (biasanya ada `function myFunction()`)
4. Buka file `google-apps-script/Code.gs` dari project ini
5. **Copy seluruh isi** file `Code.gs`
6. **Paste** ke editor Apps Script (gantikan kode yang sudah dihapus)
7. Klik **💾 Save** (Ctrl+S)

---

## Langkah 3: Inisialisasi Sheet

1. Di editor Apps Script, klik dropdown di sebelah tombol **Run** (▶️)
2. Pilih fungsi **`testInit`**
3. Klik **Run** (▶️)
4. Jika diminta **Review permissions**, klik **Review permissions**
5. Pilih akun Google Anda
6. Klik **Advanced** → **Go to [nama project] (unsafe)**
7. Klik **Allow**
8. Tunggu sampai muncul log **"Sheets berhasil diinisialisasi!"**
9. Kembali ke Google Sheets, seharusnya sudah ada 3 sheet:
   - **Transaksi**
   - **Anggota**
   - **Rekap**

---

## Langkah 4: Deploy sebagai Web App

1. Di editor Apps Script, klik **Deploy** → **New deployment**
2. Klik ikon ⚙️ (gear) → pilih **Web app**
3. Isi pengaturan:
   - **Description**: `KasKu API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. Klik **Authorize access** jika diminta
6. **COPY URL** yang muncul (format: `https://script.google.com/macros/s/.../exec`)
7. Klik **Done**

---

## Langkah 5: Hubungkan Website dengan Google Sheets

1. Buka file **`config.js`** di project ini
2. Cari baris:
   ```javascript
   GOOGLE_SCRIPT_URL: '',
   ```
3. Paste URL yang sudah di-copy tadi:
   ```javascript
   GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/ABCDEF.../exec',
   ```
4. **Save** file `config.js`
5. Buka/refresh `index.html` di browser
6. Status koneksi di kanan atas seharusnya berubah jadi **"Terhubung"** (hijau) ✅

---

## Langkah 6: Test

1. Login dengan salah satu akun pengurus (lihat tabel di bawah)
2. Tambahkan anggota kelas di menu **Anggota**
3. Catat pembayaran kas di **Dashboard**
4. Cek Google Sheets — data seharusnya otomatis masuk! 🎉

---

## Akun Pengurus Kelas

| Username | Password | Role |
|----------|----------|------|
| `ketua` | `ketua123` | Ketua |
| `wakil` | `wakil123` | Wakil Ketua |
| `sekretaris1` | `sekre1_123` | Sekretaris 1 |
| `sekretaris2` | `sekre2_123` | Sekretaris 2 |
| `bendahara1` | `bendahara1_123` | Bendahara 1 |
| `bendahara2` | `bendahara2_123` | Bendahara 2 |

> **Cara ganti password**: Edit array `USERS` di file `config.js`

---

## Update Google Apps Script

Jika Anda mengubah kode di `Code.gs`, Anda perlu deploy ulang:

1. Di Apps Script, klik **Deploy** → **Manage deployments**
2. Klik ikon ✏️ (edit) pada deployment yang ada
3. Ubah **Version** ke **New version**
4. Klik **Deploy**
5. URL tetap sama, tidak perlu update `config.js`

---

## Troubleshooting

### ❌ Status "Offline"
- Pastikan `GOOGLE_SCRIPT_URL` di `config.js` sudah benar
- Pastikan Apps Script sudah di-deploy sebagai Web App
- Pastikan **Who has access** diset ke **Anyone**

### ❌ Error "Permission denied"
- Jalankan ulang `testInit` di Apps Script editor
- Authorize permissions sekali lagi

### ❌ Data tidak muncul di Google Sheets
- Refresh spreadsheet
- Pastikan sheet **Transaksi**, **Anggota**, dan **Rekap** sudah ada
- Coba jalankan fungsi `testInit` lagi

### ❌ CORS Error di browser console
- Ini normal untuk beberapa browser. Coba buka website melalui local server
- Atau gunakan browser yang berbeda

---

## Tips

- 💡 Bookmark halaman `index.html` di HP untuk akses cepat
- 💡 Nominal kas default bisa diubah di `config.js` → `DEFAULT_NOMINAL`
- 💡 Website ini bisa di-host gratis di **GitHub Pages** atau **Netlify**
- 💡 Google Sheets bisa diakses oleh semua pengurus untuk melihat data mentah
