import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Send, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Download
} from 'lucide-react';
import { APPS_SCRIPT_TEMPLATE } from '../../services/googleSheetsService';
import { AttendanceRecord } from '../../types';

interface Props {
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
  latestRecord?: AttendanceRecord;
  onExportCSV: () => void;
}

export const GoogleSheetsIntegrationView: React.FC<Props> = ({
  webhookUrl,
  onSaveWebhookUrl,
  latestRecord,
  onExportCSV,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(webhookUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    onSaveWebhookUrl(inputUrl.trim());
    alert('URL Webhook Google Sheets berhasil disimpan!');
  };

  const handleTestPing = async () => {
    if (!inputUrl || !inputUrl.startsWith('http')) {
      alert('Masukkan URL Google Apps Script Web App terlebih dahulu.');
      return;
    }

    setTestStatus('testing');
    try {
      // Send a dummy test record
      const testPayload = {
        id: 'test-ping-01',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString('id-ID'),
        rfidCardUid: '0964561466',
        studentName: 'AFNA (Uji Koneksi)',
        halaqah: 'Masjid Baitul Faqih',
        prayerType: 'Maghrib',
        pointsWudhu: 5,
        pointsSholatWajib: 10,
        pointsSholatSunah: 5,
        bonusAdab: 5,
        totalPoints: 25,
        verifiedBy: 'Sistem Uji Koneksi'
      };

      await fetch(inputUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload),
        mode: 'no-cors'
      });

      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } catch {
      setTestStatus('failed');
      setTimeout(() => setTestStatus('idle'), 4000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-6 select-text">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Integrasi Resmi Google Sheets
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
          Panduan Sinkronisasi Realtime Google Spreadsheet DKM Masjid
        </h2>
        <p className="text-xs md:text-sm text-slate-600 mt-0.5">
          Hubungkan mesin absensi RFID dan aplikasi ini langsung ke Google Spreadsheet milik DKM Masjid tanpa ribet, bebas biaya API, dan langsung update setiap santri tap kartu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Setup steps & Webhook URL input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Buat Spreadsheet & Salin Skrip
            </h3>
            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>
                Buka tab baru: <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a>
              </li>
              <li>
                Pada menu atas Google Sheets, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
              </li>
              <li>
                Hapus semua kode bawaan, lalu <strong>Tempel (Paste)</strong> kode Apps Script di sebelah kanan.
              </li>
              <li>
                Klik tombol <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong>.
              </li>
              <li>
                Pilih jenis: <strong>Aplikasi Web (Web App)</strong>.
              </li>
              <li>
                Ubah Akses (Who has access) menjadi: <strong className="text-emerald-800">Siapa Saja (Anyone)</strong>.
              </li>
              <li>
                Salin <strong>URL Aplikasi Web</strong> yang dihasilkan dan tempel pada form di bawah.
              </li>
            </ol>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Masukkan Webhook URL Google Sheets
            </h3>
            
            <div className="space-y-3">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono focus:border-emerald-500 shadow-2xs"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  Simpan Webhook URL
                </button>

                <button
                  onClick={handleTestPing}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testStatus === 'testing' ? 'Menguji...' : 'Uji Kirim Data'}</span>
                </button>
              </div>

              {testStatus === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sukses! Data uji berhasil dikirim ke Google Spreadsheet Anda.</span>
                </div>
              )}

              {testStatus === 'failed' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Gagal mengirim. Pastikan hak akses Web App diatur ke 'Anyone'.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick CSV Export */}
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-950 text-xs mb-1">
              Atau Impor Manual via CSV
            </h4>
            <p className="text-xs text-emerald-800 mb-3">
              Anda juga dapat mengunduh seluruh baris absensi langsung dalam format CSV yang 100% kompatibel dengan Google Sheets & Excel.
            </p>
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 font-bold rounded-md text-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              Unduh Data Absensi Lengkap (.csv)
            </button>
          </div>
        </div>

        {/* Right Column: Copyable Google Apps Script Code */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400">Code.gs</span>
              <span className="text-[11px] text-slate-400">(Google Apps Script)</span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin Kode Skrip
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-x-auto flex-1 leading-relaxed max-h-[520px]">
            <pre className="select-all">{APPS_SCRIPT_TEMPLATE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
