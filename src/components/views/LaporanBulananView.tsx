import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Star, 
  FileText, 
  X,
  Heart,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { AttendanceRecord, Student } from '../../types';

interface Props {
  records: AttendanceRecord[];
  students: Student[];
  onSyncData?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
}

export const LaporanBulananView: React.FC<Props> = ({ 
  records, 
  students,
  onSyncData,
  isSyncing,
  lastSyncTime
}) => {
  const [selectedStudentForRapor, setSelectedStudentForRapor] = useState<Student | null>(null);
  const [selectedTableMasjid, setSelectedTableMasjid] = useState<string>('ALL');

  const TARGET_PRAYERS_MONTH = 150; // 5 prayers * 30 days

  // Compute monthly stats per student
  const studentMonthlyStats = students.map((student) => {
    const studentRecords = records.filter(r => r.studentId === student.id);
    const totalAttended = studentRecords.length;
    const totalPoints = studentRecords.reduce((acc, r) => acc + r.totalPoints, 0);
    const attendancePct = Math.round((totalAttended / TARGET_PRAYERS_MONTH) * 100);

    const wudhuTotal = studentRecords.reduce((acc, r) => acc + r.pointsWudhu, 0);
    const avgWudhu = totalAttended > 0 ? Math.round(wudhuTotal / totalAttended) : 0;

    const qobliyahCount = studentRecords.filter(r => 
      (r.pointsSunnahQobliyah && r.pointsSunnahQobliyah > 0) || 
      (r.sholatSunahQobliyahQuality && r.sholatSunahQobliyahQuality !== 'tidak') ||
      (!r.sholatSunahQobliyahQuality && r.prayerType === 'Subuh' && r.pointsSholatSunah > 0)
    ).length;

    const badiyahCount = studentRecords.filter(r => 
      (r.pointsSunnahBadiyah && r.pointsSunnahBadiyah > 0) || 
      (r.sholatSunahBadiyahQuality && r.sholatSunahBadiyahQuality !== 'tidak') ||
      (!r.sholatSunahBadiyahQuality && r.prayerType !== 'Subuh' && r.prayerType !== 'Ashar' && r.pointsSholatSunah > 5)
    ).length;

    const sunnahCount = studentRecords.filter(r => 
      (r.pointsSunnahQobliyah && r.pointsSunnahQobliyah > 0) || 
      (r.pointsSunnahBadiyah && r.pointsSunnahBadiyah > 0) || 
      (r.pointsSholatSunah > 0)
    ).length;
    const sunnahPct = totalAttended > 0 ? Math.round((sunnahCount / totalAttended) * 100) : 0;

    const subuhCount = studentRecords.filter(r => r.prayerType === 'Subuh').length;

    return {
      student,
      totalAttended,
      totalPoints,
      attendancePct,
      avgWudhu,
      qobliyahCount,
      badiyahCount,
      sunnahCount,
      sunnahPct,
      subuhCount,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  // Mosque definitions with custom theme accents
  const MOSQUES = [
    { 
      name: 'Masjid Baitul Faqih', 
      border: 'border-emerald-200', 
      headerBg: 'bg-emerald-50/70',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      accentColor: 'text-emerald-700'
    },
    { 
      name: 'Masjid Alkautsar', 
      border: 'border-sky-200', 
      headerBg: 'bg-sky-50/70',
      badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
      accentColor: 'text-sky-700'
    },
    { 
      name: 'Masjid Baitul Karim', 
      border: 'border-indigo-200', 
      headerBg: 'bg-indigo-50/70',
      badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      accentColor: 'text-indigo-700'
    }
  ];

  // Top 5 students per mosque
  const top5ByMosque = MOSQUES.map(m => {
    const list = studentMonthlyStats.filter(s => s.student.halaqah === m.name);
    return {
      ...m,
      totalStudents: list.length,
      totalPoints: list.reduce((acc, s) => acc + s.totalPoints, 0),
      top5: list.slice(0, 5)
    };
  });

  // Filtered stats for the leaderboard table
  const filteredTableStats = selectedTableMasjid === 'ALL'
    ? studentMonthlyStats
    : studentMonthlyStats.filter(s => s.student.halaqah === selectedTableMasjid);

  // Overall statistics
  const totalAllAttendances = records.length;
  const totalAllPoints = records.reduce((acc, r) => acc + r.totalPoints, 0);
  const avgMonthlyAttendancePct = Math.round(
    studentMonthlyStats.reduce((acc, s) => acc + s.attendancePct, 0) / (students.length || 1)
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-6 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Laporan Bulanan & Rapor Sholat Santri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi 1 bulan penuh (30 Hari Kalender DKI Jakarta), evaluasi komprehensif, dan cetak rapor bulanan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncData && (
            <button
              onClick={onSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-60"
              title="Sinkronkan data absensi, total poin dan kalkulasi rapor bulanan santri"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkron Data & Poin</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Laporan Bulanan
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="flex items-center justify-between mt-2.5 px-3 py-2 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-950">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">Laporan Bulanan & Rapor Tersinkronisasi:</span>
          <span className="text-amber-800 text-[11px]">
            {students.length} Santri Terdata • {totalAllAttendances} Verifikasi Kehadiran ({totalAllPoints.toLocaleString()} Total Poin)
          </span>
        </div>
        <span className="text-[11px] text-amber-700 font-medium">
          {lastSyncTime ? `Sinkron terakhir: ${lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Siaga'}
        </span>
      </div>

      {/* Monthly KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Akumulasi Poin Santri</div>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-700 font-mono mt-1">
            {totalAllPoints.toLocaleString()} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari {totalAllAttendances} kali verifikasi RFID sholat
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Rata-rata Kehadiran Bulanan</div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 font-mono mt-1">
            {avgMonthlyAttendancePct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target 150 waktu sholat lima waktu per santri
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white p-5 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-amber-100 uppercase tracking-wider">
            Santri Terbaik Bulan Ini
          </div>
          <div className="text-xl md:text-2xl font-extrabold mt-1 truncate">
            {studentMonthlyStats[0]?.student.name || '-'}
          </div>
          <div className="text-xs text-amber-100 mt-1 font-medium">
            🏆 {studentMonthlyStats[0]?.totalPoints.toLocaleString()} Poin • {studentMonthlyStats[0]?.student.halaqah}
          </div>
        </div>
      </div>

      {/* Showcase: Peringkat 5 Terbaik Masing-Masing Masjid */}
      <div className="mt-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Peringkat 5 Terbaik Masing-Masing Masjid</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Apresiasi santri teladan dengan akumulasi poin tertinggi & keistiqomahan sholat berjamaah di setiap masjid.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>3 Masjid Binaan DKI Jakarta</span>
          </div>
        </div>

        {/* 3 Mosque Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {top5ByMosque.map((m) => (
            <div
              key={m.name}
              className={`bg-white rounded-2xl border ${m.border} shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden`}
            >
              {/* Header */}
              <div className={`p-3.5 border-b border-slate-100 ${m.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕌</span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{m.name}</h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {m.totalStudents} Santri • {m.totalPoints.toLocaleString()} Total Poin
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeBg}`}>
                  Top 5
                </span>
              </div>

              {/* Top 5 List */}
              <div className="divide-y divide-slate-100 p-2 flex-1 space-y-1">
                {m.top5.map((item, rankIdx) => (
                  <div
                    key={item.student.id}
                    className={`p-2 rounded-xl flex items-center justify-between gap-2 transition hover:bg-slate-50 ${
                      rankIdx === 0
                        ? 'bg-amber-50/50 border border-amber-200/60'
                        : rankIdx === 1
                        ? 'bg-slate-50/70 border border-slate-200/50'
                        : rankIdx === 2
                        ? 'bg-orange-50/40 border border-orange-200/40'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 text-center font-bold text-xs shrink-0">
                        {rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 inline-flex items-center justify-center text-[10px] font-bold">
                            #{rankIdx + 1}
                          </span>
                        )}
                      </div>
                      <img
                        src={item.student.avatar}
                        alt={item.student.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {item.student.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span>{item.totalAttended} Hadir ({item.attendancePct}%)</span>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold">{item.student.starBadge}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-emerald-700 block">
                          +{item.totalPoints.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">pts</span>
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Q:{item.qobliyahCount} B:{item.badiyahCount}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForRapor(item.student)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title={`Lihat Rapor Sholat ${item.student.name}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {m.top5.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Belum ada data kehadiran santri
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs mt-6 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Tabel Rekapitulasi & Peringkat Bulanan (DKI Jakarta)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Menampilkan {filteredTableStats.length} dari {students.length} Santri Terdaftar
            </span>
          </div>

          {/* Mosque filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTableMasjid('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedTableMasjid === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Masjid ({students.length})
            </button>
            {MOSQUES.map(m => {
              const count = students.filter(s => s.halaqah === m.name).length;
              return (
                <button
                  key={m.name}
                  onClick={() => setSelectedTableMasjid(m.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    selectedTableMasjid === m.name
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>🕌</span>
                  <span>{m.name.replace('Masjid ', '')} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-2.5 text-center w-12">Peringkat</th>
                <th className="px-4 py-2.5">Nama Santri</th>
                <th className="px-4 py-2.5">Nama Masjid</th>
                <th className="px-3 py-2.5 text-center">Total Sholat (Sesi)</th>
                <th className="px-3 py-2.5 text-center">Persentase</th>
                <th className="px-3 py-2.5 text-center">Rata2 Wudhu</th>
                <th className="px-3 py-2.5 text-center bg-sky-50 text-sky-900 font-bold">Sunnah Qobliyah</th>
                <th className="px-3 py-2.5 text-center bg-teal-50 text-teal-900 font-bold">Sunnah Ba'diyah</th>
                <th className="px-3 py-2.5 text-center">Rasio Sunnah</th>
                <th className="px-4 py-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">Total Poin</th>
                <th className="px-3 py-2.5 text-center">Bintang</th>
                <th className="px-3 py-2.5 text-center">Rapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableStats.map((item, idx) => {
                const isTop3 = idx < 3;
                return (
                  <tr key={item.student.id} className={`hover:bg-slate-50 transition ${isTop3 ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-4 py-3 text-center font-bold text-sm">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
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
                          <div className="text-[10px] font-mono text-slate-400">UID: {item.student.rfidCardUid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span>🕌</span> {item.student.halaqah}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                      {item.totalAttended} <span className="text-slate-400 font-normal">/ {TARGET_PRAYERS_MONTH}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono font-bold text-slate-800">{item.attendancePct}%</span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {item.avgWudhu}/25
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-sky-800 bg-sky-50/40">
                      {item.qobliyahCount}x
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-teal-800 bg-teal-50/40">
                      {item.badiyahCount}x
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {item.sunnahPct}%
                    </td>
                    <td className="px-4 py-3 text-right bg-emerald-50/60 font-mono font-extrabold text-emerald-900 text-sm">
                      {item.totalPoints.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                        {item.student.starBadge}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => setSelectedStudentForRapor(item.student)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition shadow-2xs cursor-pointer"
                        title="Lihat & Cetak Rapor Sholat"
                      >
                        <FileText className="w-3 h-3" /> Rapor
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Rapor Sholat Santri (Printable Student Report Card) */}
      {selectedStudentForRapor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden relative my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 relative">
              <button
                onClick={() => setSelectedStudentForRapor(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="text-xs uppercase tracking-widest font-bold text-emerald-200">
                  DEWAN KEMAKMURAN MASJID (DKM) DKI JAKARTA
                </div>
                <h3 className="text-xl md:text-2xl font-black mt-1">
                  RAPOR SHOLAT & ADAB SANTRI
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Laporan Hasil Penilaian Sholat 5 Waktu & Wudhu Berbasis Kartu RFID
                </p>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="p-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                <img
                  src={selectedStudentForRapor.avatar}
                  alt={selectedStudentForRapor.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-xs"
                />
                <div>
                  <h4 className="text-lg font-black text-slate-800">{selectedStudentForRapor.name}</h4>
                  <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <span>🕌</span> {selectedStudentForRapor.halaqah}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                    <span>No RFID: {selectedStudentForRapor.rfidCardUid}</span>
                    <span>•</span>
                    <span>Santri {selectedStudentForRapor.gender === 'L' ? 'Ikhwan' : 'Akhwat'}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Peringkat & Predikat</div>
                  <div className="text-base font-extrabold text-amber-600 mt-0.5 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500" />
                    {selectedStudentForRapor.starBadge}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Total Akumulasi Poin</div>
                  <div className="text-base font-mono font-extrabold text-emerald-700 mt-0.5">
                    {selectedStudentForRapor.totalPoints.toLocaleString()} Poin
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Streak Istiqomah</div>
                  <div className="text-base font-mono font-extrabold text-slate-800 mt-0.5">
                    {selectedStudentForRapor.streakDays} Hari Berturut-turut
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Total Kehadiran Sholat</div>
                  <div className="text-base font-mono font-extrabold text-slate-800 mt-0.5">
                    {selectedStudentForRapor.totalAttendances} Sesi Berjamaah
                  </div>
                </div>
                {/* Sunnah Breakdown Cards */}
                <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-200">
                  <div className="text-[11px] font-semibold text-sky-800">Sunnah Qobliyah</div>
                  <div className="text-base font-mono font-extrabold text-sky-950 mt-0.5">
                    {studentMonthlyStats.find(s => s.student.id === selectedStudentForRapor.id)?.qobliyahCount ?? 0}x Dilaksanakan
                  </div>
                </div>
                <div className="bg-teal-50/70 p-3 rounded-lg border border-teal-200">
                  <div className="text-[11px] font-semibold text-teal-800">Sunnah Ba'diyah</div>
                  <div className="text-base font-mono font-extrabold text-teal-950 mt-0.5">
                    {studentMonthlyStats.find(s => s.student.id === selectedStudentForRapor.id)?.badiyahCount ?? 0}x Dilaksanakan
                  </div>
                </div>
              </div>

              {/* Islamic Encouragement Note */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 my-4">
                <p className="font-semibold text-center italic">
                  "Barangsiapa sholat berjamaah karena Allah selama empat puluh hari dengan mendapati takbiratul ihram pertama, niscaya ditetapkan baginya dua pembebasan: dari api neraka dan dari sifat munafik."
                </p>
                <div className="text-right text-[10px] text-emerald-700 font-bold mt-1">
                  — HR. Tirmidzi
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="text-slate-500">Orang Tua / Wali Santri</div>
                  <div className="h-14" />
                  <div className="font-bold text-slate-800 border-t border-slate-300 pt-1">
                    ( .................................... )
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Imam / Pembina Masjid DKI</div>
                  <div className="h-14" />
                  <div className="font-bold text-slate-800 border-t border-slate-300 pt-1">
                    (Ustadz Hanif Al-Batawi)
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSelectedStudentForRapor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Rapor Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
