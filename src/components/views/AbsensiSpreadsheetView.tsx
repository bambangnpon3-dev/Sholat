import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Sparkles, 
  Edit3, 
  ArrowUpDown, 
  ShieldCheck,
  Award,
  Filter,
  RefreshCw,
  AlertTriangle,
  Calendar,
  RotateCcw,
  CheckSquare, 
  Square,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AttendanceRecord, PrayerType } from '../../types';
import { getTodayDateLocal, isDateIn18To21SeptRange } from '../../data/initialData';
import { DeleteDateRangeModal } from '../modals/DeleteDateRangeModal';
import { EditDetailPenilaianModal } from '../modals/EditDetailPenilaianModal';

interface Props {
  records: AttendanceRecord[];
  onSelectCell: (coord: string, val: string) => void;
  selectedCoordinate: string;
  onDeleteRecord: (id: string) => void;
  onDeleteMultipleRecords?: (ids: string[]) => void;
  onZeroPointsMultiple?: (ids: string[]) => void;
  onClearAllRecords?: () => void;
  filterPrayer: string;
  searchQuery: string;
  onClearTodayAndFuture?: () => void;
  onDeleteRecords18To21Sept?: () => void;
  onDeleteDateRange?: (startDate: string, endDate: string) => void;
  onSyncData?: () => void;
  isSyncing?: boolean;
  onUpdateRecord?: (updatedRecord: AttendanceRecord) => void;
}

export const AbsensiSpreadsheetView: React.FC<Props> = ({
  records,
  onSelectCell,
  selectedCoordinate,
  onDeleteRecord,
  onDeleteMultipleRecords,
  onZeroPointsMultiple,
  onClearAllRecords,
  filterPrayer,
  searchQuery,
  onClearTodayAndFuture,
  onDeleteRecords18To21Sept,
  onDeleteDateRange,
  onSyncData,
  isSyncing,
  onUpdateRecord,
}) => {
  const [sortField, setSortField] = useState<'date' | 'totalPoints' | 'studentName'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Date Range state & control
  const [dateRangeStart, setDateRangeStart] = useState<string>('2026-09-18');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('2026-09-21');
  const [isDateRangeActive, setIsDateRangeActive] = useState<boolean>(false);
  const [showDateRangeBar, setShowDateRangeBar] = useState<boolean>(false);

  const todayStr = getTodayDateLocal();
  const todayRecords = records.filter(r => r.date === todayStr);
  const todayRecordsCount = todayRecords.length;
  const todayPointsSum = todayRecords.reduce((acc, r) => acc + r.totalPoints, 0);
  const hasTodayOrFuture = records.some(r => r.date >= todayStr);

  // Check how many records in 18/9 - 21/9
  const count18To21 = records.filter(r => isDateIn18To21SeptRange(r.date)).length;

  // Filter records (with Prayer, Search Query, and Date Range Filter)
  const filtered = records.filter(r => {
    const matchPrayer = filterPrayer === 'ALL' || r.prayerType === filterPrayer;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || 
      r.studentName.toLowerCase().includes(q) || 
      r.rfidCardUid.includes(q) || 
      r.halaqah.toLowerCase().includes(q) ||
      r.prayerType.toLowerCase().includes(q) ||
      r.date.includes(q);

    const matchDateRange = !isDateRangeActive || (
      (!dateRangeStart || r.date >= dateRangeStart) &&
      (!dateRangeEnd || r.date <= dateRangeEnd)
    );

    return matchPrayer && matchSearch && matchDateRange;
  });

  // Sort records
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'date') {
      const cmp = (b.date + b.time).localeCompare(a.date + a.time);
      return sortAsc ? -cmp : cmp;
    } else if (sortField === 'totalPoints') {
      return sortAsc ? a.totalPoints - b.totalPoints : b.totalPoints - a.totalPoints;
    } else {
      return sortAsc ? a.studentName.localeCompare(b.studentName) : b.studentName.localeCompare(a.studentName);
    }
  });

  // Bulk selection logic
  const isAllVisibleSelected = sorted.length > 0 && sorted.every(r => selectedIds.includes(r.id));
  const isSomeVisibleSelected = sorted.some(r => selectedIds.includes(r.id)) && !isAllVisibleSelected;
  const isAllDatabaseSelected = records.length > 0 && selectedIds.length === records.length;

  // Toggle select all visible records
  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      const visibleSet = new Set(sorted.map(r => r.id));
      setSelectedIds(prev => prev.filter(id => !visibleSet.has(id)));
    } else {
      const visibleIds = sorted.map(r => r.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Select all 100% of records in entire database
  const handleSelectAllTotalDatabase = () => {
    setSelectedIds(records.map(r => r.id));
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Select all records within the active or input date range
  const handleSelectRecordsInRange = (s: string, e: string) => {
    if (!s || !e) {
      alert('Pilih tanggal mulai dan tanggal selesai terlebih dahulu.');
      return;
    }
    const matched = records.filter(r => r.date >= s && r.date <= e).map(r => r.id);
    if (matched.length === 0) {
      alert(`Tidak ada data absensi ditemukan antara ${s} dan ${e}.`);
      return;
    }
    setSelectedIds(prev => Array.from(new Set([...prev, ...matched])));
  };

  // Date range presets
  const handleApplyPreset = (preset: 'today' | '18-21' | 'last3' | 'last7' | 'month' | 'all') => {
    if (preset === 'today') {
      const today = getTodayDateLocal();
      setDateRangeStart(today);
      setDateRangeEnd(today);
      setIsDateRangeActive(true);
    } else if (preset === '18-21') {
      setDateRangeStart('2026-09-18');
      setDateRangeEnd('2026-09-21');
      setIsDateRangeActive(true);
    } else if (preset === 'last3') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      setDateRangeStart(start.toISOString().slice(0, 10));
      setDateRangeEnd(end.toISOString().slice(0, 10));
      setIsDateRangeActive(true);
    } else if (preset === 'last7') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setDateRangeStart(start.toISOString().slice(0, 10));
      setDateRangeEnd(end.toISOString().slice(0, 10));
      setIsDateRangeActive(true);
    } else if (preset === 'month') {
      setDateRangeStart('2026-09-01');
      setDateRangeEnd('2026-09-30');
      setIsDateRangeActive(true);
    } else if (preset === 'all') {
      setDateRangeStart('');
      setDateRangeEnd('');
      setIsDateRangeActive(false);
    }
  };

  // Matched records in the input date range
  const matchedInRange = records.filter(r => {
    if (!dateRangeStart || !dateRangeEnd) return false;
    return r.date >= dateRangeStart && r.date <= dateRangeEnd;
  });
  const matchedPointsInRange = matchedInRange.reduce((acc, r) => acc + r.totalPoints, 0);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Ya, Hapus',
    danger: true,
    onConfirm: () => {}
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleRow = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const promptDeleteSingle = (id: string, studentName: string, prayerType: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Presensi?',
      message: `Hapus catatan presensi ${studentName} (${prayerType})? Poin santri akan otomatis dikalkulasi ulang seketika.`,
      confirmLabel: 'Ya, Hapus Presensi',
      danger: true,
      onConfirm: () => {
        onDeleteRecord(id);
        setSelectedIds(prev => prev.filter(x => x !== id));
        showToast(`Presensi ${studentName} (${prayerType}) berhasil dihapus.`);
      }
    });
  };

  const promptZeroSingle = (id: string, studentName: string, prayerType: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Nol-kan Poin Presensi?',
      message: `Ubah perolehan poin sholat ${studentName} (${prayerType}) menjadi 0? Data kehadiran santri tetap tersimpan.`,
      confirmLabel: 'Nol-kan Poin',
      danger: false,
      onConfirm: () => {
        if (onZeroPointsMultiple) {
          onZeroPointsMultiple([id]);
        }
        showToast(`Poin ${studentName} (${prayerType}) dinolkan.`);
      }
    });
  };

  const promptDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const isAll = selectedIds.length === records.length;
    setConfirmDialog({
      isOpen: true,
      title: isAll ? 'Hapus SELURUH Database Absensi?' : `Hapus ${selectedIds.length} Data Terpilih?`,
      message: isAll
        ? `Anda akan menghapus seluruh ${records.length} data absensi di database. Seluruh poin santri akan di-reset ke 0.`
        : `Anda akan menghapus ${selectedIds.length} baris data absensi terpilih. Seluruh poin santri dan rekap laporan akan dikalkulasi ulang secara otomatis.`,
      confirmLabel: isAll ? 'Ya, Hapus Semua' : `Ya, Hapus (${selectedIds.length})`,
      danger: true,
      onConfirm: () => {
        const count = selectedIds.length;
        if (onDeleteMultipleRecords) {
          onDeleteMultipleRecords(selectedIds);
        } else {
          selectedIds.forEach(id => onDeleteRecord(id));
        }
        setSelectedIds([]);
        showToast(`Berhasil menghapus ${count} baris data presensi.`);
      }
    });
  };

  const promptZeroPointsSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: `Nol-kan Poin (${selectedIds.length} Data Terpilih)?`,
      message: `Poin dari ${selectedIds.length} data presensi terpilih akan diubah menjadi 0. Catatan kehadiran santri tetap tersimpan aman.`,
      confirmLabel: 'Nol-kan Poin',
      danger: false,
      onConfirm: () => {
        const count = selectedIds.length;
        if (onZeroPointsMultiple) {
          onZeroPointsMultiple(selectedIds);
        }
        setSelectedIds([]);
        showToast(`Poin pada ${count} presensi berhasil dinolkan.`);
      }
    });
  };

  const promptDelete18To21 = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data 18 s.d. 21 September?',
      message: `Hapus seluruh ${count18To21} baris data absensi tanggal 18/9 s.d. 21/9? Seluruh poin santri dan laporan akan diselaraskan ulang secara otomatis.`,
      confirmLabel: `Ya, Hapus (${count18To21} Data)`,
      danger: true,
      onConfirm: () => {
        if (onDeleteRecords18To21Sept) {
          onDeleteRecords18To21Sept();
        } else if (onDeleteDateRange) {
          onDeleteDateRange('2026-09-18', '2026-09-21');
        }
        showToast(`Data tanggal 18 s.d. 21 September (${count18To21} baris) berhasil dihapus.`);
      }
    });
  };

  const promptClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus SEMUA Data Absensi?',
      message: 'Apakah Anda yakin ingin menghapus seluruh rekaman absensi dan mengembalikan seluruh poin santri ke 0? Tindakan ini akan mengosongkan seluruh riwayat.',
      confirmLabel: 'Ya, Hapus Semua Absensi',
      danger: true,
      onConfirm: () => {
        onClearAllRecords?.();
        setSelectedIds([]);
        showToast('Seluruh data absensi telah berhasil dibersihkan.');
      }
    });
  };

  const selectedRecords = records.filter(r => selectedIds.includes(r.id));
  const selectedPointsSum = selectedRecords.reduce((acc, r) => acc + r.totalPoints, 0);

  const handleSort = (field: 'date' | 'totalPoints' | 'studentName') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Math aggregates for spreadsheet summary
  const totalRows = sorted.length;
  const totalPointsSum = sorted.reduce((acc, r) => acc + r.totalPoints, 0);
  const avgPoints = totalRows > 0 ? Math.round(totalPointsSum / totalRows) : 0;
  const avgWudhu = totalRows > 0 ? Math.round(sorted.reduce((acc, r) => acc + r.pointsWudhu, 0) / totalRows) : 0;
  const avgQobliyah = totalRows > 0 ? Math.round(sorted.reduce((acc, r) => acc + (r.pointsSunnahQobliyah ?? (r.prayerType === 'Subuh' ? r.pointsSholatSunah : (r.pointsSholatSunah > 0 ? 5 : 0))), 0) / totalRows) : 0;
  const avgWajib = totalRows > 0 ? Math.round(sorted.reduce((acc, r) => acc + r.pointsSholatWajib, 0) / totalRows) : 0;
  const avgBadiyah = totalRows > 0 ? Math.round(sorted.reduce((acc, r) => acc + (r.pointsSunnahBadiyah ?? (r.prayerType !== 'Subuh' && r.prayerType !== 'Ashar' && r.pointsSholatSunah > 5 ? 5 : 0)), 0) / totalRows) : 0;

  // Prayer badge colors
  const prayerBadge = (prayer: PrayerType) => {
    switch (prayer) {
      case 'Subuh': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Dzuhur': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Ashar': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Maghrib': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Isya': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden select-text">
      {/* 1. SINGLE UNIFIED COMPACT TOOLBAR (Tidy, summarized, fully responsive) */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 select-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left Group: Master Selection & Date Range */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Master Checklist */}
            <label className="inline-flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 transition shadow-2xs">
              <input
                type="checkbox"
                checked={isAllVisibleSelected}
                ref={input => {
                  if (input) input.indeterminate = isSomeVisibleSelected;
                }}
                onChange={handleToggleSelectAll}
                className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
              />
              <span className="text-xs">
                {isAllVisibleSelected ? 'Batal' : `Pilih Semua (${sorted.length})`}
              </span>
            </label>

            {/* Button: Rentang Tanggal */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-2xs cursor-pointer"
              title="Pilih rentang tanggal dan kelola opsi hapus / tinjau"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Rentang Tanggal</span>
            </button>

            {/* Quick Select All in Entire DB */}
            {selectedIds.length === 0 && (
              <button
                type="button"
                onClick={handleSelectAllTotalDatabase}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                title="Centang seluruh 100% data absensi di database"
              >
                <CheckSquare className="w-3 h-3 text-slate-400" />
                <span>Semua DB ({records.length})</span>
              </button>
            )}

            {/* Special shortcut if 18-21 Sept data exists */}
            {count18To21 > 0 && (
              <button
                type="button"
                onClick={promptDelete18To21}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer animate-pulse active:scale-95"
                title="Hapus data absensi 18 s.d. 21 September 2026"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus 18-21/9 ({count18To21})</span>
              </button>
            )}

            {/* Active Date Range Filter Badge */}
            {isDateRangeActive && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                <span>📅 {dateRangeStart} s/d {dateRangeEnd}</span>
                <button
                  type="button"
                  onClick={() => setIsDateRangeActive(false)}
                  className="hover:bg-emerald-200 rounded-full p-0.5 text-emerald-900 cursor-pointer"
                  title="Hapus filter rentang"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Group: Count, View Mode Switch, Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end flex-1 sm:flex-initial">
            {/* Summary Count */}
            <div className="text-xs text-slate-600 font-medium">
              <strong>{sorted.length.toLocaleString('id-ID')}</strong> Presensi
              <span className="mx-1 text-slate-300">•</span>
              <strong className="text-emerald-700 font-bold">{totalPointsSum.toLocaleString('id-ID')}</strong> Pts
            </div>

            {/* Mobile/Tablet View Switcher */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 font-bold text-xs border border-slate-200">
              <button
                type="button"
                onClick={() => setMobileViewMode('cards')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  mobileViewMode === 'cards' 
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Kartu HP"
              >
                📱 Kartu
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  mobileViewMode === 'table' 
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel Spreadsheet"
              >
                📊 Tabel
              </button>
            </div>

            {/* Sync Button */}
            {onSyncData && (
              <button
                type="button"
                onClick={onSyncData}
                disabled={isSyncing}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition cursor-pointer disabled:opacity-50"
                title="Sinkronkan seluruh data absensi dan kalkulasi poin santri"
              >
                <RefreshCw className={`w-3 h-3 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}

            {/* Delete All Menu / Trigger */}
            {onClearAllRecords && records.length > 0 && selectedIds.length === 0 && (
              <button
                type="button"
                onClick={promptClearAll}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                title="Hapus seluruh data absensi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Semua</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BULK SELECTION FLOATING ACTION BAR (Appears automatically when items are checked) */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-300 px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-150 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-rose-900 bg-rose-200/80 px-2.5 py-0.5 rounded-full text-xs">
              {selectedIds.length} Terpilih
            </span>
            <span className="text-slate-700 text-xs">
              Total: <strong className="text-rose-700 font-mono font-bold">+{selectedPointsSum.toLocaleString('id-ID')} Poin</strong>
            </span>
            {selectedIds.length < records.length && (
              <button
                type="button"
                onClick={handleSelectAllTotalDatabase}
                className="text-xs text-rose-700 hover:underline font-bold cursor-pointer hidden sm:inline"
              >
                (Pilih Semua DB: {records.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Delete Button */}
            <button
              type="button"
              onClick={promptDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Hapus data presensi terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.length})</span>
            </button>

            {/* Zero Points */}
            {onZeroPointsMultiple && (
              <button
                type="button"
                onClick={promptZeroPointsSelected}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Nol-kan perhitungan poin tanpa menghapus catatan presensi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nol-kan Poin</span>
                <span className="sm:hidden">0 Poin</span>
              </button>
            )}

            {/* Cancel selection */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              title="Batal pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CARD LIST VIEW (Clean, fast, no duplicate headers) */}
      <div className={`${mobileViewMode === 'cards' ? 'flex md:hidden' : 'hidden'} flex-1 flex-col overflow-y-auto p-3 space-y-2.5 bg-slate-100/60`}>

        {sorted.map((record, index) => {
          const isRowSelected = selectedIds.includes(record.id);

          return (
            <div 
              key={record.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isRowSelected 
                  ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                  : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Header: Checkbox, Student Name, Star Badge, Prayer Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isRowSelected}
                    onChange={(e) => handleToggleRow(record.id, e)}
                    className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{record.studentName}</h4>
                      <span className="text-[10px] font-mono text-slate-400">#{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 flex-wrap">
                      <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-0.5">
                        <span>🕌</span> {record.halaqah}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                        {record.rfidCardUid}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${prayerBadge(record.prayerType)}`}>
                    {record.prayerType}
                  </span>
                  <span className="inline-flex items-center gap-1 font-black text-emerald-700 font-mono text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    +{record.totalPoints} Poin
                  </span>
                </div>
              </div>

              {/* Date & Machine info */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{record.date} • {record.time} WIB</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span className="truncate max-w-[110px]">{record.verifiedBy}</span>
                </div>
              </div>

              {/* Point breakdown mini badges */}
              <div className="grid grid-cols-5 gap-1 text-center text-[10px] mt-2">
                <div className="bg-slate-50 border border-slate-200/80 rounded py-1 px-0.5">
                  <div className="text-slate-400 text-[9px] uppercase">Wudhu</div>
                  <div className="font-bold text-slate-700 font-mono">+{record.pointsWudhu}</div>
                </div>
                <div className="bg-sky-50/70 border border-sky-200/80 rounded py-1 px-0.5">
                  <div className="text-sky-800 text-[9px] uppercase">Qobliyah</div>
                  <div className="font-bold text-sky-900 font-mono">+{record.pointsSunnahQobliyah ?? 0}</div>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded py-1 px-0.5">
                  <div className="text-emerald-800 text-[9px] uppercase font-bold">Wajib</div>
                  <div className="font-bold text-emerald-900 font-mono">+{record.pointsSholatWajib}</div>
                </div>
                <div className="bg-teal-50/70 border border-teal-200/80 rounded py-1 px-0.5">
                  <div className="text-teal-800 text-[9px] uppercase">Ba'diyah</div>
                  <div className="font-bold text-teal-900 font-mono">+{record.pointsSunnahBadiyah ?? 0}</div>
                </div>
                <div className="bg-amber-50/70 border border-amber-200/80 rounded py-1 px-0.5">
                  <div className="text-amber-800 text-[9px] uppercase">Dzikir</div>
                  <div className="font-bold text-amber-900 font-mono">+{record.bonusAdab}</div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                  ID: {record.id}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(record)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-semibold transition cursor-pointer"
                    title="Edit atau koreksi detil penilaian"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-600" />
                    <span>Edit Detil</span>
                  </button>

                  {onZeroPointsMultiple && (
                    <button
                      type="button"
                      onClick={() => promptZeroSingle(record.id, record.studentName, record.prayerType)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-semibold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Nol-kan Poin</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => promptDeleteSingle(record.id, record.studentName, record.prayerType)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-semibold transition cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 p-6">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700 text-sm">Tidak ada data absensi ditemukan</div>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter sholat.</p>
          </div>
        )}
      </div>

      {/* Spreadsheet Main Table Container */}
      <div className={`${mobileViewMode === 'table' ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-auto`}>
        <table className="w-full border-collapse text-left text-xs font-normal">
          {/* Column Header Alphabet Row (Google Sheets Style: A, B, C, D...) */}
          <thead className="sticky top-0 z-20 bg-slate-100 text-slate-600 font-mono text-[11px] border-b border-slate-300 select-none">
            <tr>
              <th className="w-14 px-2 py-1.5 bg-slate-200 border-r border-b border-slate-300 text-center font-bold text-slate-500">
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeVisibleSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    title={isAllVisibleSelected ? "Batal pilih semua" : "Pilih semua baris absensi"}
                    className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>#</span>
                </div>
              </th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">A</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">B</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">C</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">D</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">E</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">F</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">G</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">H</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">I</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">J</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">K</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">L</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">M</th>
              <th className="px-2 py-1.5 text-center">Aksi</th>
            </tr>

            {/* Logical Field Name Header Row */}
            <tr className="bg-slate-50 text-slate-700 font-sans font-semibold border-b border-slate-300 text-[11px]">
              <th className="w-14 px-2 py-2 bg-slate-200 border-r border-slate-300 text-center">
                <input
                  type="checkbox"
                  checked={isAllVisibleSelected}
                  ref={input => {
                    if (input) input.indeterminate = isSomeVisibleSelected;
                  }}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                />
              </th>
              
              <th className="px-3 py-2 border-r border-slate-300 min-w-[100px]">
                ID Presensi
              </th>
              
              <th 
                onClick={() => handleSort('date')}
                className="px-3 py-2 border-r border-slate-300 min-w-[110px] cursor-pointer hover:bg-slate-200/60 transition"
              >
                <div className="flex items-center gap-1">
                  <span>Tanggal & Jam</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="px-3 py-2 border-r border-slate-300 min-w-[110px]">
                RFID UID
              </th>

              <th 
                onClick={() => handleSort('studentName')}
                className="px-3 py-2 border-r border-slate-300 min-w-[180px] cursor-pointer hover:bg-slate-200/60 transition"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Santri</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="px-3 py-2 border-r border-slate-300 min-w-[150px]">
                Nama Masjid
              </th>

              <th className="px-3 py-2 border-r border-slate-300 min-w-[100px]">
                Waktu Sholat
              </th>

              <th className="px-3 py-2 border-r border-slate-300 min-w-[110px] text-right">
                Poin Wudhu (5)
              </th>

              {/* H: Sunnah Qobliyah (Sebelum Sholat Wajib) */}
              <th className="px-3 py-2 border-r border-slate-300 min-w-[130px] text-right bg-sky-50/50 text-sky-950 font-bold">
                Sunnah Qobliyah (5/10)
              </th>

              {/* I: Sholat Wajib */}
              <th className="px-3 py-2 border-r border-slate-300 min-w-[135px] text-right bg-emerald-50/40 text-emerald-950 font-bold">
                Sholat Wajib (10/20)
              </th>

              {/* J: Sunnah Ba'diyah (Setelah Sholat Wajib) */}
              <th className="px-3 py-2 border-r border-slate-300 min-w-[130px] text-right bg-teal-50/50 text-teal-950 font-bold">
                Sunnah Ba'diyah (5)
              </th>

              <th className="px-3 py-2 border-r border-slate-300 min-w-[110px] text-right">
                Dzikir & Doa (5)
              </th>

              <th 
                onClick={() => handleSort('totalPoints')}
                className="px-3 py-2 border-r border-slate-300 min-w-[110px] text-right bg-emerald-50 text-emerald-900 cursor-pointer hover:bg-emerald-100 transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Poin</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                </div>
              </th>

              <th className="px-3 py-2 border-r border-slate-300 min-w-[120px]">
                Verifikasi Mesin
              </th>

              <th className="px-2 py-2 text-center w-24">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Table Body Grid */}
          <tbody className="divide-y divide-slate-200">
            {sorted.map((record, index) => {
              const rowNum = index + 2; // Row 1 is header
              const isCoordSelected = (coord: string) => selectedCoordinate === coord;
              const isRowSelected = selectedIds.includes(record.id);

              return (
                <tr 
                  key={record.id}
                  className={`transition-colors group ${
                    isRowSelected ? 'bg-rose-50/60 hover:bg-rose-50' : 'hover:bg-blue-50/50'
                  }`}
                >
                  {/* Row Number + Checkbox (Google Sheets Left Gutter) */}
                  <td className="w-14 px-2 py-1.5 bg-slate-100 border-r border-slate-300 text-center font-mono text-[11px] text-slate-600 font-semibold select-none group-hover:bg-slate-200">
                    <div className="flex items-center justify-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={(e) => handleToggleRow(record.id, e)}
                        className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>{rowNum}</span>
                    </div>
                  </td>

                  {/* A: ID Presensi */}
                  <td 
                    onClick={() => onSelectCell(`A${rowNum}`, record.id)}
                    className={`px-3 py-1.5 border-r border-slate-200 font-mono text-[11px] text-slate-500 truncate max-w-[110px] cursor-pointer ${
                      isCoordSelected(`A${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    {record.id.slice(-8)}
                  </td>

                  {/* B: Tanggal & Jam */}
                  <td 
                    onClick={() => onSelectCell(`B${rowNum}`, `${record.date} ${record.time}`)}
                    className={`px-3 py-1.5 border-r border-slate-200 whitespace-nowrap cursor-pointer ${
                      isCoordSelected(`B${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-800">{record.date}</div>
                    <div className="text-[10px] font-mono text-slate-500">{record.time}</div>
                  </td>

                  {/* C: RFID UID */}
                  <td 
                    onClick={() => onSelectCell(`C${rowNum}`, record.rfidCardUid)}
                    className={`px-3 py-1.5 border-r border-slate-200 font-mono cursor-pointer ${
                      isCoordSelected(`C${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-[10px]">
                      💳 {record.rfidCardUid}
                    </span>
                  </td>

                  {/* D: Nama Santri */}
                  <td 
                    onClick={() => onSelectCell(`D${rowNum}`, record.studentName)}
                    className={`px-3 py-1.5 border-r border-slate-200 font-medium text-slate-900 cursor-pointer ${
                      isCoordSelected(`D${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-800 hover:text-emerald-700 transition">
                      {record.studentName}
                    </div>
                  </td>

                  {/* E: Nama Masjid */}
                  <td 
                    onClick={() => onSelectCell(`E${rowNum}`, record.halaqah)}
                    className={`px-3 py-1.5 border-r border-slate-200 text-slate-700 font-medium truncate max-w-[160px] cursor-pointer ${
                      isCoordSelected(`E${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <span>🕌</span> {record.halaqah}
                    </span>
                  </td>

                  {/* F: Waktu Sholat */}
                  <td 
                    onClick={() => onSelectCell(`F${rowNum}`, record.prayerType)}
                    className={`px-3 py-1.5 border-r border-slate-200 cursor-pointer ${
                      isCoordSelected(`F${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${prayerBadge(record.prayerType)}`}>
                      {record.prayerType}
                    </span>
                  </td>

                  {/* G: Poin Wudhu */}
                  <td 
                    onClick={() => onSelectCell(`G${rowNum}`, `${record.pointsWudhu}`)}
                    className={`px-3 py-1.5 border-r border-slate-200 text-right cursor-pointer ${
                      isCoordSelected(`G${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <span className="font-bold text-slate-800 font-mono">+{record.pointsWudhu}</span>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {record.wudhuQuality}
                    </div>
                  </td>

                  {/* H: Sunnah Qobliyah (Sebelum Sholat Wajib) */}
                  {(() => {
                    const ptsQobliyah = record.pointsSunnahQobliyah !== undefined 
                      ? record.pointsSunnahQobliyah 
                      : (record.prayerType === 'Subuh' ? record.pointsSholatSunah : (record.pointsSholatSunah > 0 ? 5 : 0));
                    const labelQobliyah = record.sholatSunahQobliyahQuality 
                      ? String(record.sholatSunahQobliyahQuality).replace('_', ' ')
                      : (ptsQobliyah > 0 ? (record.prayerType === 'Subuh' ? '2 Rakaat Fajar' : 'Qobliyah Rawatib') : 'Tidak');
                    return (
                      <td 
                        onClick={() => onSelectCell(`H${rowNum}`, `${ptsQobliyah}`)}
                        className={`px-3 py-1.5 border-r border-slate-200 text-right cursor-pointer bg-sky-50/20 ${
                          isCoordSelected(`H${rowNum}`) ? 'outline-2 outline-emerald-600 bg-sky-100/60 z-10' : ''
                        }`}
                      >
                        <span className={`font-bold font-mono ${ptsQobliyah > 0 ? 'text-sky-800' : 'text-slate-400'}`}>
                          +{ptsQobliyah}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize truncate max-w-[110px]">
                          {labelQobliyah}
                        </div>
                      </td>
                    );
                  })()}

                  {/* I: Sholat Wajib */}
                  <td 
                    onClick={() => onSelectCell(`I${rowNum}`, `${record.pointsSholatWajib}`)}
                    className={`px-3 py-1.5 border-r border-slate-200 text-right cursor-pointer bg-emerald-50/20 ${
                      isCoordSelected(`I${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-100/60 z-10' : ''
                    }`}
                  >
                    <span className="font-bold text-slate-900 font-mono">+{record.pointsSholatWajib}</span>
                    <div className="text-[10px] text-slate-500 capitalize truncate max-w-[120px]">
                      {record.sholatWajibQuality.replace('_', ' ')}
                    </div>
                  </td>

                  {/* J: Sunnah Ba'diyah (Setelah Sholat Wajib) */}
                  {(() => {
                    const isNoBadiyah = record.prayerType === 'Subuh' || record.prayerType === 'Ashar';
                    const ptsBadiyah = isNoBadiyah 
                      ? 0 
                      : (record.pointsSunnahBadiyah !== undefined ? record.pointsSunnahBadiyah : 5);
                    const labelBadiyah = isNoBadiyah 
                      ? 'Tidak ada sunnah'
                      : (record.sholatSunahBadiyahQuality 
                          ? String(record.sholatSunahBadiyahQuality).replace('_', ' ')
                          : (ptsBadiyah > 0 ? "Ba'diyah Rawatib" : 'Tidak'));
                    return (
                      <td 
                        onClick={() => onSelectCell(`J${rowNum}`, `${ptsBadiyah}`)}
                        className={`px-3 py-1.5 border-r border-slate-200 text-right cursor-pointer bg-teal-50/20 ${
                          isCoordSelected(`J${rowNum}`) ? 'outline-2 outline-emerald-600 bg-teal-100/60 z-10' : ''
                        }`}
                      >
                        <span className={`font-bold font-mono ${ptsBadiyah > 0 ? 'text-teal-800' : 'text-slate-400'}`}>
                          +{ptsBadiyah}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize truncate max-w-[110px]">
                          {labelBadiyah}
                        </div>
                      </td>
                    );
                  })()}

                  {/* K: Dzikir & Doa */}
                  <td 
                    onClick={() => onSelectCell(`K${rowNum}`, `${record.bonusAdab}`)}
                    className={`px-3 py-1.5 border-r border-slate-200 text-right font-mono cursor-pointer ${
                      isCoordSelected(`K${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <span className={record.bonusAdab > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      +{record.bonusAdab}
                    </span>
                  </td>

                  {/* L: Total Poin (Formula =SUM(G:K)) */}
                  <td 
                    onClick={() => onSelectCell(`L${rowNum}`, `=SUM(G${rowNum}:K${rowNum}) -> ${record.totalPoints}`)}
                    className={`px-3 py-1.5 border-r border-slate-200 text-right bg-emerald-50/50 cursor-pointer ${
                      isCoordSelected(`L${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-100 z-10' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-800 font-mono text-[13px]">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {record.totalPoints}
                    </span>
                  </td>

                  {/* M: Verifikasi Oleh */}
                  <td 
                    onClick={() => onSelectCell(`M${rowNum}`, record.verifiedBy)}
                    className={`px-3 py-1.5 border-r border-slate-200 text-slate-600 cursor-pointer ${
                      isCoordSelected(`M${rowNum}`) ? 'outline-2 outline-emerald-600 bg-emerald-50/60 z-10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[100px]">{record.verifiedBy}</span>
                    </div>
                  </td>

                  {/* Action Column: Edit Detil, Nol-kan Poin & Hapus Baris */}
                  <td className="px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRecord(record);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                        title="Edit & koreksi rincian penilaian ibadah santri"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      </button>

                      {onZeroPointsMultiple && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promptZeroSingle(record.id, record.studentName, record.prayerType);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                          title="Nol-kan poin presensi ini"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          promptDeleteSingle(record.id, record.studentName, record.prayerType);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Hapus baris absensi & kurangi poin santri"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-600">Tidak ada data absensi yang sesuai filter</p>
                    <p className="text-xs text-slate-400">Gunakan tombol 'Kiosk Tap RFID' untuk mulai absensi santri di masjid.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {/* Bottom Spreadsheet Aggregate / Formula Summary Row */}
          <tfoot className="sticky bottom-0 z-10 bg-slate-100 font-mono font-bold text-slate-800 border-t-2 border-slate-300 text-[11px] shadow-xs">
            <tr>
              <td className="w-10 px-2 py-2 bg-slate-300 border-r border-slate-400 text-center text-slate-700">
                ∑
              </td>
              <td className="px-3 py-2 border-r border-slate-300">
                =COUNT({totalRows})
              </td>
              <td colSpan={4} className="px-3 py-2 border-r border-slate-300 font-sans text-slate-600">
                Ringkasan Rata-rata & Total Poin Santri
              </td>
              <td className="px-3 py-2 border-r border-slate-300 text-right text-slate-700">
                Avg: {avgWudhu}
              </td>
              <td className="px-3 py-2 border-r border-slate-300 text-right text-sky-800">
                Avg: {avgQobliyah}
              </td>
              <td className="px-3 py-2 border-r border-slate-300 text-right text-slate-800">
                Avg: {avgWajib}
              </td>
              <td className="px-3 py-2 border-r border-slate-300 text-right text-teal-800">
                Avg: {avgBadiyah}
              </td>
              <td className="px-3 py-2 border-r border-slate-300 text-right text-slate-700">
                -
              </td>
              <td className="px-3 py-2 border-r border-slate-300 text-right bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                =SUM({totalPointsSum.toLocaleString()})
              </td>
              <td colSpan={2} className="px-3 py-2 text-slate-500 font-sans font-normal text-[10px]">
                Avg per sesi: {avgPoints} poin
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Delete Date Range Modal */}
      {isDeleteModalOpen && (
        <DeleteDateRangeModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          records={records}
          onDeleteRange={onDeleteDateRange || (() => {})}
          onDelete18To21Sept={onDeleteRecords18To21Sept || (() => {})}
          onDeleteSpecificIds={onDeleteMultipleRecords}
          onZeroPointsForIds={onZeroPointsMultiple}
          onApplyDateFilter={(s, e) => {
            setDateRangeStart(s);
            setDateRangeEnd(e);
            setIsDateRangeActive(true);
          }}
          initialStartDate={dateRangeStart || '2026-09-18'}
          initialEndDate={dateRangeEnd || '2026-09-21'}
        />
      )}

      {/* Sleek In-App Confirmation Modal (Zero browser popup blocking) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              confirmDialog.danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {confirmDialog.danger ? <Trash2 className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={`flex-1 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                  confirmDialog.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Detail Penilaian Modal */}
      <EditDetailPenilaianModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onSave={(updatedRecord) => {
          if (onUpdateRecord) {
            onUpdateRecord(updatedRecord);
          }
          setToastMessage(`Penilaian ${updatedRecord.studentName} (${updatedRecord.prayerType}) berhasil diperbarui!`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* Floating Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
