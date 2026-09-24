import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Award, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Printer, 
  Download,
  Flame,
  Clock,
  Info,
  RefreshCw,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { AttendanceRecord, Student, PrayerType } from '../../types';
import { getTodayDateLocal } from '../../data/initialData';
import { navigateToDailyRanking } from '../../services/kioskRoutingService';

interface Props {
  records: AttendanceRecord[];
  students: Student[];
  onSyncData?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
}

export const LaporanHarianView: React.FC<Props> = ({ 
  records, 
  students,
  onSyncData,
  isSyncing,
  lastSyncTime
}) => {
  const todayStr = getTodayDateLocal();

  // Find dates available in records
  const availableDates = Array.from(new Set(records.map(r => r.date))).sort().reverse();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today if desired, or latest available date
    return availableDates[0] || todayStr;
  });

  const isTodayOrFuture = selectedDate >= todayStr;
  const dayRecords = records.filter(r => r.date === selectedDate);
  const totalStudentsCount = students.length;

  // Breakdown per prayer
  const prayers: PrayerType[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  const prayerCounts: Record<PrayerType, number> = {
    Subuh: dayRecords.filter(r => r.prayerType === 'Subuh').length,
    Dzuhur: dayRecords.filter(r => r.prayerType === 'Dzuhur').length,
    Ashar: dayRecords.filter(r => r.prayerType === 'Ashar').length,
    Maghrib: dayRecords.filter(r => r.prayerType === 'Maghrib').length,
    Isya: dayRecords.filter(r => r.prayerType === 'Isya').length,
  };

  const totalPointsDay = dayRecords.reduce((acc, r) => acc + r.totalPoints, 0);
  const avgPointsPerSession = dayRecords.length > 0 ? Math.round(totalPointsDay / dayRecords.length) : 0;

  // Top student of the day (highest accumulated points on this date)
  const studentDayScores: Record<string, { studentName: string; halaqah: string; points: number; count: number }> = {};
  dayRecords.forEach(r => {
    if (!studentDayScores[r.studentId]) {
      studentDayScores[r.studentId] = { studentName: r.studentName, halaqah: r.halaqah, points: 0, count: 0 };
    }
    studentDayScores[r.studentId].points += r.totalPoints;
    studentDayScores[r.studentId].count += 1;
  });

  const sortedTopToday = Object.values(studentDayScores).sort((a, b) => b.points - a.points);
  const topStudentToday = sortedTopToday[0];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-6 select-text">
      {/* Top Header & Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Laporan Harian Absensi Sholat Santri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi kehadiran 5 waktu sholat, poin wudhu, sholat wajib & sunnah per tanggal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToDailyRanking(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-md text-xs shadow-2xs transition cursor-pointer active:scale-95"
            title="Buka Jendela Peringkat Harian Santri (Link Publik dapat dibagikan)"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Peringkat Harian (Publik)</span>
          </button>
          {onSyncData && (
            <button
              onClick={onSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-60"
              title="Sinkronkan data absensi dan kalkulasi ulang seluruh poin santri ke Laporan Harian, Mingguan & Bulanan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkron Data & Poin</span>
            </button>
          )}
          <label className="text-xs font-semibold text-slate-600">Pilih Tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="flex items-center justify-between mt-2.5 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Laporan Harian Tersinkronisasi:</span>
          <span className="text-emerald-700 text-[11px]">
            {totalStudentsCount} Santri Terdata • {dayRecords.length} Kehadiran Sholat Hari Ini ({totalPointsDay} Poin)
          </span>
        </div>
        <span className="text-[11px] text-emerald-600 font-medium">
          {lastSyncTime ? `Sinkron terakhir: ${lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Siaga'}
        </span>
      </div>

      {/* Quick Date Switcher */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap text-xs">
        <span className="text-slate-500 text-[11px] font-medium mr-1">Pilih Tanggal:</span>
        <button
          onClick={() => setSelectedDate(todayStr)}
          className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
            selectedDate === todayStr 
              ? 'bg-emerald-600 text-white shadow-2xs' 
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Hari Ini ({todayStr})
        </button>
        {availableDates.slice(0, 4).map(d => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              selectedDate === d 
                ? 'bg-emerald-600 text-white shadow-2xs' 
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Info notice when day has 0 records */}
      {dayRecords.length === 0 && (
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              {isTodayOrFuture ? 'Kegiatan Belum Terlaksana' : 'Tidak Ada Data Presensi'}
            </div>
            <div className="mt-0.5 text-amber-800 text-[11px]">
              {isTodayOrFuture 
                ? `Kegiatan sholat santri untuk tanggal ${selectedDate} belum terlaksana, sehingga seluruh presensi dan perhitungan poin masih 0. Poin akan otomatis bertambah ketika kartu RFID santri ditap saat waktu sholat tiba.`
                : `Tidak ada rekaman presensi santri yang tercatat pada tanggal ${selectedDate}.`}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Presensi Hari Ini</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2 font-mono">
            {dayRecords.length} <span className="text-xs text-slate-400 font-normal">sesi sholat</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari total {totalStudentsCount} santri terdaftar
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Poin Hari Ini</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
            {totalPointsDay.toLocaleString()} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rata-rata: {avgPointsPerSession} poin per waktu sholat
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Sholat Paling Ramai</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          {(() => {
            const mostAttended = Object.entries(prayerCounts).sort((a, b) => b[1] - a[1])[0];
            return (
              <>
                <div className="text-2xl font-extrabold text-slate-800 mt-2">
                  {mostAttended ? mostAttended[0] : '-'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Dihadiri {mostAttended ? mostAttended[1] : 0} santri berjamaah
                </div>
              </>
            );
          })()}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>Santri Bintang Hari Ini</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-extrabold text-emerald-950 mt-1 truncate">
            {topStudentToday ? topStudentToday.studentName : '-'}
          </div>
          <div className="text-xs text-emerald-700 font-medium">
            {topStudentToday ? `${topStudentToday.points} Poin (${topStudentToday.count} Waktu Sholat)` : 'Belum ada data'}
          </div>
        </div>
      </div>

      {/* Prayer Breakdown Bars */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mt-6">
        <h3 className="font-bold text-slate-800 text-sm mb-4">
          Tingkat Kehadiran Per Waktu Sholat ({selectedDate})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {prayers.map((prayer) => {
            const count = prayerCounts[prayer];
            const pct = Math.round((count / totalStudentsCount) * 100);
            return (
              <div key={prayer} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 text-xs">{prayer}</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700">{count}/{totalStudentsCount}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right mt-1 font-mono">
                  {pct}% kehadiran
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Log Table for Selected Day */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs mt-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Daftar Presensi Lengkap Tanggal {selectedDate}
          </h3>
          <span className="text-xs text-slate-500">
            Total {dayRecords.length} catatan verifikasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-3 py-2 w-10 text-center">No</th>
                <th className="px-3 py-2">Jam Scan</th>
                <th className="px-3 py-2">Nama Santri</th>
                <th className="px-3 py-2">Nama Masjid</th>
                <th className="px-3 py-2">Sholat</th>
                <th className="px-3 py-2 text-right">Poin Wudhu</th>
                <th className="px-3 py-2 text-right bg-sky-50/50 text-sky-950">Qobliyah</th>
                <th className="px-3 py-2 text-right bg-emerald-50/50 text-emerald-950">Wajib</th>
                <th className="px-3 py-2 text-right bg-teal-50/50 text-teal-950">Ba'diyah</th>
                <th className="px-3 py-2 text-right">Dzikir & Doa</th>
                <th className="px-3 py-2 text-right bg-emerald-50 text-emerald-900 font-bold">Total Poin</th>
                <th className="px-3 py-2">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {dayRecords.map((r, idx) => {
                const qobliyahPts = r.pointsSunnahQobliyah ?? (r.prayerType === 'Subuh' ? (r.pointsSholatSunah ?? 0) : Math.min(5, r.pointsSholatSunah ?? 0));
                const badiyahPts = r.pointsSunnahBadiyah ?? (r.prayerType === 'Subuh' || r.prayerType === 'Ashar' ? 0 : Math.max(0, (r.pointsSholatSunah ?? 0) - 5));

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">{r.time}</td>
                    <td className="px-3 py-2 font-sans font-bold text-slate-900">{r.studentName}</td>
                    <td className="px-3 py-2 font-sans text-slate-700 font-medium truncate max-w-[150px]">
                      <span className="inline-flex items-center gap-1">
                        <span>🕌</span> {r.halaqah}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-sans font-bold text-emerald-800">{r.prayerType}</td>
                    <td className="px-3 py-2 text-right text-slate-700">+{r.pointsWudhu}</td>
                    <td className="px-3 py-2 text-right text-sky-800 bg-sky-50/30 font-semibold">+{qobliyahPts}</td>
                    <td className="px-3 py-2 text-right text-emerald-900 bg-emerald-50/30 font-semibold">+{r.pointsSholatWajib}</td>
                    <td className="px-3 py-2 text-right text-teal-800 bg-teal-50/30 font-semibold">+{badiyahPts}</td>
                    <td className="px-3 py-2 text-right text-amber-600">+{r.bonusAdab}</td>
                    <td className="px-3 py-2 text-right bg-emerald-50/70 font-extrabold text-emerald-900 text-xs">
                      {r.totalPoints}
                    </td>
                    <td className="px-3 py-2 font-sans text-slate-500 text-[10px]">{r.verifiedBy}</td>
                  </tr>
                );
              })}
              {dayRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Clock className="w-7 h-7 text-amber-500/80 mb-1" />
                      <p className="font-bold text-slate-700 text-sm">
                        {isTodayOrFuture 
                          ? `Kegiatan Sholat Belum Terlaksana (${selectedDate})`
                          : `Tidak Ada Catatan Presensi (${selectedDate})`}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {isTodayOrFuture
                          ? 'Perhitungan poin dan presensi hari ini & berikutnya masih 0. Data presensi akan tercatat otomatis saat santri melakukan absensi kartu RFID di masjid.'
                          : 'Tidak ditemukan rekaman presensi santri untuk tanggal ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
