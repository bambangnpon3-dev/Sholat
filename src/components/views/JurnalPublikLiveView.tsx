import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  Trophy, 
  Award, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LayoutDashboard
} from 'lucide-react';
import { Student, AttendanceRecord, PrayerType } from '../../types';
import { copyPublicJournalUrlToClipboard, navigateToDashboard, navigateToDailyRanking } from '../../services/kioskRoutingService';
import { MASJID_OPTIONS, getTodayDateLocal } from '../../data/initialData';

interface Props {
  students: Student[];
  records: AttendanceRecord[];
  onNavigateToDashboard?: () => void;
}

export const JurnalPublikLiveView: React.FC<Props> = ({
  students,
  records,
  onNavigateToDashboard,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMasjid, setSelectedMasjid] = useState<string>('ALL');

  // Default always to TODAY's date (so tomorrow it automatically rolls over to tomorrow's date)
  const todayStr = useMemo(() => getTodayDateLocal(), [currentTime]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateLocal());

  // Keep live digital clock ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Whenever day changes, update selectedDate if it was set to the previous today
  useEffect(() => {
    const newToday = getTodayDateLocal();
    if (selectedDate !== newToday && selectedDate === todayStr) {
      setSelectedDate(newToday);
    }
  }, [todayStr]);

  const handleCopyLink = async () => {
    const ok = await copyPublicJournalUrlToClipboard();
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const text = `🕌 *JURNAL HARIAN PRESENSI SHOLAT SANTRI*\n📅 Tanggal: ${selectedDate}\n\nPantau perolehan poin seluruh paket sholat (Subuh s.d. Isya) santri secara live dan transparan di tautan berikut:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Filter records for the selected date
  const dateRecords = useMemo(() => {
    return records.filter(r => r.date === selectedDate);
  }, [records, selectedDate]);

  // Aggregate daily stats per student for the selected date
  const studentsDailyData = useMemo(() => {
    const prayerKeys: PrayerType[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

    return students.map((student) => {
      const studentRecs = dateRecords.filter(r => r.studentId === student.id);

      // Points per prayer package
      const prayerPoints: Record<PrayerType, number> = {
        Subuh: 0,
        Dzuhur: 0,
        Ashar: 0,
        Maghrib: 0,
        Isya: 0
      };

      const prayerAttended: Record<PrayerType, boolean> = {
        Subuh: false,
        Dzuhur: false,
        Ashar: false,
        Maghrib: false,
        Isya: false
      };

      studentRecs.forEach((r) => {
        if (prayerKeys.includes(r.prayerType)) {
          prayerPoints[r.prayerType] = (prayerPoints[r.prayerType] || 0) + (r.totalPoints || 0);
          prayerAttended[r.prayerType] = true;
        }
      });

      const todayTotalPoints = Object.values(prayerPoints).reduce((a, b) => a + b, 0);
      const attendedCount = Object.values(prayerAttended).filter(Boolean).length;

      return {
        student,
        prayerPoints,
        prayerAttended,
        todayTotalPoints,
        attendedCount
      };
    });
  }, [students, dateRecords]);

  // Sort: students with highest points TODAY always at the very top!
  const sortedStudents = useMemo(() => {
    let list = [...studentsDailyData];

    if (selectedMasjid !== 'ALL') {
      list = list.filter(item => item.student.halaqah === selectedMasjid);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.student.name.toLowerCase().includes(q) ||
        (item.student.nickname && item.student.nickname.toLowerCase().includes(q)) ||
        item.student.rfidCardUid.toLowerCase().includes(q) ||
        item.student.halaqah.toLowerCase().includes(q)
      );
    }

    // Strict descending sort by todayTotalPoints, then by attendedCount, then alphabetical
    list.sort((a, b) => {
      if (b.todayTotalPoints !== a.todayTotalPoints) {
        return b.todayTotalPoints - a.todayTotalPoints;
      }
      if (b.attendedCount !== a.attendedCount) {
        return b.attendedCount - a.attendedCount;
      }
      return a.student.name.localeCompare(b.student.name);
    });

    return list;
  }, [studentsDailyData, selectedMasjid, searchQuery]);

  // Top 3 Leaderboard of the Day
  const top3Today = useMemo(() => {
    return sortedStudents.filter(s => s.todayTotalPoints > 0).slice(0, 3);
  }, [sortedStudents]);

  // Daily Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalPointsToday = sortedStudents.reduce((acc, s) => acc + s.todayTotalPoints, 0);
    const totalSantriHadir = sortedStudents.filter(s => s.attendedCount > 0).length;
    const avgPoints = totalSantriHadir > 0 ? Math.round(totalPointsToday / totalSantriHadir) : 0;
    return { totalPointsToday, totalSantriHadir, avgPoints };
  }, [sortedStudents]);

  const formattedGregorianDate = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900">
      {/* 1. ISLAMIC CALLIGRAPHY & ROYAL HEADER */}
      <header className="relative border-b border-emerald-500/20 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Mosque & Title Identity */}
            <div className="flex items-center gap-3.5 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl">
                  🕌
                </div>
              </div>
              <div>
                <div className="font-arabic text-emerald-400 text-xs sm:text-sm tracking-wider font-semibold opacity-90">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
                  JURNAL HARIAN PRESENSI SHOLAT SANTRI
                </h1>
                <p className="text-[11px] sm:text-xs text-emerald-300/80 font-medium">
                  Dewan Kemakmuran Masjid (DKM) • Pantauan Live Poin Ibadah Subuh s.d. Isya
                </p>
              </div>
            </div>

            {/* Live Clock & Public Share Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-900/30 border border-emerald-500/30 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300">LIVE SYNC</span>
                <span className="font-mono text-white font-black">
                  {currentTime.toLocaleTimeString('id-ID')} WIB
                </span>
              </div>

              {/* Salin Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Salin Link Publik Jurnal Harian"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedLink ? 'Link Tersalin!' : 'Bagikan Link'}</span>
              </button>

              {/* Switch to Dedicated Daily Ranking */}
              <button
                type="button"
                onClick={() => navigateToDailyRanking()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                title="Buka Jendela Khusus Papan Peringkat Harian Santri"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Papan Peringkat</span>
              </button>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/30"
                title="Bagikan ke Grup WhatsApp Wali Santri & DKM"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WA Jurnal</span>
              </button>

              {/* Navigate to Admin Dashboard */}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToDashboard) {
                    onNavigateToDashboard();
                  } else {
                    navigateToDashboard();
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Buka Dashboard Admin Spreadsheet"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. ISLAMIC AYAT & BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-emerald-950/60 border-b border-emerald-500/20 py-2.5 px-4 text-center">
        <p className="text-xs text-amber-300 font-medium">
          ✨ <span className="font-arabic font-normal text-sm">إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا</span> — <em>"Sesungguhnya sholat itu adalah fardhu yang ditentukan waktunya atas orang-orang yang beriman."</em> (QS. An-Nisa: 103)
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* 3. DATE SELECTOR & SUMMARY CARDS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
          {/* Date controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Hari Ini (Live)
            </button>

            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-medium outline-none cursor-pointer"
              />
            </div>

            <span className="text-xs font-semibold text-emerald-300 ml-1">
              📅 {formattedGregorianDate}
            </span>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl px-3 py-2">
              <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">Santri Hadir</div>
              <div className="text-lg font-black text-white font-mono">{summaryMetrics.totalSantriHadir}</div>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2">
              <div className="text-[10px] text-amber-300 uppercase tracking-wider font-bold">Total Poin Hari Ini</div>
              <div className="text-lg font-black text-amber-400 font-mono">+{summaryMetrics.totalPointsToday}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rata-rata Poin</div>
              <div className="text-lg font-black text-white font-mono">+{summaryMetrics.avgPoints}</div>
            </div>
          </div>
        </div>

        {/* 4. TOP 3 PODIUM SANTRI POIN TERTINGGI HARI INI */}
        {top3Today.length > 0 && (
          <div className="bg-gradient-to-b from-slate-900/90 via-emerald-950/50 to-slate-900/90 border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Santri Poin Tertinggi Hari Ini
                </h2>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold uppercase tracking-wider">
                🌟 Top 3 Terbaik Hari Ini
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {top3Today.map((item, idx) => {
                const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3'];
                const cardBorder = idx === 0 
                  ? 'border-amber-400/60 bg-gradient-to-b from-amber-950/40 to-slate-900/80 shadow-amber-500/20' 
                  : idx === 1 
                  ? 'border-slate-400/40 bg-gradient-to-b from-slate-800/40 to-slate-900/80'
                  : 'border-amber-700/40 bg-gradient-to-b from-amber-950/20 to-slate-900/80';

                return (
                  <div
                    key={item.student.id}
                    className={`relative rounded-2xl border-2 p-4 flex flex-col items-center text-center shadow-lg transition hover:scale-[1.02] ${cardBorder}`}
                  >
                    {/* Rank Ribbon */}
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full text-xs font-black bg-slate-900 border border-amber-400/50 text-amber-300 shadow">
                      {medals[idx]}
                    </div>

                    <div className="relative mt-2 mb-3">
                      <img
                        src={item.student.avatar}
                        alt={item.student.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md shadow-amber-500/20"
                      />
                      <span className="absolute -bottom-1.5 -right-1.5 text-base">
                        {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>

                    <h3 className="font-black text-white text-base leading-snug">{item.student.name}</h3>
                    <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                      🕌 {item.student.halaqah}
                    </div>

                    {/* Today Points Badge */}
                    <div className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono font-black text-amber-300 text-lg">
                        +{item.todayTotalPoints} Poin
                      </span>
                    </div>

                    {/* Prayer Package mini pills */}
                    <div className="mt-3 grid grid-cols-5 gap-1 w-full text-[10px]">
                      {(['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] as PrayerType[]).map((p) => {
                        const pts = item.prayerPoints[p];
                        return (
                          <div
                            key={p}
                            className={`p-1 rounded text-center font-mono ${
                              pts > 0 ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'bg-slate-800/40 text-slate-500'
                            }`}
                            title={`Sholat ${p}: ${pts} Poin`}
                          >
                            <div className="text-[9px] uppercase">{p.slice(0, 3)}</div>
                            <div>{pts > 0 ? `+${pts}` : '-'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. FILTER & SEARCH TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedMasjid('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedMasjid === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua Masjid ({students.length})
            </button>
            {MASJID_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMasjid(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedMasjid === m
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.replace('Masjid ', '')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari santri atau RFID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* 6. COMPLETE DAILY JOURNAL TABLE (ORDERED BY HIGHEST POINTS) */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">📜</span>
              <h3 className="font-bold text-white text-sm">
                Daftar Lengkap Jurnal Paket Sholat Santri Hari Ini
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Urutan: <strong>Poin Tertinggi Terlebih Dahulu</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3 text-center w-12">Rank</th>
                  <th className="px-3 py-3">Nama Santri & Masjid</th>
                  <th className="px-2 py-3 text-center w-12">Gender</th>
                  <th className="px-3 py-3 text-center">Subuh</th>
                  <th className="px-3 py-3 text-center">Dzuhur / Jumat</th>
                  <th className="px-3 py-3 text-center">Ashar</th>
                  <th className="px-3 py-3 text-center">Maghrib</th>
                  <th className="px-3 py-3 text-center">Isya</th>
                  <th className="px-4 py-3 text-right bg-emerald-950/40 text-emerald-300 font-extrabold">
                    Total Poin Hari Ini
                  </th>
                  <th className="px-3 py-3 text-center">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedStudents.map((item, idx) => {
                  const rankMedal = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`;
                  const isTop3 = idx < 3 && item.todayTotalPoints > 0;

                  return (
                    <tr
                      key={item.student.id}
                      className={`hover:bg-slate-800/50 transition ${
                        isTop3 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-300">
                        <span className={`px-2 py-0.5 rounded-full ${isTop3 ? 'bg-amber-400/20 text-amber-300 font-black' : ''}`}>
                          {rankMedal}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.student.avatar}
                            alt={item.student.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{item.student.name}</span>
                              {item.student.nickname && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({item.student.nickname})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-emerald-400/90 font-medium">
                              🕌 {item.student.halaqah}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="px-2 py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.student.gender === 'L' ? 'bg-sky-500/20 text-sky-300' : 'bg-pink-500/20 text-pink-300'
                        }`}>
                          {item.student.gender === 'L' ? 'L' : 'P'}
                        </span>
                      </td>

                      {/* Prayer Packages */}
                      {(['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] as PrayerType[]).map((p) => {
                        const pts = item.prayerPoints[p];
                        return (
                          <td key={p} className="px-3 py-3 text-center font-mono">
                            {pts > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                +{pts}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Points Today */}
                      <td className="px-4 py-3 text-right font-mono bg-emerald-950/30">
                        <span className="font-black text-sm text-emerald-300">
                          +{item.todayTotalPoints}
                        </span>
                      </td>

                      {/* Attended Count */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.attendedCount >= 4
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : item.attendedCount > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {item.attendedCount}/5 Waktu
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedStudents.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada data presensi santri yang tercatat untuk tanggal {selectedDate}.
            </div>
          )}
        </div>
      </main>

      {/* 7. ISLAMIC FOOTER */}
      <footer className="border-t border-emerald-500/20 bg-slate-950/90 py-5 px-4 text-center text-xs text-slate-400">
        <p className="font-medium text-emerald-300">
          Sistem Presensi RFID & Poin Ibadah Santri Masjid DKI Jakarta
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Transparan • Real-Time • Membina Karakter & Keistiqomahan Generasi Qur'ani
        </p>
      </footer>
    </div>
  );
};
