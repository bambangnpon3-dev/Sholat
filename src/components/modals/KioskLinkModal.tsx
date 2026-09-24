import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Scan, 
  Monitor, 
  Tablet, 
  Sparkles, 
  Radio, 
  Layers,
  Trophy,
  Globe
} from 'lucide-react';
import { 
  getKioskUrl, 
  copyKioskUrlToClipboard, 
  navigateToKiosk,
  getDailyRankingUrl,
  copyDailyRankingUrlToClipboard,
  navigateToDailyRanking
} from '../../services/kioskRoutingService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenLocalKiosk: () => void;
}

export const KioskLinkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenLocalKiosk
}) => {
  const [copiedKiosk, setCopiedKiosk] = useState(false);
  const [copiedRanking, setCopiedRanking] = useState(false);
  const kioskUrl = getKioskUrl();
  const rankingUrl = getDailyRankingUrl();

  if (!isOpen) return null;

  const handleCopyKiosk = async () => {
    const ok = await copyKioskUrlToClipboard();
    if (ok) {
      setCopiedKiosk(true);
      setTimeout(() => setCopiedKiosk(false), 2500);
    }
  };

  const handleCopyRanking = async () => {
    const ok = await copyDailyRankingUrlToClipboard();
    if (ok) {
      setCopiedRanking(true);
      setTimeout(() => setCopiedRanking(false), 2500);
    }
  };

  const handleOpenNewTab = () => {
    navigateToKiosk(true);
    onClose();
  };

  const handleOpenCurrentTab = () => {
    navigateToKiosk(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Link Alamat Terpisah Kiosk RFID</h3>
              <p className="text-xs text-emerald-100">Gerbang Presensi Mandiri Santri Masjid DKI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1. URL Papan Peringkat Harian (Publik) */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Link Publik Papan Peringkat Harian:</span>
              </label>
              <button
                onClick={() => {
                  navigateToDailyRanking(true);
                  onClose();
                }}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Jendela</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-amber-900/80">
              Link publik mandiri yang dapat dibagikan ke wali santri/jamaah untuk melihat urutan santri dengan poin terbanyak hari ini secara live.
            </p>
            <div className="flex items-stretch gap-2">
              <div className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 select-all overflow-x-auto whitespace-nowrap flex items-center shadow-inner">
                {rankingUrl}
              </div>
              <button
                onClick={handleCopyRanking}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  copiedRanking 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {copiedRanking ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRanking ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* 2. URL Terminal Kiosk RFID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              URL Khusus Terminal Kiosk RFID (Layar Sentuh / Android TV):
            </label>
            <div className="flex items-stretch gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all overflow-x-auto whitespace-nowrap flex items-center">
                {kioskUrl || window.location.href}
              </div>
              <button
                onClick={handleCopyKiosk}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  copiedKiosk 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {copiedKiosk ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKiosk ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
            {copiedKiosk && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                ✓ Alamat link Kiosk berhasil disalin ke papan klip!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleOpenNewTab}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka di Tab/Jendela Baru</span>
            </button>

            <button
              onClick={handleOpenCurrentTab}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              <Monitor className="w-4 h-4 text-slate-600" />
              <span>Buka Kiosk di Layar Penuh</span>
            </button>
          </div>

          {/* Device Usage Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Tablet className="w-4 h-4 text-emerald-600" />
              <span>Dukungan Perangkat di Masjid (Termasuk TV Android):</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-600 pl-1 leading-relaxed">
              <li>
                <strong className="text-emerald-800">📺 Web Browser Smart TV / TV Android:</strong> Buka aplikasi browser (misal: <em>Chrome, TV Bro, JioPages</em>) di TV Android masjid, lalu ketik alamat web dan tambahkan akhiran <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-900">/#kiosk</code>.
              </li>
              <li>
                <strong className="text-slate-800">🔌 Scanner RFID USB di TV:</strong> Reader RFID USB (tipe keyboard wedge) dapat dicolokkan langsung ke port USB Android TV. Setiap tap kartu santri otomatis terdeteksi tanpa perlu install aplikasi tambahan.
              </li>
              <li>
                <strong className="text-slate-800">🖥️ Layar Penuh & Layar Tetap Menyala (Keep-Awake):</strong> Mode Kiosk dilengkapi fitur pencegah layar mati (Screen Wake Lock) otomatis sehingga TV tetap menyala selama jam sholat.
              </li>
              <li>
                <strong className="text-slate-800">⚡ Sinkronisasi Realtime:</strong> Presensi yang ditap santri di Android TV langsung tersinkron ke Spreadsheet admin & rekap laporan DKM.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenLocalKiosk();
            }}
            className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Buka sebagai Modal Popup biasa</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
