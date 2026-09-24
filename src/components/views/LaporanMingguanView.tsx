import React, { useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  BarChart3, 
  CalendarDays, 
  Printer, 
  Sparkles,
  Flame,
  CheckCircle2,
  Users,
  RefreshCw,
  Trophy,
  Medal,
  Star
} from 'lucide-react';
import { AttendanceRecord, Student, PrayerType } from '../../types';

interface Props {
  records: AttendanceRecord[];
  students: Student[];
  onSyncData?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
}

export const LaporanMingguanView: React.FC<Props> = ({ 
  records, 
  students,
  onSyncData,
  isSyncing,
  lastSyncTime
}) => {
  const [showTop3Only, setShowTop3Only] = useState(true);

  // Get past 7 dates from records
  const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort();
  const past7Dates = uniqueDates.slice(-7);

  // Daily statistics for past 7 days
  const dailyStats = past7Dates.map(dateStr => {
    const dayRecords = records.filter(r => r.date === dateStr);
    const dayName = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short' });
    const totalPts = dayRecords.reduce((acc, r) => acc + r.totalPoints, 0);
    return {
      date: dateStr,
      dayName,
      totalRecords: dayRecords.length,
      totalPoints: totalPts,
      avgPoints: dayRecords.length > 0 ? Math.round(totalPts / dayRecords.length) : 0,
      subuh: dayRecords.filter(r => r.prayerType === 'Subuh').length,
      dzuhur: dayRecords.filter(r => r.prayerType === 'Dzuhur').length,
      ashar: dayRecords.filter(r => r.prayerType === 'Ashar').length,
      maghrib: dayRecords.filter(r => r.prayerType === 'Maghrib').length,
      isya: dayRecords.filter(r => r.prayerType === 'Isya').length,
    };
  });

  const maxRecordsInADay = Math.max(...dailyStats.map(d => d.totalRecords), 1);

  // Student ranking for the week
  const studentWeeklyMap: Record<string, {
    student: Student;
    prayerCount: number;
    pointsTotal: number;
    subuhCount: number;
    wudhuTotal: number;
    qobliyahCount: number;
    badiyahCount: number;
  }> = {};

  students.forEach(s => {
    studentWeeklyMap[s.id] = {
      student: s,
      prayerCount: 0,
      pointsTotal: 0,
      subuhCount: 0,
      wudhuTotal: 0,
      qobliyahCount: 0,
      badiyahCount: 0
    };
  });

  records.filter(r => past7Dates.includes(r.date)).forEach(r => {
    if (studentWeeklyMap[r.studentId]) {
      studentWeeklyMap[r.studentId].prayerCount += 1;
      studentWeeklyMap[r.studentId].pointsTotal += r.totalPoints;
      studentWeeklyMap[r.studentId].wudhuTotal += r.pointsWudhu;
      if (r.prayerType === 'Subuh') {
        studentWeeklyMap[r.studentId].subuhCount += 1;
      }
      // Hitung Sunnah Qobliyah & Ba'diyah terpisah
      if ((r.pointsSunnahQobliyah && r.pointsSunnahQobliyah > 0) || (r.sholatSunahQobliyahQuality && r.sholatSunahQobliyahQuality !== 'tidak')) {
        studentWeeklyMap[r.studentId].qobliyahCount += 1;
      } else if (!r.sholatSunahQobliyahQuality && r.prayerType === 'Subuh' && r.pointsSholatSunah > 0) {
        studentWeeklyMap[r.studentId].qobliyahCount += 1;
      }

      if ((r.pointsSunnahBadiyah && r.pointsSunnahBadiyah > 0) || (r.sholatSunahBadiyahQuality && r.sholatSunahBadiyahQuality !== 'tidak')) {
        studentWeeklyMap[r.studentId].badiyahCount += 1;
      } else if (!r.sholatSunahBadiyahQuality && r.prayerType !== 'Subuh' && r.prayerType !== 'Ashar' && r.pointsSholatSunah > 5) {
        studentWeeklyMap[r.studentId].badiyahCount += 1;
      }
    }
  });

  const topWeeklyStudents = Object.values(studentWeeklyMap)
    .sort((a, b) => b.pointsTotal - a.pointsTotal);

  const top3Students = topWeeklyStudents.slice(0, 3);
  const displayedLeaderboard = showTop3Only ? top3Students : topWeeklyStudents;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-6 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Laporan Mingguan Sholat Santri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis keistiqomahan 7 hari terakhir, konsistensi sholat berjamaah & evaluasi wudhu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncData && (
            <button
              onClick={onSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-60"
              title="Sinkronkan data absensi dan poin mingguan santri"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkron Data & Poin</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Rekap Mingguan
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
              Peringkat Poin Mingguan Terbanyak (Top 3 Juara)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            🏆 3 Santri Poin Tertinggi Sepekan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {top3Students.map((item, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const badgeBg = isFirst 
              ? 'from-amber-500/10 via-amber-500/5 to-white border-amber-300 shadow-amber-100/50' 
              : isSecond 
              ? 'from-slate-200/40 via-slate-100/20 to-white border-slate-300 shadow-slate-100' 
              : 'from-orange-200/30 via-orange-100/20 to-white border-orange-300 shadow-orange-100';

            const medalIcon = isFirst ? '🥇 Juara 1 (Emas)' : isSecond ? '🥈 Juara 2 (Perak)' : '🥉 Juara 3 (Perunggu)';
            const medalColor = isFirst ? 'bg-amber-500 text-white' : isSecond ? 'bg-slate-400 text-white' : 'bg-amber-700 text-white';

            return (
              <div 
                key={item.student.id}
                className={`bg-gradient-to-b ${badgeBg} rounded-xl border p-4 shadow-sm flex flex-col justify-between relative overflow-hidden`}
              >
                {isFirst && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-lg shadow-xs uppercase tracking-wider">
                    Poin Tertinggi
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.student.avatar} 
                      alt={item.student.name}
                      className={`w-13 h-13 rounded-full object-cover border-2 shadow-xs ${
                        isFirst ? 'border-amber-400 ring-2 ring-amber-200' : isSecond ? 'border-slate-300' : 'border-amber-600'
                      }`}
                    />
                    <div>
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-1 ${medalColor}`}>
                        {medalIcon}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{item.student.name}</h4>
                      <div className="text-[11px] text-slate-500 font-medium">🕌 {item.student.halaqah}</div>
                    </div>
                  </div>

                  {/* Points Bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Poin Pekan Ini</div>
                      <div className="text-xl font-black font-mono text-emerald-800">
                        {item.pointsTotal.toLocaleString()} <span className="text-xs font-bold text-emerald-600">Pts</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presensi</div>
                      <div className="text-xs font-mono font-bold text-slate-700">{item.prayerCount}x Sholat</div>
                    </div>
                  </div>
                </div>

                {/* Sub-breakdown */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                  <span>Subuh: <b>{item.subuhCount}x</b></span>
                  <span>Qobliyah: <b>{item.qobliyahCount}x</b></span>
                  <span>Ba'diyah: <b>{item.badiyahCount}x</b></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="flex items-center justify-between mt-2.5 px-3 py-2 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold">Laporan Mingguan Tersinkronisasi:</span>
          <span className="text-indigo-700 text-[11px]">
            {records.filter(r => past7Dates.includes(r.date)).length} Kehadiran Sholat Pekan Ini ({dailyStats.reduce((acc, d) => acc + d.totalPoints, 0).toLocaleString()} Poin)
          </span>
        </div>
        <span className="text-[11px] text-indigo-600 font-medium">
          {lastSyncTime ? `Sinkron terakhir: ${lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Siaga'}
        </span>
      </div>

      {/* 7-Day Visual Bar Chart Matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Tren Kehadiran Sholat 7 Hari Terakhir
            </h3>
            <p className="text-xs text-slate-400">Total sesi sholat santri per hari di masjid</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
            Target: 5 waktu / hari
          </span>
        </div>

        {/* CSS Flex Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 border-b border-slate-200">
          {dailyStats.map((d) => {
            const heightPct = Math.round((d.totalRecords / (maxRecordsInADay || 1)) * 100);
            return (
              <div key={d.date} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[11px] font-mono font-bold text-slate-700 mb-1 opacity-80 group-hover:opacity-100 transition">
                  {d.totalRecords}
                </div>
                <div 
                  className="w-full max-w-[42px] bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-emerald-700 hover:to-teal-500 rounded-t-md transition-all duration-300 group-hover:shadow-md cursor-pointer relative"
                  style={{ height: `${Math.max(15, heightPct)}%` }}
                  title={`${d.date}: ${d.totalRecords} sesi sholat, ${d.totalPoints} poin`}
                >
                  <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-20">
                    {d.totalPoints} Poin
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className="font-bold text-xs text-slate-800">{d.dayName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{d.date.slice(5)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5 Prayers distribution over the week */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-2">
          {(['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] as PrayerType[]).map((prayer) => {
            const sumPrayer = records.filter(r => past7Dates.includes(r.date) && r.prayerType === prayer).length;
            return (
              <div key={prayer} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <div className="text-xs font-semibold text-slate-500">{prayer}</div>
                <div className="text-lg font-mono font-extrabold text-slate-800 mt-0.5">{sumPrayer}</div>
                <div className="text-[10px] text-slate-400">Total sepekan</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Leaderboard & Diligence Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Peringkat Santri Paling Istiqomah Pekan Ini
            </h3>
            <p className="text-xs text-slate-500">
              {showTop3Only 
                ? 'Menampilkan 3 santri dengan perolehan poin mingguan terbanyak'
                : 'Menampilkan seluruh peringkat santri berdasarkan perolehan poin mingguan'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setShowTop3Only(true)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                showTop3Only 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🏆 3 Poin Terbanyak</span>
            </button>
            <button
              onClick={() => setShowTop3Only(false)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                !showTop3Only 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Semua Santri ({topWeeklyStudents.length})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-2.5 text-center w-12">Rank</th>
                <th className="px-4 py-2.5">Nama Santri</th>
                <th className="px-4 py-2.5">Nama Masjid</th>
                <th className="px-3 py-2.5 text-center">Kehadiran (Sesi)</th>
                <th className="px-3 py-2.5 text-center">Sholat Subuh</th>
                <th className="px-3 py-2.5 text-center bg-sky-50 text-sky-900 font-bold">Sunnah Qobliyah</th>
                <th className="px-3 py-2.5 text-center bg-teal-50 text-teal-900 font-bold">Sunnah Ba'diyah</th>
                <th className="px-3 py-2.5 text-center">Streak Hari</th>
                <th className="px-4 py-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">Total Poin Sepekan</th>
                <th className="px-3 py-2.5 text-center">Bintang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLeaderboard.map((item, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const rankBadge = idx < 3 ? medals[idx] : `#${idx + 1}`;

                return (
                  <tr key={item.student.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 text-center font-bold text-sm">
                      {rankBadge}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.student.avatar}
                          alt={item.student.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{item.student.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">RFID: {item.student.rfidCardUid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span>🕌</span> {item.student.halaqah}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                      {item.prayerCount} <span className="text-slate-400 font-normal">/ 35</span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-amber-700 font-bold">
                      {item.subuhCount}x Subuh
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-sky-800 bg-sky-50/40">
                      {item.qobliyahCount}x Qobliyah
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-teal-800 bg-teal-50/40">
                      {item.badiyahCount}x Ba'diyah
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                        <Flame className="w-3 h-3" /> {item.student.streakDays} hari
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right bg-emerald-50/50 font-mono font-extrabold text-emerald-900 text-sm">
                      {item.pointsTotal.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        {item.student.starBadge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
