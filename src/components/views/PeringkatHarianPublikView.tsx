import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Calendar, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  Award, 
  ExternalLink, 
  Filter, 
  Search, 
  QrCode, 
  X, 
  Flame, 
  Heart, 
  ChevronRight, 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2,
  Medal,
  RefreshCw,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, AttendanceRecord, PrayerType } from '../../types';
import { 
  getDailyRankingUrl, 
  copyDailyRankingUrlToClipboard, 
  navigateToPublicJournal, 
  navigateToDashboard 
} from '../../services/kioskRoutingService';
import { MASJID_OPTIONS, getTodayDateLocal } from '../../data/initialData';

interface Props {
  students: Student[];
  records: AttendanceRecord[];
  onNavigateToDashboard?: () => void;
}

export const PeringkatHarianPublikView: React.FC<Props> = ({
  students: initialStudents,
  records: initialRecords,
  onNavigateToDashboard,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMasjid, setSelectedMasjid] = useState<string>('ALL');
  const [showQrModal, setShowQrModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real-time live data state (automatically synchronizes from local storage if updated elsewhere)
  const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [liveStudents, setLiveStudents] = useState<Student[]>(initialStudents);

  // Sync with initial props if they change
  useEffect(() => {
    setLiveRecords(initialRecords);
  }, [initialRecords]);

  useEffect(() => {
    setLiveStudents(initialStudents);
  }, [initialStudents]);

  // Default always to TODAY's date (so tomorrow it automatically rolls over to tomorrow's date)
  const todayStr = useMemo(() => getTodayDateLocal(), [currentTime]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateLocal());

  // Keep live digital clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Midnight rollover: when day changes, update selectedDate if user was looking at today
  useEffect(() => {
    const newToday = getTodayDateLocal();
    if (selectedDate !== newToday && selectedDate === todayStr) {
      setSelectedDate(newToday);
    }
  }, [todayStr]);

  // Real-time listener: listen to storage and custom events for instant updates without reload
  const refreshFromStorage = useCallback(() => {
    try {
      const storedRecs = localStorage.getItem('dkm_attendance_records_v3') || 
                         localStorage.getItem('dkm_attendance_records_v2') ||
                         localStorage.getItem('dkm_attendance_records');
      if (storedRecs) {
        const parsed = JSON.parse(storedRecs);
        if (Array.isArray(parsed)) {
          setLiveRecords(parsed);
          setLastUpdated(new Date());
        }
      }

      const storedStudents = localStorage.getItem('dkm_students_data_v3') || 
                             localStorage.getItem('dkm_students_data_v2') ||
                             localStorage.getItem('dkm_students_data');
      if (storedStudents) {
        const parsed = JSON.parse(storedStudents);
        if (Array.isArray(parsed)) {
          setLiveStudents(parsed);
        }
      }
    } catch (e) {
      console.warn('Storage sync check:', e);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('attendance') || e.key?.includes('students')) {
        refreshFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kiosk-attendance-updated', refreshFromStorage);

    // Lightweight 3-second heartbeat to ensure real-time accuracy across tabs
    const interval = setInterval(refreshFromStorage, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kiosk-attendance-updated', refreshFromStorage);
      clearInterval(interval);
    };
  }, [refreshFromStorage]);

  // Copy Public Link
  const handleCopyLink = async () => {
    const ok = await copyDailyRankingUrlToClipboard();
    if (ok) {
      setCopiedLink(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.15 }
      });
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // WhatsApp Share with clean pre-formatted text
  const handleShareWhatsApp = () => {
    const shareUrl = getDailyRankingUrl() || window.location.href;
    const top3Names = top3Today.map((item, idx) => {
      const medals = ['🥇', '🥈', '🥉'];
      return `${medals[idx]} ${item.student.name} (${item.todayTotalPoints} Poin - ${item.student.halaqah})`;
    }).join('\n');

    const text = `🏆 *PAPAN PERINGKAT HARIAN SANTRI TERBANYAK*\n🕌 *DKM Masjid DKI Jakarta*\n📅 Tanggal: ${formattedGregorianDate}\n\n*Top 3 Santri Poin Tertinggi Hari Ini:*\n${top3Names || '- Belum ada data presensi hari ini -'}\n\n📊 Pantau daftar lengkap urutan peringkat santri secara live & transparan di link publik berikut:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Filter records for selected date
  const dateRecords = useMemo(() => {
    return liveRecords.filter(r => r.date === selectedDate);
  }, [liveRecords, selectedDate]);

  // Compute daily totals per student
  const studentsDailyData = useMemo(() => {
    const prayerKeys: PrayerType[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

    return liveStudents.map((student) => {
      const studentRecs = dateRecords.filter(r => r.studentId === student.id);

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
        attendedCount,
        hasAttended: attendedCount > 0
      };
    });
  }, [liveStudents, dateRecords]);

  // SORT: URUTAN POIN TERBANYAK ADA DI PALING ATAS!
  // Urutan pertama: Poin hari ini terbanyak
  // Urutan kedua: Jumlah kehadiran sholat terbanyak
  // Urutan ketiga: Nama alfabetis
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

    list.sort((a, b) => {
      if (b.todayTotalPoints !== a.todayTotalPoints) {
        return b.todayTotalPoints - a.todayTotalPoints; // Poin terbanyak di paling atas!
      }
      if (b.attendedCount !== a.attendedCount) {
        return b.attendedCount - a.attendedCount;
      }
      return a.student.name.localeCompare(b.student.name);
    });

    return list;
  }, [studentsDailyData, selectedMasjid, searchQuery]);

  // Top 3 Podium
  const top3Today = useMemo(() => {
    return sortedStudents.filter(s => s.todayTotalPoints > 0).slice(0, 3);
  }, [sortedStudents]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalPointsToday = sortedStudents.reduce((acc, s) => acc + s.todayTotalPoints, 0);
    const totalSantriHadir = sortedStudents.filter(s => s.hasAttended).length;
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

  const rankingUrl = useMemo(() => getDailyRankingUrl(), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans select-text">
      {/* 1. Header Bar: Islamic Royal Theme with Live Status */}
      <header className="sticky top-0 z-40 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/60 shadow-xl px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Mosque Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-emerald-950 font-black">
                <Trophy className="w-5 h-5 text-emerald-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    Peringkat Harian Santri
                    <span className="hidden xs:inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      LIVE
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-emerald-300/80 font-medium">
                  DKM Masjid Baitul Faqih • Alkautsar • Baitul Karim
                </p>
              </div>
            </div>

            {/* Live Indicator on Mobile */}
            <div className="flex sm:hidden items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-emerald-300">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Center: Live Clock (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-bold text-emerald-200">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
            <span className="text-emerald-400/50">•</span>
            <span className="text-emerald-300">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {/* Top Actions: Share Link, WhatsApp, QR, Switch to Jurnal */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Copy Public Link */}
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md cursor-pointer ${
                copiedLink 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20'
              }`}
              title="Salin tautan link publik untuk dibagikan ke umum/wali santri"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Bagikan Link'}</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition shadow-md cursor-pointer"
              title="Bagikan peringkat harian via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">WhatsApp</span>
            </button>

            {/* Show QR Code */}
            <button
              onClick={() => setShowQrModal(true)}
              className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 transition cursor-pointer"
              title="Tampilkan QR Code untuk scan lewat HP"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Switch to Detailed Prayer Journal */}
            <button
              onClick={() => navigateToPublicJournal()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Buka Jurnal Rincian Tiap Paket Sholat (Subuh s.d. Isya)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Jurnal Sholat</span>
            </button>

            {/* Admin Dashboard Return */}
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                title="Kembali ke Dashboard Utama DKM"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        
        {/* Banner: Hero Title & Date Navigator */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900 border border-emerald-700/50 p-5 sm:p-7 shadow-2xl">
          {/* Islamic Star / Geometric Watermark */}
          <div className="absolute -right-8 -top-8 w-48 h-48 opacity-10 pointer-events-none text-emerald-400">
            <Sparkles className="w-full h-full" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Papan Peringkat Harian Real-Time</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Peringkat Poin Tertinggi Hari Ini
              </h2>
              <p className="text-sm text-emerald-200/80 mt-1 max-w-2xl">
                Santri dengan total akumulasi poin terbanyak berada di baris paling atas. Data otomatis diperbarui secara live setiap ada santri yang melakukan presensi di gerbang masjid.
              </p>
            </div>

            {/* Date Picker & Quick Navigator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-emerald-950/80 p-2 rounded-xl border border-emerald-800/70">
              <div className="flex items-center gap-1.5 px-2 text-xs text-emerald-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{formattedGregorianDate}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-emerald-900/90 text-white text-xs rounded-lg px-2.5 py-1.5 border border-emerald-700/70 focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
                />

                {selectedDate !== todayStr && (
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer shadow-xs"
                    title="Kembali ke Tanggal Hari Ini"
                  >
                    Hari Ini
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-emerald-800/50 text-xs">
            <div className="flex items-center gap-3 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
              <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-emerald-300 font-medium">Total Poin Hari Ini</div>
                <div className="text-lg font-black text-amber-300">{summaryMetrics.totalPointsToday.toLocaleString('id-ID')} Poin</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
              <div className="p-2 rounded-lg bg-emerald-400/20 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-emerald-300 font-medium">Santri Hadir Sholat</div>
                <div className="text-lg font-black text-white">{summaryMetrics.totalSantriHadir} Santri</div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-3 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
              <div className="p-2 rounded-lg bg-teal-400/20 text-teal-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-emerald-300 font-medium">Rata-rata Poin Hadir</div>
                <div className="text-lg font-black text-teal-300">{summaryMetrics.avgPoints} Poin / Santri</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Top 3 Podium Cards (Elevated Juara 1, 2, 3) */}
        {top3Today.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-400" />
                Podium 3 Poin Terbanyak ({formattedGregorianDate})
              </h3>
              <span className="text-xs text-slate-400">Diurutkan real-time</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Podium 1: Gold 🥇 */}
              {top3Today[0] && (
                <div className="relative order-1 md:order-2 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 shadow-xl shadow-amber-500/10 p-5 transform md:-translate-y-2">
                  <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                    <span>🥇 JUARA 1</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={top3Today[0].student.avatar}
                        alt={top3Today[0].student.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-1 shadow-md">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-amber-400">Peringkat 1 Teratas</div>
                      <h4 className="text-lg font-black text-white truncate">{top3Today[0].student.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{top3Today[0].student.halaqah}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Poin Hari Ini</div>
                      <div className="text-2xl font-black text-amber-400">
                        {top3Today[0].todayTotalPoints} <span className="text-xs font-medium text-amber-300/80">Poin</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Kehadiran</div>
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-700/50 inline-block">
                        {top3Today[0].attendedCount} / 5 Sholat
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Podium 2: Silver 🥈 */}
              {top3Today[1] && (
                <div className="relative order-2 md:order-1 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-400/15 via-slate-900 to-slate-900 border border-slate-400/60 shadow-lg p-5">
                  <div className="absolute top-0 right-0 bg-slate-300 text-slate-950 text-xs font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                    <span>🥈 JUARA 2</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={top3Today[1].student.avatar}
                      alt={top3Today[1].student.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-300">Peringkat 2</div>
                      <h4 className="text-base font-bold text-white truncate">{top3Today[1].student.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{top3Today[1].student.halaqah}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Poin Hari Ini</div>
                      <div className="text-xl font-black text-slate-200">
                        {top3Today[1].todayTotalPoints} <span className="text-xs font-medium text-slate-400">Poin</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Kehadiran</div>
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-700/50 inline-block">
                        {top3Today[1].attendedCount} / 5 Sholat
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Podium 3: Bronze 🥉 */}
              {top3Today[2] && (
                <div className="relative order-3 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-700/20 via-slate-900 to-slate-900 border border-amber-700/50 shadow-lg p-5">
                  <div className="absolute top-0 right-0 bg-amber-700 text-amber-100 text-xs font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                    <span>🥉 JUARA 3</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={top3Today[2].student.avatar}
                      alt={top3Today[2].student.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-600 shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-amber-400">Peringkat 3</div>
                      <h4 className="text-base font-bold text-white truncate">{top3Today[2].student.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{top3Today[2].student.halaqah}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Poin Hari Ini</div>
                      <div className="text-xl font-black text-amber-300">
                        {top3Today[2].todayTotalPoints} <span className="text-xs font-medium text-amber-400/80">Poin</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Kehadiran</div>
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-700/50 inline-block">
                        {top3Today[2].attendedCount} / 5 Sholat
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Controls: Search, Filter Masjid, and Refresh Info */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama santri / RFID / halaqah..."
                className="w-full bg-slate-950 text-white text-xs rounded-xl pl-9 pr-4 py-2 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mosque Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedMasjid('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedMasjid === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua Masjid ({studentsDailyData.length})
              </button>
              {MASJID_OPTIONS.map((m) => {
                const count = studentsDailyData.filter(s => s.student.halaqah === m).length;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMasjid(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedMasjid === m
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.replace('Masjid ', '')} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Menampilkan <strong>{sortedStudents.length}</strong> santri tersusun dari poin terbanyak</span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
              Live update: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 5. Complete Rankings Table (Ordered strictly descending by points) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-950/70 border-b border-emerald-800/60 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <th className="py-3.5 px-4 text-center w-16">Peringkat</th>
                  <th className="py-3.5 px-4">Nama Santri</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Masjid / DKM</th>
                  <th className="py-3.5 px-4 text-center hidden sm:table-cell">Rincian Paket Sholat</th>
                  <th className="py-3.5 px-4 text-center">Kehadiran</th>
                  <th className="py-3.5 px-4 text-right">Total Poin Hari Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {sortedStudents.map((item, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1 && item.todayTotalPoints > 0;
                  const isTop2 = rank === 2 && item.todayTotalPoints > 0;
                  const isTop3 = rank === 3 && item.todayTotalPoints > 0;

                  return (
                    <tr
                      key={item.student.id}
                      className={`hover:bg-slate-800/50 transition ${
                        isTop1 ? 'bg-amber-500/10' : isTop2 ? 'bg-slate-400/5' : isTop3 ? 'bg-amber-700/5' : ''
                      }`}
                    >
                      {/* Peringkat Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-md text-xs">
                            1 🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black shadow-md text-xs">
                            2 🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black shadow-md text-xs">
                            3 🥉
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                            {rank}
                          </span>
                        )}
                      </td>

                      {/* Identitas Santri */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.student.avatar}
                            alt={item.student.name}
                            className={`w-9 h-9 rounded-full object-cover shrink-0 ${
                              isTop1 ? 'ring-2 ring-amber-400' : 'ring-1 ring-slate-700'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                              <span>{item.student.name}</span>
                              {item.student.gender === 'L' ? (
                                <span className="text-[10px] text-sky-400 font-normal">(Ikhwan)</span>
                              ) : (
                                <span className="text-[10px] text-pink-400 font-normal">(Akhwat)</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{item.student.rfidCardUid}</span>
                              <span className="md:hidden text-emerald-400">• {item.student.halaqah}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Masjid / DKM */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium text-xs">
                          {item.student.halaqah}
                        </span>
                      </td>

                      {/* Paket Sholat Badges (Subuh, Dzuhur, Ashar, Maghrib, Isya) */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {(['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] as PrayerType[]).map((prayer) => {
                            const pts = item.prayerPoints[prayer];
                            const attended = item.prayerAttended[prayer];
                            return (
                              <div
                                key={prayer}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex flex-col items-center ${
                                  attended
                                    ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/60'
                                    : 'bg-slate-950 text-slate-600 border border-slate-800'
                                }`}
                                title={`${prayer}: ${pts} Poin`}
                              >
                                <span className="text-[9px] uppercase">{prayer.slice(0, 3)}</span>
                                <span>{attended ? `${pts}p` : '-'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Kehadiran */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.attendedCount > 0
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              : 'bg-slate-950 text-slate-500'
                          }`}
                        >
                          {item.attendedCount} / 5 Sholat
                        </span>
                      </td>

                      {/* Total Poin Hari Ini (Prominent Big Numbers) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-base font-black ${
                              isTop1
                                ? 'text-amber-400 text-lg'
                                : isTop2
                                ? 'text-slate-200'
                                : isTop3
                                ? 'text-amber-300'
                                : item.todayTotalPoints > 0
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.todayTotalPoints}
                            <span className="text-[11px] font-normal text-slate-400 ml-1">Poin</span>
                          </span>

                          {item.student.starBadge && (
                            <span className="text-[9px] text-amber-400/90 font-medium">
                              ★ {item.student.starBadge}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Award className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="font-semibold">Tidak ada santri yang cocok dengan kriteria pencarian</p>
                      <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter masjid</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© DKM Masjid DKI Jakarta • Sistem Presensi RFID & Peringkat Ibadah Santri</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Salin Link Peringkat
            </button>
            <span>•</span>
            <button
              onClick={() => navigateToPublicJournal()}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Lihat Jurnal Paket Sholat
            </button>
          </div>
        </div>
      </footer>

      {/* 7. Modal QR Code Sharing */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-emerald-600/50 rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white">Scan QR Peringkat Harian</h3>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              Arahkan kamera smartphone untuk langsung membuka papan peringkat poin santri real-time.
            </p>

            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(rankingUrl)}`}
                alt="QR Code Peringkat Harian"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Berhasil Disalin!' : 'Salin Tautan'}</span>
              </button>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
