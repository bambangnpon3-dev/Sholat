import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { isDateIn18To21SeptRange } from '../../data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  onDeleteRange: (startDate: string, endDate: string) => void;
  onDelete18To21Sept: () => void;
  onDeleteSpecificIds?: (ids: string[]) => void;
  onZeroPointsForIds?: (ids: string[]) => void;
  onApplyDateFilter?: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const DeleteDateRangeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  onDeleteRange,
  onDelete18To21Sept,
  onDeleteSpecificIds,
  onZeroPointsForIds,
  onApplyDateFilter,
  initialStartDate = '2026-09-18',
  initialEndDate = '2026-09-21'
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  
  // Action choice: 'delete' | 'zero_points' | 'filter_only' (Pilihan dihapus atau tidak)
  const [actionChoice, setActionChoice] = useState<'delete' | 'zero_points' | 'filter_only'>('delete');
  
  // Accordion to view matched records
  const [showRecordList, setShowRecordList] = useState(false);
  
  // Custom checklist of IDs within range
  const [selectedRangeIds, setSelectedRangeIds] = useState<string[]>([]);
  const [hasInitializedRangeSelection, setHasInitializedRangeSelection] = useState(false);

  // Records within selected custom range
  const recordsInRange = useMemo(() => {
    if (!startDate || !endDate) return [];
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  }, [records, startDate, endDate]);

  // Total points in range
  const totalPointsInRange = useMemo(() => {
    return recordsInRange.reduce((acc, r) => acc + r.totalPoints, 0);
  }, [recordsInRange]);

  // Keep selectedRangeIds in sync when range changes
  React.useEffect(() => {
    setSelectedRangeIds(recordsInRange.map(r => r.id));
    setHasInitializedRangeSelection(true);
  }, [recordsInRange]);

  if (!isOpen) return null;

  // Count records in preset 18/9 - 21/9
  const count18To21 = records.filter(r => isDateIn18To21SeptRange(r.date)).length;

  const handleApplyPreset18To21 = () => {
    setStartDate('2026-09-18');
    setEndDate('2026-09-21');
  };

  const handleApplyPresetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  };

  const handleApplyPresetLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const handleApplyPresetMonth = () => {
    setStartDate('2026-09-01');
    setEndDate('2026-09-30');
  };

  const handleApplyPresetAll = () => {
    if (records.length === 0) return;
    const sortedDates = [...records].map(r => r.date).sort();
    setStartDate(sortedDates[0]);
    setEndDate(sortedDates[sortedDates.length - 1]);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Toggle checklist of individual record
  const handleToggleRecord = (id: string) => {
    setSelectedRangeIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Checklist all / uncheck all in range
  const isAllRangeSelected = recordsInRange.length > 0 && selectedRangeIds.length === recordsInRange.length;
  const handleToggleSelectAllRange = () => {
    if (isAllRangeSelected) {
      setSelectedRangeIds([]);
    } else {
      setSelectedRangeIds(recordsInRange.map(r => r.id));
    }
  };

  const handleExecute = () => {
    setErrorMessage(null);
    if (!startDate || !endDate) {
      setErrorMessage('Pilih tanggal mulai dan tanggal selesai terlebih dahulu.');
      return;
    }
    if (startDate > endDate) {
      setErrorMessage('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
      return;
    }

    if (recordsInRange.length === 0 && actionChoice !== 'filter_only') {
      setErrorMessage(`Tidak ada data absensi yang ditemukan antara tanggal ${startDate} dan ${endDate}.`);
      return;
    }

    // PILIHAN 1: JANGAN DIHAPUS (Hanya Filter & Tinjau)
    if (actionChoice === 'filter_only') {
      if (onApplyDateFilter) {
        onApplyDateFilter(startDate, endDate);
      }
      onClose();
      return;
    }

    // Check if any items are selected
    const targetIds = selectedRangeIds.length > 0 ? selectedRangeIds : recordsInRange.map(r => r.id);
    if (targetIds.length === 0) {
      setErrorMessage('Centang minimal satu data absensi untuk diproses.');
      return;
    }

    // PILIHAN 2: NOL-KAN POIN (Presensi Tetap Ada / Jangan Dihapus)
    if (actionChoice === 'zero_points') {
      if (onZeroPointsForIds) {
        onZeroPointsForIds(targetIds);
      }
      onClose();
      return;
    }

    // PILIHAN 3: HAPUS DATA SECARA PERMANEN - Buka konfirmasi in-app
    if (actionChoice === 'delete') {
      setShowConfirmDelete(true);
    }
  };

  const handleConfirmFinalDelete = () => {
    const targetIds = selectedRangeIds.length > 0 ? selectedRangeIds : recordsInRange.map(r => r.id);
    const isDeletingWholeRange = targetIds.length === recordsInRange.length;

    if (isDeletingWholeRange) {
      onDeleteRange(startDate, endDate);
    } else if (onDeleteSpecificIds) {
      onDeleteSpecificIds(targetIds);
    } else {
      onDeleteRange(startDate, endDate);
    }
    onClose();
  };

  const handleExecuteDelete18To21 = () => {
    onDelete18To21Sept();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-red-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Pilih Rentang Tanggal & Kelola Presensi
              </h3>
              <p className="text-rose-200/90 text-xs mt-0.5">
                Ceklist total data, tentukan pilihan dihapus atau hanya ditinjau
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Inline Validation Error */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Target Shortcut: Tanggal 18/9 s.d. 21/9 (Jika masih ada) */}
          {count18To21 > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-200 text-rose-800">
                  Target Khusus
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-0.5">
                  Data 18/09 s.d. 21/09/2026 ({count18To21} Baris)
                </h4>
                <p className="text-[11px] text-slate-600">
                  Ditemukan data pada rentang target 18-21 Sept yang perlu dihapus.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExecuteDelete18To21}
                className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus 18-21/9</span>
              </button>
            </div>
          )}

          {/* 1. Pilih Rentang Tanggal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tentukan Rentang Tanggal:</span>
              </label>
              <span className="text-[11px] text-slate-500">Pilih tanggal mulai & selesai</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleApplyPresetToday}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleApplyPreset18To21}
                className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold transition cursor-pointer"
              >
                18 - 21 Sept
              </button>
              <button
                type="button"
                onClick={handleApplyPresetLast7Days}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={handleApplyPresetMonth}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
              >
                Bulan September
              </button>
              <button
                type="button"
                onClick={handleApplyPresetAll}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
              >
                Semua Tanggal
              </button>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-semibold">
                  Dari Tanggal Mulai:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-semibold">
                  Sampai Tanggal Selesai:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Live Records Detected & Checklist Counter */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-700 font-medium">
                  Terdeteksi ({startDate} s.d. {endDate}):
                </span>
              </div>
              <div className="text-right">
                <span className="font-extrabold font-mono text-slate-900 text-sm">
                  {recordsInRange.length}
                </span>
                <span className="text-slate-500 text-[11px] ml-1">
                  Baris ({totalPointsInRange} Poin)
                </span>
              </div>
            </div>
          </div>

          {/* 2. OPSI CEKLIST TOTAL DATA DALAM RENTANG INI */}
          {recordsInRange.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAllRangeModal"
                    checked={isAllRangeSelected}
                    onChange={handleToggleSelectAllRange}
                    className="rounded border-slate-400 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="selectAllRangeModal" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    Ceklist Semua Data Rentang Ini ({selectedRangeIds.length}/{recordsInRange.length} Baris Dipilih)
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRecordList(!showRecordList)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>{showRecordList ? 'Sembunyikan Rincian' : 'Lihat Rincian'}</span>
                  {showRecordList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Collapsible List of Records to Individually Check / Uncheck */}
              {showRecordList && (
                <div className="max-h-48 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 bg-white">
                  {recordsInRange.map((rec, idx) => {
                    const isChecked = selectedRangeIds.includes(rec.id);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleToggleRecord(rec.id)}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition select-none ${
                          isChecked ? 'bg-rose-50/60 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="rounded border-slate-400 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                          <span className="font-bold truncate max-w-[130px]">{rec.studentName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                            {rec.date} • {rec.prayerType}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-rose-600 text-[11px] shrink-0">
                          +{rec.totalPoints} Poin
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. PILIHAN DIHAPUS ATAU TIDAK (3 Pilihan Eksplisit) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>Pilihan Tindakan untuk Data Rentang Ini:</span>
            </label>

            <div className="space-y-2">
              {/* Option A: HAPUS DATA SECARA PERMANEN */}
              <label 
                className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  actionChoice === 'delete'
                    ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="actionChoice"
                  value="delete"
                  checked={actionChoice === 'delete'}
                  onChange={() => setActionChoice('delete')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Hapus Permanen Data Presensi
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">
                      Hapus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Seluruh {selectedRangeIds.length} data presensi yang dicentang akan <strong>dihapus total</strong>. Poin santri dan seluruh laporan akan otomatis dikalkulasi ulang.
                  </p>
                </div>
              </label>

              {/* Option B: NOL-KAN POIN (Presensi Tetap Ada / Jangan Dihapus) */}
              <label 
                className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  actionChoice === 'zero_points'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="actionChoice"
                  value="zero_points"
                  checked={actionChoice === 'zero_points'}
                  onChange={() => setActionChoice('zero_points')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Nol-kan Poin Saja (Jangan Hapus Catatan Presensi)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-800">
                      Reset Poin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Catatan kehadiran santri tetap tersimpan, namun perolehan poin sholat pada rentang ini diubah menjadi 0.
                  </p>
                </div>
              </label>

              {/* Option C: JANGAN DIHAPUS (Hanya Filter / Tinjau) */}
              <label 
                className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  actionChoice === 'filter_only'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="actionChoice"
                  value="filter_only"
                  checked={actionChoice === 'filter_only'}
                  onChange={() => setActionChoice('filter_only')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Jangan Dihapus (Hanya Tinjau & Terapkan Filter Tanggal)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800">
                      Tinjau Saja
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Data <strong>tidak dihapus sama sekali</strong>. Modal ditutup dan spreadsheet akan menampilkan data rentang tanggal ini agar Anda dapat meninjaunya dengan aman.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Info notice about instant recalculation */}
          {actionChoice !== 'filter_only' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sinkronisasi Poin & Laporan Otomatis:</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Setiap perubahan atau penghapusan data presensi akan langsung memperbarui total poin seluruh 58 santri, rekap Laporan Harian, Mingguan, dan Bulanan seketika.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {actionChoice === 'delete' && (
              <button
                type="button"
                onClick={handleExecute}
                disabled={recordsInRange.length === 0 || selectedRangeIds.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedRangeIds.length} Baris Data)</span>
              </button>
            )}

            {actionChoice === 'zero_points' && (
              <button
                type="button"
                onClick={handleExecute}
                disabled={recordsInRange.length === 0 || selectedRangeIds.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nol-kan Poin ({selectedRangeIds.length} Baris)</span>
              </button>
            )}

            {actionChoice === 'filter_only' && (
              <button
                type="button"
                onClick={handleExecute}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Terapkan Filter (Jangan Hapus)</span>
              </button>
            )}
          </div>
        </div>

        {/* In-Modal Direct Confirmation Dialog (Zero window.confirm) */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-rose-200 shadow-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">
                Konfirmasi Hapus Data
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yakin ingin menghapus <strong>{selectedRangeIds.length} baris</strong> data absensi dari rentang <strong>{startDate} s.d. {endDate}</strong>?
                <br />
                Poin santri dan seluruh laporan akan otomatis dikalkulasi ulang.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinalDelete}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  Ya, Hapus Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
