import React, { useState } from 'react';
import { UserPlus, X, Sparkles, Check } from 'lucide-react';
import { 
  Student, 
  AttendanceRecord, 
  PrayerSchedule, 
  PrayerType, 
  WudhuQuality, 
  SholatWajibQuality, 
  SholatSunahQuality,
  SunnahQobliyahQuality,
  SunnahBadiyahQuality
} from '../../types';
import { calculatePoints, POINT_CONFIG } from '../../data/pointConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schedule: PrayerSchedule | null;
  onSave: (record: AttendanceRecord) => void;
}

export const AddAttendanceManualModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  schedule,
  onSave,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  const [prayerType, setPrayerType] = useState<PrayerType>('Maghrib');
  const [wudhuQuality, setWudhuQuality] = useState<WudhuQuality>('sempurna');
  const [qobliyah, setQobliyah] = useState<SunnahQobliyahQuality>('qobliyah');
  const [sholatWajib, setSholatWajib] = useState<SholatWajibQuality>('jamaah_shaf1');
  const [badiyah, setBadiyah] = useState<SunnahBadiyahQuality>('badiyah');
  const [sholatSunah, setSholatSunah] = useState<SholatSunahQuality>('rawatib');
  const [doaDzikir, setDoaDzikir] = useState(true);
  const [notes, setNotes] = useState('Input manual (Santri lupa bawa kartu RFID)');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const points = calculatePoints(
    prayerType, 
    wudhuQuality, 
    sholatWajib, 
    sholatSunah, 
    doaDzikir,
    qobliyah,
    badiyah
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const record: AttendanceRecord = {
      id: `att-man-${Date.now().toString().slice(-6)}`,
      date,
      time,
      rfidCardUid: selectedStudent.rfidCardUid,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      halaqah: selectedStudent.halaqah,
      prayerType,
      wudhuQuality,
      pointsWudhu: points.pointsWudhu,
      sholatSunahQobliyahQuality: qobliyah,
      pointsSunnahQobliyah: points.pointsSunnahQobliyah,
      sholatWajibQuality: sholatWajib,
      pointsSholatWajib: points.pointsSholatWajib,
      sholatSunahBadiyahQuality: badiyah,
      pointsSunnahBadiyah: points.pointsSunnahBadiyah,
      sholatSunahQuality: sholatSunah,
      pointsSholatSunah: points.pointsSholatSunah,
      bonusAdab: points.bonusAdab,
      totalPoints: points.totalPoints,
      verifiedBy: 'Input Manual (Ustadz)',
      notes: notes.trim(),
      syncedToGoogleSheet: true
    };

    onSave(record);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Input Absensi Sholat Manual
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Pilih Santri *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 font-semibold"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - 🕌 {s.halaqah} (RFID: {s.rfidCardUid})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Waktu Sholat
              </label>
              <select
                value={prayerType}
                onChange={(e) => setPrayerType(e.target.value as PrayerType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="Subuh">Subuh</option>
                <option value="Dzuhur">Dzuhur</option>
                <option value="Ashar">Ashar</option>
                <option value="Maghrib">Maghrib</option>
                <option value="Isya">Isya</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jam
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Wudhu */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kualitas Wudhu (5 Poin)
            </label>
            <select
              value={wudhuQuality}
              onChange={(e) => setWudhuQuality(e.target.value as WudhuQuality)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="sempurna">Tertib & Sempurna (+5)</option>
              <option value="mandiri">Mandiri & Rata (+5)</option>
              <option value="bimbingan">Perlu Bimbingan (+3)</option>
              <option value="tidak">Tidak Wudhu di Masjid (0)</option>
            </select>
          </div>

          {/* 1. Sholat Sunnah Qobliyah (Sebelum Sholat Wajib) */}
          <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-200">
            <label className="block font-bold text-sky-900 mb-1 flex items-center justify-between">
              <span>Sholat Sunnah Qobliyah ({prayerType === 'Subuh' ? 'Fajar: 10' : '5'} Poin)</span>
              <span className="text-sky-700 font-mono font-bold">
                +{qobliyah === 'tidak' ? 0 : (prayerType === 'Subuh' ? 10 : 5)} Poin
              </span>
            </label>
            <select
              value={qobliyah}
              onChange={(e) => setQobliyah(e.target.value as SunnahQobliyahQuality)}
              className="w-full px-3 py-2 border border-sky-300 bg-white rounded-lg outline-none focus:border-sky-500"
            >
              {prayerType === 'Subuh' ? (
                <>
                  <option value="qobliyah">2 Rakaat Fajar / Qobliyah Subuh (+10)</option>
                  <option value="tahiyyatul_masjid">Tahiyyatul Masjid (+10)</option>
                  <option value="tidak">Tidak Sholat Qobliyah (0)</option>
                </>
              ) : (
                <>
                  <option value="qobliyah">Sunnah Qobliyah Rawatib (+5)</option>
                  <option value="tahiyyatul_masjid">Tahiyyatul Masjid (+5)</option>
                  <option value="tidak">Tidak Sholat Qobliyah (0)</option>
                </>
              )}
            </select>
          </div>

          {/* 2. Sholat Wajib Berjamaah */}
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
            <label className="block font-bold text-emerald-900 mb-1 flex items-center justify-between">
              <span>Sholat Wajib Berjamaah ({prayerType === 'Subuh' ? 'Subuh: 20' : '10'} Poin)</span>
              <span className="text-emerald-700 font-mono font-bold">
                +{points.pointsSholatWajib} Poin
              </span>
            </label>
            <select
              value={sholatWajib}
              onChange={(e) => setSholatWajib(e.target.value as SholatWajibQuality)}
              className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg outline-none focus:border-emerald-500"
            >
              {prayerType === 'Subuh' ? (
                <>
                  <option value="jamaah_shaf1">Wajib Subuh Berjamaah - Shaf Pertama (+20)</option>
                  <option value="jamaah_belakang">Wajib Subuh Berjamaah - Shaf Belakang (+20)</option>
                  <option value="masbuq">Wajib Subuh Masbuq (+20)</option>
                  <option value="munfarid">Wajib Subuh Munfarid (+20)</option>
                  <option value="tidak">Tidak Sholat Subuh (0)</option>
                </>
              ) : (
                <>
                  <option value="jamaah_shaf1">Wajib Berjamaah - Shaf Pertama (+10)</option>
                  <option value="jamaah_belakang">Wajib Berjamaah - Shaf Belakang (+10)</option>
                  <option value="masbuq">Wajib Masbuq (+10)</option>
                  <option value="munfarid">Wajib Munfarid (+10)</option>
                  <option value="tidak">Tidak Sholat Wajib (0)</option>
                </>
              )}
            </select>
          </div>

          {/* 3. Sholat Sunnah Ba'diyah (Setelah Sholat Wajib) */}
          <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
            <label className="block font-bold text-teal-900 mb-1 flex items-center justify-between">
              <span>Sholat Sunnah Ba'diyah ({prayerType === 'Subuh' || prayerType === 'Ashar' ? 'Tidak Ada' : '5 Poin'})</span>
              <span className="text-teal-700 font-mono font-bold">
                +{points.pointsSunnahBadiyah} Poin
              </span>
            </label>
            {prayerType === 'Subuh' || prayerType === 'Ashar' ? (
              <div className="text-xs text-slate-500 italic p-2 bg-slate-100 rounded">
                Tidak disyariatkan sholat sunnah ba'diyah setelah sholat {prayerType}.
              </div>
            ) : (
              <select
                value={badiyah}
                onChange={(e) => setBadiyah(e.target.value as SunnahBadiyahQuality)}
                className="w-full px-3 py-2 border border-teal-300 bg-white rounded-lg outline-none focus:border-teal-500"
              >
                <option value="badiyah">Sunnah Ba'diyah Rawatib (+5)</option>
                <option value="tidak">Tidak Sholat Ba'diyah (0)</option>
              </select>
            )}
          </div>

          {/* Dzikir dan Doa (menggantikan bonus adab) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Dzikir dan Doa Ba'da Sholat:</span>
              <span className="text-emerald-600 font-mono font-bold">+{doaDzikir ? 5 : 0} Poin</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer p-1">
              <input
                type="checkbox"
                checked={doaDzikir}
                onChange={(e) => setDoaDzikir(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Mengikuti Dzikir dan Doa Bersama Ba'da Sholat (+5 Poin)
              </span>
            </label>
          </div>

          {/* Total Calculated Points Preview */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
            <span className="font-bold text-emerald-900">Total Poin Dihasilkan:</span>
            <span className="font-mono text-lg font-black text-emerald-800">
              +{points.totalPoints} Poin
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition"
            >
              Simpan Presensi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
