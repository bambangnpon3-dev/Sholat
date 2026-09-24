import React from 'react';
import { Plus, Menu, ChevronRight, RefreshCw } from 'lucide-react';
import { SpreadsheetTabId, SpreadsheetTab } from '../types';

interface Props {
  activeTab: SpreadsheetTabId;
  onSelectTab: (tabId: SpreadsheetTabId) => void;
  attendanceCount: number;
  studentsCount: number;
  totalPointsOverall: number;
  onSyncData?: () => void;
  isSyncing?: boolean;
}

export const TABS: SpreadsheetTab[] = [
  { id: 'absensi', label: '📋 Data Absensi & Poin', color: '#0F9D58' },
  { id: 'jadwal_dki', label: '🕌 Jadwal Sholat Kemenag DKI', color: '#10B981' },
  { id: 'laporan_harian', label: '📊 Laporan Harian', color: '#3B82F6' },
  { id: 'laporan_mingguan', label: '📈 Laporan Mingguan', color: '#6366F1' },
  { id: 'laporan_bulanan', label: '🏆 Laporan Bulanan', color: '#8B5CF6' },
  { id: 'master_santri', label: '💳 Master Santri & RFID', color: '#F59E0B' },
  { id: 'apps_script', label: '⚙️ Integrasi Apps Script', color: '#EC4899' },
];

export const SheetsTabsBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  attendanceCount,
  studentsCount,
  totalPointsOverall,
  onSyncData,
  isSyncing,
}) => {
  return (
    <div className="bg-slate-100 border-t border-slate-300 flex items-center justify-between px-2 py-1 select-none text-xs">
      {/* Left Sheet Tabs list */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-4xl">
        <button 
          onClick={() => alert('Daftar Lembar Kerja (Sheets Tabs)')}
          className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
          title="Semua Sheet"
        >
          <Menu className="w-4 h-4" />
        </button>

        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          let badgeText = '';
          if (tab.id === 'absensi') badgeText = `${attendanceCount}`;
          if (tab.id === 'master_santri') badgeText = `${studentsCount} santri`;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium text-xs whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white text-emerald-800 font-bold border-t-2 border-x border-slate-300 border-t-emerald-600 shadow-2xs relative z-10'
                  : 'text-slate-600 hover:bg-slate-200/70 border-t-2 border-transparent'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: tab.color }}
              />
              <span>{tab.label}</span>
              {badgeText && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {badgeText}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => alert('Untuk menambahkan sheet kustom baru, gunakan integrasi Google Sheets atau Apps Script')}
          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition"
          title="Tambah Sheet Baru"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right summary status (Google Sheets status bar) */}
      <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-500 font-mono pr-2">
        <span>TOTAL REKAP: <strong className="text-slate-700">{attendanceCount} Baris</strong></span>
        <span>|</span>
        <span>TOTAL POIN: <strong className="text-emerald-700 font-bold">{totalPointsOverall.toLocaleString()} Poin</strong></span>
        {onSyncData && (
          <>
            <span>|</span>
            <button
              onClick={onSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 font-sans text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition cursor-pointer active:scale-95 disabled:opacity-60"
              title="Sinkronisasi Data Absensi & Poin"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
