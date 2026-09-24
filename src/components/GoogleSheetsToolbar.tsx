import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Printer, 
  Percent, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Filter, 
  Search, 
  Clock, 
  FunctionSquare,
  Bold,
  Italic,
  Sparkles
} from 'lucide-react';
import { PrayerSchedule, PrayerType } from '../types';

interface Props {
  schedule: PrayerSchedule | null;
  activePrayer: PrayerType;
  selectedCellCoordinate: string;
  formulaContent: string;
  onFormulaChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterPrayer: string;
  onFilterPrayerChange: (p: string) => void;
}

export const GoogleSheetsToolbar: React.FC<Props> = ({
  schedule,
  activePrayer,
  selectedCellCoordinate,
  formulaContent,
  onFormulaChange,
  searchQuery,
  onSearchChange,
  filterPrayer,
  onFilterPrayerChange,
}) => {
  const prayerList: { name: PrayerType; time: string }[] = schedule ? [
    { name: 'Subuh', time: schedule.subuh },
    { name: 'Dzuhur', time: schedule.dzuhur },
    { name: 'Ashar', time: schedule.ashar },
    { name: 'Maghrib', time: schedule.maghrib },
    { name: 'Isya', time: schedule.isya },
  ] : [];

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 gap-2 text-slate-700 text-xs">
        {/* Left: Desktop Spreadsheet Formatting buttons (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto py-0.5">
          <button 
            onClick={() => alert('Fitur Undo aktif')} 
            className="p-1.5 hover:bg-slate-200 rounded transition text-slate-600" 
            title="Urungkan (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => alert('Fitur Redo aktif')} 
            className="p-1.5 hover:bg-slate-200 rounded transition text-slate-600" 
            title="Ulangi (Redo)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => window.print()} 
            className="p-1.5 hover:bg-slate-200 rounded transition text-slate-600" 
            title="Cetak Laporan Spreadsheet"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Font selector simulation */}
          <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center gap-1">
            <span>Jakarta Sans</span>
          </div>

          <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700">
            10 pt
          </div>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button className="p-1.5 hover:bg-slate-200 rounded transition font-bold text-slate-700" title="Tebal">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-slate-200 rounded transition italic text-slate-700" title="Miring">
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Alignment controls (rata kiri, tengah, kanan) */}
          <button className="p-1.5 hover:bg-slate-200 rounded transition text-slate-600" title="Rata Kiri">
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-slate-200 rounded transition text-slate-600" title="Rata Tengah">
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-slate-200 rounded transition text-slate-600" title="Rata Kanan">
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />
        </div>

        {/* Filter and Search: Always visible, responsive for Mobile */}
        <div className="flex items-center gap-2 flex-1 justify-between flex-wrap sm:flex-nowrap">
          {/* Prayer Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={filterPrayer}
              onChange={(e) => onFilterPrayerChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Sholat</option>
              <option value="Subuh">Subuh</option>
              <option value="Dzuhur">Dzuhur</option>
              <option value="Ashar">Ashar</option>
              <option value="Maghrib">Maghrib</option>
              <option value="Isya">Isya</option>
            </select>
          </div>

          {/* Quick Search Box: Expanding to fill nicely */}
          <div className="relative flex-1 min-w-[160px] max-w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama santri, RFID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Formula Bar and Kemenag DKI Prayer Schedule Quick Ticker */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-slate-200 bg-white px-3 py-1 gap-2 text-xs">
        {/* Left: Standard Google Sheets Formula Bar (fx) - Hidden on Mobile to save screen height */}
        <div className="hidden md:flex items-center gap-2 flex-1">
          <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded min-w-[48px] text-center">
            {selectedCellCoordinate || 'A1'}
          </div>
          
          <div className="text-slate-400 flex items-center justify-center font-serif italic text-sm font-semibold px-1">
            fx
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <input
            type="text"
            value={formulaContent}
            onChange={(e) => onFormulaChange(e.target.value)}
            placeholder="Ketik rumus atau nilai sel (cth: =SUM(L2:L50), =AVERAGE(H2:H50))"
            className="flex-1 font-mono text-xs text-slate-800 outline-none bg-transparent py-0.5"
          />
        </div>

        {/* Right: Live DKI Jakarta Prayer Times Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 shrink-0 scrollbar-none w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-emerald-600" /> DKI:
          </span>
          {prayerList.map((p) => {
            const isActive = p.name === activePrayer;
            return (
              <div
                key={p.name}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold ring-2 ring-emerald-300 ring-offset-1'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{p.name}</span>
                <span className={isActive ? 'text-emerald-100 font-mono' : 'text-slate-500 font-mono'}>
                  {p.time}
                </span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
