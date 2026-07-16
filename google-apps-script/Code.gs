/* ============================================
   KasKu - Kas Kelas IX C
   Google Apps Script (Backend)
   ============================================
   
   CARA PAKAI:
   1. Buka Google Sheets baru
   2. Klik Extensions > Apps Script
   3. Hapus semua kode default
   4. Copy-paste seluruh kode ini
   5. Klik Deploy > New Deployment
   6. Pilih type: Web App
   7. Execute as: Me
   8. Who has access: Anyone
   9. Klik Deploy dan copy URL-nya
   10. Paste URL ke config.js
   
   ============================================ */

// ── Konfigurasi ─────────────────────────────────
var DEFAULT_NOMINAL = 5000; // Nominal kas per minggu (Rp)

// ── Inisialisasi Sheet ──────────────────────────
function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Transaksi
  var transaksi = ss.getSheetByName('Transaksi');
  if (!transaksi) {
    transaksi = ss.insertSheet('Transaksi');
    transaksi.appendRow(['ID', 'Tanggal', 'Nama Anggota', 'Nominal', 'Keterangan', 'Tipe', 'Dicatat Oleh', 'Timestamp']);
    transaksi.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    transaksi.setColumnWidth(1, 80);
    transaksi.setColumnWidth(2, 120);
    transaksi.setColumnWidth(3, 180);
    transaksi.setColumnWidth(4, 120);
    transaksi.setColumnWidth(5, 200);
    transaksi.setColumnWidth(6, 100);
    transaksi.setColumnWidth(7, 150);
    transaksi.setColumnWidth(8, 180);
    transaksi.setFrozenRows(1);
  }
  
  // Sheet Anggota
  var anggota = ss.getSheetByName('Anggota');
  if (!anggota) {
    anggota = ss.insertSheet('Anggota');
    anggota.appendRow(['No', 'Nama', 'Status', 'Tanggal Ditambahkan']);
    anggota.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    anggota.setColumnWidth(1, 50);
    anggota.setColumnWidth(2, 250);
    anggota.setColumnWidth(3, 100);
    anggota.setColumnWidth(4, 180);
    anggota.setFrozenRows(1);
  }

  // Sheet Rekap
  var rekap = ss.getSheetByName('Rekap');
  if (!rekap) {
    rekap = ss.insertSheet('Rekap');
    rekap.appendRow(['Nama Anggota', 'Total Dibayar', 'Jumlah Pembayaran', 'Terakhir Bayar']);
    rekap.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    rekap.setColumnWidth(1, 250);
    rekap.setColumnWidth(2, 150);
    rekap.setColumnWidth(3, 150);
    rekap.setColumnWidth(4, 180);
    rekap.setFrozenRows(1);
  }
  
  // Hapus Sheet1 default jika ada
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  return { success: true, message: 'Sheets berhasil diinisialisasi!' };
}

// ── HTTP GET Handler ────────────────────────────
function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action;
    var result;
    
    switch(action) {
      case 'init':
        result = initSheets();
        break;
      case 'getTransactions':
        result = getTransactions(ss);
        break;
      case 'getMembers':
        result = getMembers(ss);
        break;
      case 'getSummary':
        result = getSummary(ss);
        break;
      case 'getRekap':
        result = getRekap(ss);
        break;
      default:
        result = { error: 'Aksi tidak dikenal: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ── HTTP POST Handler ───────────────────────────
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var result;
    
    switch(data.action) {
      case 'addTransaction':
        result = addTransaction(ss, data);
        break;
      case 'deleteTransaction':
        result = deleteTransaction(ss, data);
        break;
      case 'addMember':
        result = addMember(ss, data);
        break;
      case 'deleteMember':
        result = deleteMember(ss, data);
        break;
      case 'updateMember':
        result = updateMember(ss, data);
        break;
      default:
        result = { error: 'Aksi tidak dikenal: ' + data.action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ── Transaksi Functions ─────────────────────────

function getTransactions(ss) {
  var sheet = ss.getSheetByName('Transaksi');
  if (!sheet) return { success: false, error: 'Sheet Transaksi belum ada. Jalankan init dulu.' };
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, data: [] };
  
  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var transactions = data.map(function(row) {
    return {
      id: row[0],
      tanggal: row[1] ? Utilities.formatDate(new Date(row[1]), 'Asia/Jakarta', 'yyyy-MM-dd') : '',
      nama: row[2],
      nominal: row[3],
      keterangan: row[4],
      tipe: row[5],
      dicatatOleh: row[6],
      timestamp: row[7] ? Utilities.formatDate(new Date(row[7]), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss') : ''
    };
  });
  
  // Sort by timestamp descending (newest first)
  transactions.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  return { success: true, data: transactions };
}

function addTransaction(ss, data) {
  var sheet = ss.getSheetByName('Transaksi');
  if (!sheet) {
    initSheets();
    sheet = ss.getSheetByName('Transaksi');
  }
  
  var id = 'TRX-' + new Date().getTime();
  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  var tipe = data.tipe || 'Pemasukan';
  
  sheet.appendRow([
    id,
    data.tanggal,
    data.nama,
    Number(data.nominal),
    data.keterangan || 'Pembayaran Kas',
    tipe,
    data.dicatatOleh || 'Admin',
    timestamp
  ]);
  
  // Format nominal column as currency
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 4).setNumberFormat('#,##0');
  
  // Update rekap
  updateRekap(ss);
  
  return { 
    success: true, 
    message: 'Transaksi berhasil ditambahkan!',
    id: id
  };
}

function deleteTransaction(ss, data) {
  var sheet = ss.getSheetByName('Transaksi');
  if (!sheet) return { success: false, error: 'Sheet Transaksi tidak ditemukan' };
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: 'Tidak ada transaksi' };
  
  var allData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < allData.length; i++) {
    if (allData[i][0] === data.id) {
      sheet.deleteRow(i + 2);
      updateRekap(ss);
      return { success: true, message: 'Transaksi berhasil dihapus!' };
    }
  }
  
  return { success: false, error: 'Transaksi tidak ditemukan' };
}

// ── Anggota Functions ───────────────────────────

function getMembers(ss) {
  var sheet = ss.getSheetByName('Anggota');
  if (!sheet) return { success: false, error: 'Sheet Anggota belum ada. Jalankan init dulu.' };
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, data: [] };
  
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var members = data.map(function(row) {
    return {
      no: row[0],
      nama: row[1],
      status: row[2],
      tanggalDitambahkan: row[3] ? Utilities.formatDate(new Date(row[3]), 'Asia/Jakarta', 'yyyy-MM-dd') : ''
    };
  });
  
  return { success: true, data: members };
}

function addMember(ss, data) {
  var sheet = ss.getSheetByName('Anggota');
  if (!sheet) {
    initSheets();
    sheet = ss.getSheetByName('Anggota');
  }
  
  // Get next number
  var lastRow = sheet.getLastRow();
  var nextNo = lastRow <= 1 ? 1 : lastRow;
  
  // Check for duplicate name
  if (lastRow > 1) {
    var names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < names.length; i++) {
      if (names[i][0].toString().toLowerCase() === data.nama.toString().toLowerCase()) {
        return { success: false, error: 'Anggota dengan nama "' + data.nama + '" sudah ada!' };
      }
    }
    nextNo = lastRow;
  }
  
  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  
  sheet.appendRow([
    nextNo,
    data.nama,
    'Aktif',
    timestamp
  ]);
  
  return { 
    success: true, 
    message: 'Anggota "' + data.nama + '" berhasil ditambahkan!',
    no: nextNo
  };
}

function deleteMember(ss, data) {
  var sheet = ss.getSheetByName('Anggota');
  if (!sheet) return { success: false, error: 'Sheet Anggota tidak ditemukan' };
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: 'Tidak ada anggota' };
  
  var allData = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < allData.length; i++) {
    if (allData[i][0] === data.nama) {
      sheet.deleteRow(i + 2);
      // Re-number remaining members
      renumberMembers(sheet);
      return { success: true, message: 'Anggota berhasil dihapus!' };
    }
  }
  
  return { success: false, error: 'Anggota tidak ditemukan' };
}

function updateMember(ss, data) {
  var sheet = ss.getSheetByName('Anggota');
  if (!sheet) return { success: false, error: 'Sheet Anggota tidak ditemukan' };
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: 'Tidak ada anggota' };
  
  var allData = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < allData.length; i++) {
    if (allData[i][0] === data.namaLama) {
      if (data.namaBaru) sheet.getRange(i + 2, 2).setValue(data.namaBaru);
      if (data.status) sheet.getRange(i + 2, 3).setValue(data.status);
      return { success: true, message: 'Data anggota berhasil diperbarui!' };
    }
  }
  
  return { success: false, error: 'Anggota tidak ditemukan' };
}

function renumberMembers(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  for (var i = 2; i <= lastRow; i++) {
    sheet.getRange(i, 1).setValue(i - 1);
  }
}

// ── Rekap / Summary Functions ───────────────────

function getSummary(ss) {
  var transaksiSheet = ss.getSheetByName('Transaksi');
  var anggotaSheet = ss.getSheetByName('Anggota');
  
  if (!transaksiSheet || !anggotaSheet) {
    return { 
      success: true, 
      data: { 
        totalKas: 0, 
        totalPemasukan: 0,
        totalPengeluaran: 0,
        totalAnggota: 0, 
        totalTransaksi: 0,
        sudahBayarBulanIni: 0,
        belumBayarBulanIni: 0
      } 
    };
  }
  
  var now = new Date();
  var currentMonth = now.getMonth();
  var currentYear = now.getFullYear();
  
  // Get all transactions
  var lastRowT = transaksiSheet.getLastRow();
  var totalPemasukan = 0;
  var totalPengeluaran = 0;
  var paidThisMonth = {};
  
  if (lastRowT > 1) {
    var transactions = transaksiSheet.getRange(2, 1, lastRowT - 1, 8).getValues();
    transactions.forEach(function(row) {
      var nominal = Number(row[3]) || 0;
      var tipe = row[5] || 'Pemasukan';
      
      if (tipe === 'Pengeluaran') {
        totalPengeluaran += nominal;
      } else {
        totalPemasukan += nominal;
      }
      
      // Check if paid this month (only regular kas, not Pemasukan Lain)
      if (row[1] && tipe === 'Pemasukan') {
        var date = new Date(row[1]);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          paidThisMonth[row[2]] = true;
        }
      }
    });
  }
  
  // Get member count
  var lastRowA = anggotaSheet.getLastRow();
  var totalAnggota = lastRowA > 1 ? lastRowA - 1 : 0;
  var sudahBayar = Object.keys(paidThisMonth).length;
  
  return {
    success: true,
    data: {
      totalKas: totalPemasukan - totalPengeluaran,
      totalPemasukan: totalPemasukan,
      totalPengeluaran: totalPengeluaran,
      totalAnggota: totalAnggota,
      totalTransaksi: lastRowT > 1 ? lastRowT - 1 : 0,
      sudahBayarBulanIni: sudahBayar,
      belumBayarBulanIni: totalAnggota - sudahBayar
    }
  };
}

function getRekap(ss) {
  var transaksiSheet = ss.getSheetByName('Transaksi');
  var anggotaSheet = ss.getSheetByName('Anggota');
  
  if (!transaksiSheet || !anggotaSheet) {
    return { success: true, data: [] };
  }
  
  var lastRowA = anggotaSheet.getLastRow();
  if (lastRowA <= 1) return { success: true, data: [] };
  
  var members = anggotaSheet.getRange(2, 2, lastRowA - 1, 1).getValues();
  var rekapData = {};
  
  // Init rekap for all members
  members.forEach(function(row) {
    rekapData[row[0]] = {
      nama: row[0],
      totalDibayar: 0,
      jumlahPembayaran: 0,
      terakhirBayar: '-'
    };
  });
  
  // Calculate from transactions
  var lastRowT = transaksiSheet.getLastRow();
  if (lastRowT > 1) {
    var transactions = transaksiSheet.getRange(2, 1, lastRowT - 1, 8).getValues();
    transactions.forEach(function(row) {
      var nama = row[2];
      var tipe = row[5] || 'Pemasukan';
      if (rekapData[nama] && tipe !== 'Pengeluaran') {
        rekapData[nama].totalDibayar += Number(row[3]) || 0;
        // jumlah minggu dihitung dari total dibayar
        var tanggal = row[1] ? Utilities.formatDate(new Date(row[1]), 'Asia/Jakarta', 'yyyy-MM-dd') : '-';
        if (tanggal !== '-') {
          if (rekapData[nama].terakhirBayar === '-' || tanggal > rekapData[nama].terakhirBayar) {
            rekapData[nama].terakhirBayar = tanggal;
          }
        }
      }
    });
  }
  
  // Hitung jumlah minggu dari total dibayar
  var result = Object.values(rekapData).map(function(item) {
    item.jumlahPembayaran = Math.floor(item.totalDibayar / DEFAULT_NOMINAL);
    return item;
  });
  
  return { success: true, data: result };
}

function updateRekap(ss) {
  var rekapSheet = ss.getSheetByName('Rekap');
  if (!rekapSheet) return;
  
  var rekapResult = getRekap(ss);
  if (!rekapResult.success || rekapResult.data.length === 0) return;
  
  // Clear existing data (keep header)
  var lastRow = rekapSheet.getLastRow();
  if (lastRow > 1) {
    rekapSheet.getRange(2, 1, lastRow - 1, 4).clearContent();
  }
  
  // Write new data
  rekapResult.data.forEach(function(item, index) {
    rekapSheet.getRange(index + 2, 1, 1, 4).setValues([[
      item.nama,
      item.totalDibayar,
      item.jumlahPembayaran,
      item.terakhirBayar
    ]]);
  });
  
  // Format currency
  var newLastRow = rekapSheet.getLastRow();
  if (newLastRow > 1) {
    rekapSheet.getRange(2, 2, newLastRow - 1, 1).setNumberFormat('#,##0');
  }
}

// ── Test Function (Run dari Apps Script Editor) ─
function testInit() {
  var result = initSheets();
  Logger.log(result);
}
