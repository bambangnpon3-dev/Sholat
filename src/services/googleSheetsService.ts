import { AttendanceRecord, Student } from '../types';

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  spreadsheetId?: string;
}

export const APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script untuk Absensi Sholat Santri Masjid DKI Jakarta
 * Pasang di: Ekstensi > Apps Script pada Google Spreadsheet Anda
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data Absensi") || ss.getActiveSheet();
    
    // Jika sheet masih kosong, buat Header Kolom
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID Presensi", "Tanggal", "Jam", "No RFID UID", "Nama Santri", 
        "Nama Masjid", "Waktu Sholat", "Wudhu (Poin)", 
        "Sunnah Qobliyah (Poin)", "Sholat Wajib (Poin)", "Sunnah Ba'diyah (Poin)", 
        "Dzikir dan Doa (Poin)", "Total Poin", "Verifikasi Oleh", "Catatan"
      ]);
      sheet.getRange(1, 1, 1, 15).setBackground("#0F9D58").setFontColor("#FFFFFF").setFontWeight("bold");
    }

    var data = JSON.parse(e.postData.contents);
    var qobliyahPts = data.pointsSunnahQobliyah !== undefined ? data.pointsSunnahQobliyah : (data.prayerType === 'Subuh' ? (data.pointsSholatSunah || 0) : Math.min(5, data.pointsSholatSunah || 0));
    var badiyahPts = data.pointsSunnahBadiyah !== undefined ? data.pointsSunnahBadiyah : (data.prayerType === 'Subuh' || data.prayerType === 'Ashar' ? 0 : Math.max(0, (data.pointsSholatSunah || 0) - 5));

    // Tambahkan baris data presensi baru
    sheet.appendRow([
      data.id || Utilities.getUuid(),
      data.date,
      data.time,
      "'" + data.rfidCardUid,
      data.studentName,
      data.halaqah,
      data.prayerType,
      data.pointsWudhu,
      qobliyahPts,
      data.pointsSholatWajib,
      badiyahPts,
      data.bonusAdab,
      data.totalPoints,
      data.verifiedBy,
      data.notes || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil dicatat ke Google Spreadsheet!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Google Sheets API Absensi Masjid Aktif!").setMimeType(ContentService.MimeType.TEXT);
}
`;

export async function syncRecordToGoogleSheet(record: AttendanceRecord, webhookUrl: string): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script handles text/plain best to avoid CORS preflight blocks
      },
      body: JSON.stringify(record),
      mode: 'no-cors' // Allows browser to post to Google script Web App without CORS rejection
    });
    return true;
  } catch (err) {
    console.error('Failed to sync to Google Spreadsheet Webhook:', err);
    return false;
  }
}

export function exportAttendanceToCSV(records: AttendanceRecord[]): void {
  const headers = [
    'ID Presensi',
    'Tanggal',
    'Jam',
    'No RFID UID',
    'Nama Santri',
    'Nama Masjid',
    'Waktu Sholat',
    'Kualitas Wudhu',
    'Poin Wudhu',
    'Sunnah Qobliyah',
    'Poin Qobliyah',
    'Kualitas Sholat Wajib',
    'Poin Sholat Wajib',
    'Sunnah Ba\'diyah',
    'Poin Ba\'diyah',
    'Dzikir dan Doa',
    'Total Poin',
    'Verifikasi Oleh',
    'Catatan'
  ];

  const rows = records.map(r => {
    const qobliyahQuality = r.sholatSunahQobliyahQuality || (r.sholatSunahQuality === 'tidak' ? 'tidak' : 'qobliyah');
    const qobliyahPts = r.pointsSunnahQobliyah !== undefined ? r.pointsSunnahQobliyah : (r.prayerType === 'Subuh' ? (r.pointsSholatSunah || 0) : Math.min(5, r.pointsSholatSunah || 0));
    const badiyahQuality = r.sholatSunahBadiyahQuality || (r.prayerType === 'Subuh' || r.prayerType === 'Ashar' || r.sholatSunahQuality === 'tidak' ? 'tidak' : 'badiyah');
    const badiyahPts = r.pointsSunnahBadiyah !== undefined ? r.pointsSunnahBadiyah : (r.prayerType === 'Subuh' || r.prayerType === 'Ashar' ? 0 : Math.max(0, (r.pointsSholatSunah || 0) - 5));

    return [
      r.id,
      r.date,
      r.time,
      `'${r.rfidCardUid}`, // prefix single quote so spreadsheet preserves leading zeroes
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.halaqah}"`,
      r.prayerType,
      r.wudhuQuality,
      r.pointsWudhu,
      qobliyahQuality,
      qobliyahPts,
      r.sholatWajibQuality,
      r.pointsSholatWajib,
      badiyahQuality,
      badiyahPts,
      r.bonusAdab,
      r.totalPoints,
      `"${r.verifiedBy}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Absensi_Sholat_Santri_DKI_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStudentsToCSV(students: Student[]): void {
  const headers = [
    'ID Santri',
    'No Kartu RFID',
    'Nama Lengkap',
    'Nama Panggilan',
    'Jenis Kelamin',
    'Usia (Tahun)',
    'Nama Orang Tua / Wali',
    'No HP / WA Wali',
    'Nama Masjid',
    'Status Kegiatan',
    'Keterangan Status',
    'Total Poin',
    'Total Hadir',
    'Streak Hari',
    'Peringkat Bintang'
  ];

  const rows = students.map(s => [
    s.id,
    `'${s.rfidCardUid}`,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.nickname}"`,
    s.gender === 'L' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)',
    s.age !== undefined && s.age !== null ? s.age : '',
    `"${(s.parentName || '').replace(/"/g, '""')}"`,
    `'${s.parentPhone || ''}`,
    `"${s.halaqah}"`,
    s.isActive === false ? 'Non-Aktif' : 'Aktif',
    `"${(s.inactivationReason || '').replace(/"/g, '""')}"`,
    s.totalPoints,
    s.totalAttendances,
    s.streakDays,
    `"${s.starBadge}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Master_Santri_RFID_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
