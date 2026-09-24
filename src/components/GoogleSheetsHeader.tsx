import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Radio, 
  Share2, 
  CloudCheck, 
  UserPlus, 
  Scan,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Link2,
  MoreVertical,
  ChevronDown,
  Globe,
  Trophy
} from 'lucide-react';

interface Props {
  documentTitle: string;
  onUpdateTitle: (title: string) => void;
  onOpenKiosk: () => void;
  onOpenKioskLinkModal: () => void;
  onExportCSV: () => void;
  onOpenIntegrationModal: () => void;
  onOpenAddManual: () => void;
  onRefreshPrayerTimes: () => void;
  isLoadingPrayer: boolean;
  activePrayerName: string;
  nextPrayerCountdown: string;
  onSyncAllData?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onOpenPublicJournal?: () => void;
  onOpenDailyRanking?: () => void;
}

export const GoogleSheetsHeader: React.FC<Props> = ({
  documentTitle,
  onUpdateTitle,
  onOpenKiosk,
  onOpenKioskLinkModal,
  onExportCSV,
  onOpenIntegrationModal,
  onOpenAddManual,
  onRefreshPrayerTimes,
  isLoadingPrayer,
  activePrayerName,
  nextPrayerCountdown,
  onSyncAllData,
  isSyncing,
  lastSyncTime,
  onOpenPublicJournal,
  onOpenDailyRanking
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);
  const [showMobileMore, setShowMobileMore] = useState(false);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs select-none relative z-30">
      {/* Top Bar with Sheets Identity */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-3 py-1.5 gap-1.5 md:gap-2">
        {/* Left: Icon & Title */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0 cursor-pointer hover:bg-emerald-700 transition"
              title="Google Sheets Sholat Santri Edition"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    className="font-bold text-slate-800 text-sm md:text-base border-b border-emerald-500 outline-none px-1 py-0.5 bg-emerald-50/50 rounded"
                    autoFocus
                  />
                ) : (
                  <h1 
                    onClick={() => setIsEditingTitle(true)}
                    className="font-bold text-slate-800 text-sm md:text-base hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer transition flex items-center gap-1.5 line-clamp-1"
                    title="Klik untuk mengubah nama dokumen"
                  >
                    {documentTitle}
                  </h1>
                )}
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CloudCheck className="w-3 h-3" />
                  Disimpan otomatis {lastSyncTime ? `• Sinkron: ${lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Live DKI Jakarta Kemenag Status Chip (Compact on Mobile) */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-700 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800 hidden sm:inline">Kemenag DKI:</span>
            <span className="text-slate-800 font-bold">{activePrayerName}</span>
            <span className="text-slate-400 text-[10px]">({nextPrayerCountdown})</span>
            <button 
              onClick={onRefreshPrayerTimes} 
              disabled={isLoadingPrayer}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
              title="Perbarui Jadwal Sholat Kemenag DKI"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingPrayer ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Buttons: Responsive Layout */}
        <div className="flex items-center gap-1.5 justify-between sm:justify-end">
          {/* PRIMARY: RFID Kiosk Mode */}
          <button
            onClick={onOpenKiosk}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-xs transition transform active:scale-95 cursor-pointer"
            title="Buka Mesin Pemindai RFID untuk Santri di Pintu Masjid"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Kiosk Tap RFID</span>
            <span className="bg-emerald-500/40 text-[9px] uppercase tracking-wider px-1 py-0.2 rounded font-extrabold hidden xs:inline">
              Masjid
            </span>
          </button>

          {/* Quick Manual Entry */}
          <button
            onClick={onOpenAddManual}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
            title="Input absensi manual tanpa kartu RFID"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-600" />
            <span>+ Manual</span>
          </button>

          {/* Desktop Only Buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            {onOpenDailyRanking && (
              <button
                onClick={onOpenDailyRanking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                title="Buka Jendela Terpisah Papan Peringkat Harian Santri (Link Publik)"
              >
                <Trophy className="w-3.5 h-3.5 text-slate-950" />
                <span>Peringkat Harian</span>
              </button>
            )}

            {onOpenPublicJournal && (
              <button
                onClick={onOpenPublicJournal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-500 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                title="Buka Link Khusus Real-Time Jurnal Harian Publik Santri"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-900" />
                <span>Jurnal Live</span>
              </button>
            )}

            {onSyncAllData && (
              <button
                onClick={onSyncAllData}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
                title="Sinkronisasi Data Absensi & Kalkulasi Poin Santri"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}

            <button
              onClick={onOpenIntegrationModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition shadow-2xs cursor-pointer"
              title="Integrasi & Sinkronisasi ke Google Spreadsheet DKM"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sheets</span>
            </button>

            <button
              onClick={onExportCSV}
              className="p-1.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer"
              title="Unduh data CSV/Excel"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenKioskLinkModal}
              className="p-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer"
              title="Dapatkan link alamat terpisah untuk Kiosk RFID"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile "More" Menu Toggle */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setShowMobileMore(!showMobileMore)}
              className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition cursor-pointer flex items-center gap-0.5 text-xs"
              title="Menu Lainnya"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMobileMore && (
              <div 
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowMobileMore(false)}
              >
                {onOpenDailyRanking && (
                  <button
                    onClick={onOpenDailyRanking}
                    className="w-full px-3 py-2 text-left hover:bg-amber-50 flex items-center gap-2 text-amber-900 font-bold"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Papan Peringkat Harian</span>
                  </button>
                )}
                {onOpenPublicJournal && (
                  <button
                    onClick={onOpenPublicJournal}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 flex items-center gap-2 text-emerald-800 font-bold"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jurnal Live Publik</span>
                  </button>
                )}
                {onSyncAllData && (
                  <button
                    onClick={onSyncAllData}
                    disabled={isSyncing}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center gap-2 text-emerald-800"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Poin & Laporan</span>
                  </button>
                )}
                <button
                  onClick={onOpenIntegrationModal}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets Sync</span>
                </button>
                <button
                  onClick={onExportCSV}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ekspor CSV / Excel</span>
                </button>
                <button
                  onClick={onOpenKioskLinkModal}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Terpisah Kiosk</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
