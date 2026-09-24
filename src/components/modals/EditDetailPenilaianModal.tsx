import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Trash2, 
  Edit3, 
  Save, 
  PlusCircle, 
  MinusCircle, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AttendanceRecord, WudhuQuality, SholatWajibQuality, SunnahQobliyahQuality, SunnahBadiyahQuality } from '../../types';
import { POINT_CONFIG } from '../../data/pointConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSave: (updatedRecord: AttendanceRecord) => void;
}

export const EditDetailPenilaianModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  if (!isOpen || !record) return null;

  const isSubuh = record.prayerType === 'Subuh';

  // Local state for each activity points and qualities
  const [wudhuQuality, setWudhuQuality] = useState<WudhuQuality>(record.wudhuQuality || 'tidak');
  const [pointsWudhu, setPointsWudhu] = useState<number>(record.pointsWudhu || 0);

  const [qobliyahQuality, setQobliyahQuality] = useState<SunnahQobliyahQuality>((record.sholatSunahQobliyahQuality as SunnahQobliyahQuality) || 'tidak');
  const [pointsQobliyah, setPointsQobliyah] = useState<number>(record.pointsSunnahQobliyah || 0);

  const [sholatWajibQuality, setSholatWajibQuality] = useState<SholatWajibQuality>(record.sholatWajibQuality || 'tidak');
  const [pointsSholatWajib, setPointsSholatWajib] = useState<number>(record.pointsSholatWajib || 0);

  const [badiyahQuality, setBadiyahQuality] = useState<SunnahBadiyahQuality>((record.sholatSunahBadiyahQuality as SunnahBadiyahQuality) || 'tidak');
  const [pointsBadiyah, setPointsBadiyah] = useState<number>(record.pointsSunnahBadiyah || 0);

  const [bonusAdab, setBonusAdab] = useState<number>(record.bonusAdab || 0);
  const [notes, setNotes] = useState<string>(record.notes || '');

  // Computed Total
  const currentTotal = pointsWudhu + pointsQobliyah + pointsSholatWajib + pointsBadiyah + bonusAdab;

  const handleSetWudhu = (quality: WudhuQuality) => {
    setWudhuQuality(quality);
    if (quality === 'tidak') {
      setPointsWudhu(0);
    } else {
      setPointsWudhu(POINT_CONFIG.wudhu[quality]?.points || 0);
    }
  };

  const handleSetQobliyah = (quality: SunnahQobliyahQuality) => {
    setQobliyahQuality(quality);
    if (quality === 'tidak') {
      setPointsQobliyah(0);
    } else {
      const pts = isSubuh ? POINT_CONFIG.qobliyah.subuh.points : POINT_CONFIG.qobliyah.selainSubuh.points;
      setPointsQobliyah(pts);
    }
  };

  const handleSetWajib = (quality: SholatWajibQuality) => {
    setSholatWajibQuality(quality);
    if (quality === 'tidak') {
      setPointsSholatWajib(0);
    } else {
      const config = isSubuh ? POINT_CONFIG.sholatWajib.subuh : POINT_CONFIG.sholatWajib.selainSubuh;
      setPointsSholatWajib(config[quality]?.points || 0);
    }
  };

  const handleSetBadiyah = (quality: SunnahBadiyahQuality) => {
    setBadiyahQuality(quality);
    if (quality === 'tidak') {
      setPointsBadiyah(0);
    } else {
      setPointsBadiyah(POINT_CONFIG.badiyah.selainSubuh.points);
    }
  };

  const handleResetAllToZero = () => {
    if (confirm('Hapus seluruh nilai untuk kegiatan presensi ini menjadi 0 poin?')) {
      setWudhuQuality('tidak');
      setPointsWudhu(0);
      setQobliyahQuality('tidak');
      setPointsQobliyah(0);
      setSholatWajibQuality('tidak');
      setPointsSholatWajib(0);
      setBadiyahQuality('tidak');
      setPointsBadiyah(0);
      setBonusAdab(0);
      setNotes((prev) => (prev ? `${prev} (Nilai direset 0 oleh Ustadz)` : 'Koreksi: Seluruh nilai direset 0'));
    }
  };

  const handleSave = () => {
    const updated: AttendanceRecord = {
      ...record,
      wudhuQuality,
      pointsWudhu,
      sholatSunahQobliyahQuality: qobliyahQuality,
      pointsSunnahQobliyah: pointsQobliyah,
      sholatWajibQuality,
      pointsSholatWajib,
      sholatSunahBadiyahQuality: badiyahQuality,
      pointsSunnahBadiyah: pointsBadiyah,
      bonusAdab,
      totalPoints: currentTotal,
      notes: notes.trim()
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm md:text-base text-white">Edit & Koreksi Detil Penilaian Ibadah</h3>
              <p className="text-[11px] text-slate-400">
                Santri: <strong className="text-emerald-400">{record.studentName}</strong> • Sholat {record.prayerType} • {record.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Info bar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px]">Masjid / Halaqah:</div>
              <div className="font-bold text-slate-800">🕌 {record.halaqah}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[11px]">Waktu Presensi:</div>
              <div className="font-mono font-bold text-slate-700">{record.time} WIB</div>
            </div>
          </div>

          {/* Activity 1: Wudhu */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                💧 1. Penilaian Wudhu
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Poin:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={pointsWudhu}
                  onChange={(e) => setPointsWudhu(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 border rounded text-right font-mono font-bold text-emerald-700 bg-emerald-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetWudhu('sempurna')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  wudhuQuality === 'sempurna' && pointsWudhu > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Sempurna (+10)
              </button>
              <button
                type="button"
                onClick={() => handleSetWudhu('mandiri')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  wudhuQuality === 'mandiri' && pointsWudhu > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mandiri (+7)
              </button>
              <button
                type="button"
                onClick={() => handleSetWudhu('bimbingan')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  wudhuQuality === 'bimbingan' && pointsWudhu > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Bimbingan (+4)
              </button>
              <button
                type="button"
                onClick={() => handleSetWudhu('tidak')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  pointsWudhu === 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-50'
                }`}
              >
                Hapus Nilai (0)
              </button>
            </div>
          </div>

          {/* Activity 2: Sunnah Qobliyah */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                ✨ 2. Sholat Sunnah Qobliyah / Tahiyyatul Masjid
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Poin:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={pointsQobliyah}
                  onChange={(e) => setPointsQobliyah(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 border rounded text-right font-mono font-bold text-emerald-700 bg-emerald-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetQobliyah('qobliyah')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  qobliyahQuality === 'qobliyah' && pointsQobliyah > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Qobliyah (+{isSubuh ? 10 : 5})
              </button>
              <button
                type="button"
                onClick={() => handleSetQobliyah('tahiyyatul_masjid')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  qobliyahQuality === 'tahiyyatul_masjid' && pointsQobliyah > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tahiyyatul Masjid (+5)
              </button>
              <button
                type="button"
                onClick={() => handleSetQobliyah('tidak')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  pointsQobliyah === 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-50'
                }`}
              >
                Hapus Nilai (0)
              </button>
            </div>
          </div>

          {/* Activity 3: Sholat Wajib / Jumat */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                🕌 3. Sholat Fardu Berjamaah / Sholat Jumat
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Poin:</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={pointsSholatWajib}
                  onChange={(e) => setPointsSholatWajib(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 border rounded text-right font-mono font-bold text-emerald-700 bg-emerald-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetWajib('jamaah_shaf1')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  sholatWajibQuality === 'jamaah_shaf1' && pointsSholatWajib > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Shaf 1 (+{isSubuh ? 20 : 10})
              </button>
              <button
                type="button"
                onClick={() => handleSetWajib('jamaah_belakang')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  sholatWajibQuality === 'jamaah_belakang' && pointsSholatWajib > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Shaf Belakang (+{isSubuh ? 16 : 8})
              </button>
              <button
                type="button"
                onClick={() => handleSetWajib('masbuq')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  sholatWajibQuality === 'masbuq' && pointsSholatWajib > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Masbuq (+{isSubuh ? 10 : 5})
              </button>
              <button
                type="button"
                onClick={() => handleSetWajib('tidak')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  pointsSholatWajib === 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-50'
                }`}
              >
                Hapus Nilai (0)
              </button>
            </div>
          </div>

          {/* Activity 4: Sunnah Ba'diyah */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                🌿 4. Sholat Sunnah Ba'diyah
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Poin:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={pointsBadiyah}
                  onChange={(e) => setPointsBadiyah(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 border rounded text-right font-mono font-bold text-emerald-700 bg-emerald-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetBadiyah('badiyah')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  badiyahQuality === 'badiyah' && pointsBadiyah > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Ba'diyah (+5)
              </button>
              <button
                type="button"
                onClick={() => handleSetBadiyah('witir')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  badiyahQuality === 'witir' && pointsBadiyah > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Witir (+5)
              </button>
              <button
                type="button"
                onClick={() => handleSetBadiyah('tidak')}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  pointsBadiyah === 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-50'
                }`}
              >
                Hapus Nilai (0)
              </button>
            </div>
          </div>

          {/* Activity 5: Bonus Dzikir & Doa */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                🤲 5. Bonus Dzikir, Doa & Adab
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Poin:</span>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={bonusAdab}
                  onChange={(e) => setBonusAdab(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-1 border rounded text-right font-mono font-bold text-emerald-700 bg-emerald-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setBonusAdab(5)}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  bonusAdab > 0
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Ikut Dzikir & Doa (+5)
              </button>
              <button
                type="button"
                onClick={() => setBonusAdab(0)}
                className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition cursor-pointer ${
                  bonusAdab === 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-50'
                }`}
              >
                Hapus Nilai (0)
              </button>
            </div>
          </div>

          {/* Notes koreksi */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">
              Catatan Koreksi Penilaian (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Koreksi ustadz, santri menyusul wudhu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer with live sum & buttons */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs">Akumulasi Total:</span>
            <span className="font-mono text-xl font-black text-emerald-700">
              +{currentTotal} Poin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllToZero}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset 0</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Koreksi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
