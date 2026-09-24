import React from 'react';
import { 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Trophy, 
  Sparkles, 
  Database, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldCheck,
  Flame,
  Award
} from 'lucide-react';
import { SyncResult } from '../../services/syncService';
import { SpreadsheetTabId } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  syncResult: SyncResult | null;
  onNavigateTab: (tab: SpreadsheetTabId) => void;
}

export const SyncStatusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  syncResult,
  onNavigateTab
}) => {
  if (!isOpen || !syncResult) return null;

  const { stats, timestamp } = syncResult;

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);

  const handleGoToTab = (tab: SpreadsheetTabId) => {
    onNavigateTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg leading-tight">Data Absensi & Poin Berhasil Disinkronkan!</h3>
                <span className="bg-emerald-400/30 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300/40">
                  Sinkron 100%
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Laporan Harian, Mingguan, dan Bulanan kini selaras dan mutakhir • {formattedTime} WIB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Total Presensi</div>
              <div className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                {stats.totalRecords.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Catatan Terverifikasi</div>
            </div>

            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">Total Poin Santri</div>
              <div className="text-2xl font-black text-teal-900 font-mono mt-0.5">
                {stats.totalPointsRecalculated.toLocaleString()}
              </div>
              <div className="text-[10px] text-teal-600 mt-0.5">Poin Tervalidasi</div>
            </div>

            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wide">Santri Terdaftar</div>
              <div className="text-2xl font-black text-sky-900 font-mono mt-0.5">
                {stats.totalStudents}
              </div>
              <div className="text-[10px] text-sky-600 mt-0.5">Profil Terhubung</div>
            </div>
          </div>

          {/* 3 Synchronized Reports Cards */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Status Penyelarasan 3 Laporan Sholat:</span>
            </div>

            {/* 1. Laporan Harian */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 shadow-2xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">Laporan Harian</h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sinkron
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {stats.todayRecordsCount > 0 
                      ? `${stats.todayRecordsCount} kehadiran hari ini • +${stats.todayPoints} poin akumulasi (${stats.todayPrayersCount.Subuh} Subuh, ${stats.todayPrayersCount.Dzuhur} Dzuhur, ${stats.todayPrayersCount.Ashar} Ashar, ${stats.todayPrayersCount.Maghrib} Maghrib, ${stats.todayPrayersCount.Isya} Isya)`
                      : 'Data hari ini siaga (belum ada tap presensi hari ini). Menunggu waktu sholat tiba.'
                    }
                  </p>
                  {stats.topStudentToday && (
                    <div className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" /> Teratas Hari Ini: {stats.topStudentToday.name} ({stats.topStudentToday.points} pts)
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleGoToTab('laporan_harian')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 self-end sm:self-center shrink-0 cursor-pointer"
              >
                <span>Lihat Laporan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Laporan Mingguan */}
            <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 shadow-2xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">Laporan Mingguan</h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Sinkron
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {stats.weeklyRecordsCount} kehadiran dalam 7 hari terakhir • +{stats.weeklyPoints.toLocaleString()} total poin pekan ini.
                  </p>
                  {stats.topStudentWeekly && (
                    <div className="text-[11px] text-indigo-800 font-semibold mt-1 flex items-center gap-1">
                      <Award className="w-3 h-3 text-indigo-500" /> Peringkat 1 Pekan Ini: {stats.topStudentWeekly.name} ({stats.topStudentWeekly.points} pts)
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleGoToTab('laporan_mingguan')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 self-end sm:self-center shrink-0 cursor-pointer"
              >
                <span>Lihat Laporan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Laporan Bulanan */}
            <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-3.5 shadow-2xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">Laporan Bulanan & Rapor Santri</h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <CheckCircle2 className="w-3 h-3 text-amber-600" /> Sinkron
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target 150 waktu sholat: Rata-rata kehadiran santri mencapai {stats.avgMonthlyAttendancePct}%. Rapor digital 100% siap dicetak.
                  </p>
                  {stats.topStudentMonthly && (
                    <div className="text-[11px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500" /> Santri Teladan: {stats.topStudentMonthly.name} ({stats.topStudentMonthly.points} pts)
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleGoToTab('laporan_bulanan')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200 self-end sm:self-center shrink-0 cursor-pointer"
              >
                <span>Lihat Rapor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cloud Google Spreadsheet Status Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Spreadsheet Cloud:</span>
              <span className={`font-bold ${stats.syncedToWebhook ? 'text-emerald-700' : 'text-slate-600'}`}>
                {stats.syncedToWebhook 
                  ? 'Tersinkronkan ke Webhook Apps Script' 
                  : 'Penyimpanan Lokal Aktif (Dapat diekspor ke format CSV / Excel kapan saja)'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
