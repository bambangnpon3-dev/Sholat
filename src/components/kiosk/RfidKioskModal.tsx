import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Scan, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  Clock, 
  User, 
  Award, 
  Check, 
  Flame, 
  Heart,
  ChevronRight,
  ShieldCheck,
  Send,
  Copy,
  ExternalLink,
  Maximize,
  Minimize,
  LayoutDashboard,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Student, 
  AttendanceRecord, 
  PrayerSchedule, 
  PrayerType, 
  WudhuQuality, 
  SholatWajibQuality, 
  SholatSunahQuality,
  SunnahQobliyahQuality,
  SunnahBadiyahQuality,
  KioskWindowInfo
} from '../../types';
import { getCurrentActivePrayer, getKioskAdzanWindow } from '../../services/prayerTimeService';
import { soundEffects } from '../../services/audioService';
import { POINT_CONFIG, calculatePoints } from '../../data/pointConfig';
import { copyKioskUrlToClipboard, navigateToKiosk, navigateToDashboard } from '../../services/kioskRoutingService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schedule: PrayerSchedule | null;
  records?: AttendanceRecord[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  isStandalone?: boolean;
}

export const RfidKioskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  schedule,
  records = [],
  onSaveAttendance,
  isStandalone = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cardUidInput, setCardUidInput] = useState('');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isUnknownCard, setIsUnknownCard] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [closedWarning, setClosedWarning] = useState<string | null>(null);
  const [alreadyTappedNotice, setAlreadyTappedNotice] = useState<{
    student: Student;
    record: AttendanceRecord;
    phase: 'SESI_1' | 'SESI_2';
    phaseLabel: string;
  } | null>(null);

  const lastTapTimeRef = useRef<{ uid: string; time: number } | null>(null);

  // Simulation mode for testing prayer phases:
  // LIVE: real live clock
  // SESI_1: simulated during 0 to 10 mins after adzan (wudhu & sunnah qobliyah)
  // JEDA_SHOLAT: simulated during 10 to 20 mins after adzan (kiosk tertutup saat sholat fardu)
  // SESI_2: simulated during 20 to 30 mins after adzan (wudhu bagi yg belum, fardu, dzikir, badiyah)
  // STANDBY: simulated outside the 30-min window (siaga menunggu waktu masuk adzan berikutnya)
  // JUMAT_SESI_1: simulated Friday Dzuhur Sesi 1 (-15m s.d. +15m adzan, khusus laki-laki)
  // JUMAT_JEDA: simulated Friday Dzuhur Khutbah & Sholat (+15m s.d. +25m adzan, ditutup)
  // JUMAT_SESI_2: simulated Friday Dzuhur Sesi 2 (+25m s.d. +70m adzan, 45 menit, laki2 & perempuan)
  const [simPhaseMode, setSimPhaseMode] = useState<
    'LIVE' | 'SESI_1' | 'JEDA_SHOLAT' | 'SESI_2' | 'STANDBY' | 'JUMAT_SESI_1' | 'JUMAT_JEDA' | 'JUMAT_SESI_2'
  >('LIVE');

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Selected evaluation options during card tap
  const [selectedWudhu, setSelectedWudhu] = useState<WudhuQuality>('sempurna');
  const [selectedQobliyah, setSelectedQobliyah] = useState<SunnahQobliyahQuality>('qobliyah');
  const [selectedWajib, setSelectedWajib] = useState<SholatWajibQuality>('jamaah_shaf1');
  const [selectedBadiyah, setSelectedBadiyah] = useState<SunnahBadiyahQuality>('badiyah');
  const [selectedSunah, setSelectedSunah] = useState<SholatSunahQuality>('rawatib');
  const [doaDzikir, setDoaDzikir] = useState(true);
  const [simFilterMasjid, setSimFilterMasjid] = useState<string>('ALL');

  const [autoSaveTimer, setAutoSaveTimer] = useState<number | null>(null);

  // Hardware RFID buffer for USB HID Keyboard Wedge scanners
  const rfidBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute effective time based on simulation mode if selected
  const effectiveTime = useMemo(() => {
    if (simPhaseMode === 'LIVE' || !schedule) return currentTime;

    const basePrayer = schedule.dzuhur ? 'Dzuhur' : 'Maghrib';
    const targetTimeStr = schedule.dzuhur || schedule.maghrib || '11:48';
    const [h, m] = targetTimeStr.split(':').map(Number);
    const simulated = new Date(currentTime);

    // If Friday simulation, set day to Friday (e.g. adjust date so getDay() === 5)
    if (simPhaseMode.startsWith('JUMAT_')) {
      const currentDay = simulated.getDay();
      const diffToFriday = (5 - currentDay + 7) % 7;
      if (diffToFriday !== 0) {
        simulated.setDate(simulated.getDate() + diffToFriday);
      }
    }

    if (simPhaseMode === 'SESI_1') {
      // 5 minutes after adzan (fits 0 to 15 min window, Subuh: 0 to 18 min window: masuk adzan, qobliyah & wudhu)
      simulated.setHours(h, m + 5, 0);
    } else if (simPhaseMode === 'JEDA_SHOLAT') {
      // 20 minutes after adzan (fits 15 to 25 min window, Subuh: 18 to 28 min window: sholat fardu, kiosk tertutup 10m)
      simulated.setHours(h, m + 20, 0);
    } else if (simPhaseMode === 'SESI_2') {
      // 30 minutes after adzan (fits 25 to 35 min window, Subuh: 28 to 38 min window: ba'da sholat, fardu, dzikir, badiyah, wudhu bagi yg belum)
      simulated.setHours(h, m + 30, 0);
    } else if (simPhaseMode === 'STANDBY') {
      // 15 minutes before adzan (outside window: siaga menunggu waktu adzan)
      simulated.setHours(h, m - 15, 0);
    } else if (simPhaseMode === 'JUMAT_SESI_1') {
      // 5 minutes before adzan (fits -15m to +15m: Sesi 1 Jumat, santri laki-laki)
      simulated.setHours(h, m - 5, 0);
    } else if (simPhaseMode === 'JUMAT_JEDA') {
      // 18 minutes after adzan (fits +15m to +25m: jeda khutbah & sholat jumat, tertutup)
      simulated.setHours(h, m + 18, 0);
    } else if (simPhaseMode === 'JUMAT_SESI_2') {
      // 35 minutes after adzan (fits +25m to +70m: Sesi 2 Jumat 45 menit, laki2 & perempuan)
      simulated.setHours(h, m + 35, 0);
    }
    return simulated;
  }, [simPhaseMode, currentTime, schedule]);

  // Auto-clear notice for already tapped card after 4.5 seconds
  useEffect(() => {
    if (!alreadyTappedNotice) return;
    const timer = setTimeout(() => {
      setAlreadyTappedNotice(null);
      setActiveStudent(null);
      setCardUidInput('');
    }, 4500);
    return () => clearTimeout(timer);
  }, [alreadyTappedNotice]);

  // Screen Wake Lock API: Prevent TV Android & tablet screen from sleeping during kiosk mode
  useEffect(() => {
    if (!isOpen) return;
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // WakeLock may not be supported or allowed by user agent
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isOpen]);

  const prayerInfo = schedule ? getCurrentActivePrayer(schedule, effectiveTime) : {
    activePrayer: 'Dzuhur' as PrayerType,
    nextPrayer: 'Ashar' as PrayerType,
    nextPrayerTime: '15:10',
    minutesToNext: 30,
    isPrayerWindowActive: true
  };

  // Status jendela buka-tutup kiosk RFID berdasarkan jam adzan (aturan baru: Adzan s.d. +10m Sesi 1, +10m s.d. +20m Sholat Fardu Tertutup, +20m s.d. +30m Sesi 2)
  const kioskWindow: KioskWindowInfo = schedule ? getKioskAdzanWindow(schedule, effectiveTime) : {
    phase: 'SESI_1_QOBLIYAH_WUDHU',
    isOpen: true,
    activePrayer: prayerInfo.activePrayer,
    prayerAdzanTime: '11:48',
    phaseLabel: `Sesi 1: Masuk Adzan & Qobliyah Sholat ${prayerInfo.activePrayer}`,
    phaseDescription: 'Kiosk Terbuka saat masuk adzan selama 10 menit. Khusus mencari Poin Wudhu & Sholat Sunnah Qobliyah.',
    allowedItems: {
      wudhu: true,
      sunnahQobliyah: true,
      sholatWajib: false,
      sunnahBadiyah: false,
      dzikirDoa: false,
    },
    countdownSeconds: 600,
    timeRemainingLabel: 'Ditutup dalam 10m 00s (Saat Sholat Fardu Berjamaah)'
  };

  // Listen for physical USB RFID scanner input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a textarea or special input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.id !== 'rfid-direct-input') return;

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If key is Enter, evaluate accumulated buffer
      if (e.key === 'Enter') {
        const scannedCode = rfidBufferRef.current.trim();
        rfidBufferRef.current = '';
        if (scannedCode.length >= 6) {
          processRfidTap(scannedCode);
        }
        return;
      }

      // If characters come in rapidly (< 150ms), it is an RFID USB hardware scanner
      if (e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
        if (diff > 150) {
          rfidBufferRef.current = e.key;
        } else {
          rfidBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, students, schedule, kioskWindow.isOpen, kioskWindow.phase]);

  const processRfidTap = (uid: string) => {
    // Jika kiosk ditutup saat jeda sholat fardu atau di luar jadwal
    if (!kioskWindow.isOpen) {
      soundEffects.playCardNotFound();
      if (kioskWindow.phase === 'JEDA_SHOLAT_DITUTUP') {
        setClosedWarning(
          `Gerbang Presensi Ditutup Sementara! Sedang berlangsung Sholat Fardu Berjamaah ${kioskWindow.activePrayer} di masjid (Jeda 10 menit). Kiosk akan dibuka kembali ${kioskWindow.timeRemainingLabel} untuk Sesi 2 (Poin Wudhu bagi yang belum, Sholat Fardu, Dzikir/Doa & Ba'diyah).`
        );
      } else {
        setClosedWarning(
          `Kiosk RFID sedang dalam masa Siaga. Kiosk otomatis dibuka tepat saat waktu masuk adzan tiba (${kioskWindow.timeRemainingLabel}).`
        );
      }
      setTimeout(() => setClosedWarning(null), 5500);
      return;
    }

    const cleanUid = uid.trim();
    if (!cleanUid) return;

    // Rapid successive tap debouncing (1.5 seconds)
    if (lastTapTimeRef.current && lastTapTimeRef.current.uid.toLowerCase() === cleanUid.toLowerCase() && (Date.now() - lastTapTimeRef.current.time < 1500)) {
      return;
    }
    lastTapTimeRef.current = { uid: cleanUid, time: Date.now() };

    const found = students.find(s => s.rfidCardUid.toLowerCase() === cleanUid.toLowerCase());

    if (found) {
      // 1. Check if student is active
      if (found.isActive === false) {
        soundEffects.playRejectedBeep();
        setClosedWarning(`Presensi Ditolak: Santri ${found.name} saat ini berstatus Non-Aktif (${found.inactivationReason || 'Izin/Sakit'}).`);
        setTimeout(() => setClosedWarning(null), 5500);
        return;
      }

      // 2. Check if student's mosque is active
      try {
        const rawMosques = localStorage.getItem('dkm_mosque_settings');
        if (rawMosques) {
          const list = JSON.parse(rawMosques);
          const mosque = list.find((m: any) => m.name === found.halaqah);
          if (mosque && mosque.isActive === false) {
            soundEffects.playRejectedBeep();
            setClosedWarning(`Kegiatan Presensi di ${found.halaqah} sedang DINONAKTIFKAN / LIBUR oleh DKM.`);
            setTimeout(() => setClosedWarning(null), 5500);
            return;
          }
        }
      } catch (e) {
        // continue
      }

      // 3. Aturan Khusus Sholat Dhuhur di Hari Jumat:
      const isFridayDzuhur = kioskWindow.isFridayDzuhur || (effectiveTime.getDay() === 5 && prayerInfo.activePrayer === 'Dzuhur');

      // Sesi 1 Jumat: Khusus Santri Laki-laki (15 menit sebelum s.d. 15 menit setelah adzan)
      if (isFridayDzuhur && kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU') {
        if (found.gender !== 'L') {
          soundEffects.playRejectedBeep();
          setClosedWarning(
            `Khusus Santri Laki-Laki (Ikhwan) di Masjid: Sesi 1 Sholat Jumat dibuka 15m sebelum s.d. 15m setelah adzan untuk wudhu dan sholat sunah di masjid. Santri perempuan presensi di Sesi 2 ba'da Sholat Jumat (durasi 45 menit) untuk memperoleh seluruh paket poin.`
          );
          setTimeout(() => setClosedWarning(null), 7000);
          return;
        }
      }

      // Check if student already has a record for today + active prayer
      const todayStr = effectiveTime.toISOString().slice(0, 10);
      const prevRecord = records.find(
        r => r.studentId === found.id && r.date === todayStr && r.prayerType === prayerInfo.activePrayer
      );

      // Aturan: Apabila santri beberapa kali taping kartu di sesi yang sama tetap dihitung 1 kali. Tidak double poin.
      const isAlreadyTappedInSesi1 = kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU' && !!prevRecord && (
        prevRecord.pointsWudhu > 0 || 
        ((prevRecord.pointsSunnahQobliyah ?? 0) > 0) ||
        (Boolean(prevRecord.notes && prevRecord.notes.includes('Sesi 1')))
      );

      const isAlreadyTappedInSesi2 = kioskWindow.phase === 'SESI_2_FARDU_DZIKIR' && !!prevRecord && (
        prevRecord.pointsSholatWajib > 0 || 
        (Boolean(prevRecord.notes && prevRecord.notes.includes('Sesi 2'))) ||
        prevRecord.bonusAdab > 0 ||
        ((prevRecord.pointsSunnahBadiyah ?? 0) > 0)
      );

      if (isAlreadyTappedInSesi1 || isAlreadyTappedInSesi2) {
        soundEffects.playAcceptedBeep();
        setActiveStudent(found);
        setIsUnknownCard(false);
        setVerificationSuccess(false);
        setClosedWarning(null);
        setAutoSaveTimer(null);
        setAlreadyTappedNotice({
          student: found,
          record: prevRecord!,
          phase: isAlreadyTappedInSesi1 ? 'SESI_1' : 'SESI_2',
          phaseLabel: isAlreadyTappedInSesi1 ? 'Sesi 1 (Masuk Adzan & Qobliyah)' : 'Sesi 2 (Ba\'da Sholat & Dzikir)'
        });
        return;
      }

      setAlreadyTappedNotice(null);
      setActiveStudent(found);
      setIsUnknownCard(false);
      setVerificationSuccess(false);
      setClosedWarning(null);

      // Default evaluation preset based on session phase:
      if (isFridayDzuhur && kioskWindow.phase === 'SESI_2_FARDU_DZIKIR') {
        // Aturan Sesi 2 Jumat (45 Menit):
        // - Santri Perempuan: otomatis dapat SEMUA poin: Wudhu, Qobliyah, Dhuhur, Ba'diyah & Dzikir
        // - Santri Laki-laki: Poin Wudhu (bagi yg belum di Sesi 1), Sholat Jumat, Ba'diyah & Dzikir
        if (found.gender === 'P') {
          setSelectedWudhu('sempurna');
          setSelectedQobliyah('qobliyah');
          setSelectedWajib('jamaah_shaf1');
          setSelectedBadiyah('badiyah');
          setSelectedSunah('rawatib');
          setDoaDzikir(true);
        } else {
          // Santri Laki-laki di Sesi 2 Jumat
          if (prevRecord && prevRecord.wudhuQuality && prevRecord.wudhuQuality !== 'tidak') {
            setSelectedWudhu(prevRecord.wudhuQuality as WudhuQuality);
          } else {
            // Bagi yg belum dapat poin wudhu di sesi 1
            setSelectedWudhu('sempurna');
          }
          setSelectedQobliyah('tidak');
          setSelectedWajib('jamaah_shaf1');
          setSelectedBadiyah('badiyah');
          setSelectedSunah('rawatib');
          setDoaDzikir(true);
        }
      } else {
        // Aturan Standar:
        if (prevRecord && prevRecord.wudhuQuality && prevRecord.wudhuQuality !== 'tidak') {
          setSelectedWudhu(prevRecord.wudhuQuality as WudhuQuality);
        } else {
          setSelectedWudhu('sempurna');
        }

        if (prevRecord && prevRecord.sholatSunahQobliyahQuality && prevRecord.sholatSunahQobliyahQuality !== 'tidak') {
          setSelectedQobliyah(prevRecord.sholatSunahQobliyahQuality as SunnahQobliyahQuality);
        } else {
          setSelectedQobliyah('qobliyah');
        }

        setSelectedWajib('jamaah_shaf1');
        setSelectedBadiyah('badiyah');
        setSelectedSunah('rawatib');
        setDoaDzikir(true);
      }

      // Play sharp affirmative accepted beep!
      soundEffects.playAcceptedBeep();

      // Trigger automatic save after 6 seconds if not manually clicked
      setAutoSaveTimer(6);
    } else {
      setActiveStudent(null);
      setIsUnknownCard(true);
      soundEffects.playCardNotFound();
    }
  };

  // Auto-save countdown
  useEffect(() => {
    if (autoSaveTimer === null || autoSaveTimer <= 0) return;
    const interval = setInterval(() => {
      setAutoSaveTimer(prev => {
        if (prev === 1) {
          handleConfirmVerification();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSaveTimer, activeStudent, selectedWudhu, selectedQobliyah, selectedWajib, selectedBadiyah, selectedSunah, doaDzikir, prayerInfo.activePrayer, kioskWindow.phase]);

  const handleConfirmVerification = () => {
    if (!activeStudent) return;

    const points = calculatePoints(
      prayerInfo.activePrayer,
      selectedWudhu,
      selectedWajib,
      selectedSunah,
      doaDzikir,
      selectedQobliyah,
      selectedBadiyah,
      kioskWindow.allowedItems
    );

    const now = new Date();
    const phaseNote = kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU' 
      ? 'Sesi 1: Tap saat adzan 10m (Poin Wudhu & Sunnah Qobliyah)'
      : kioskWindow.phase === 'SESI_2_FARDU_DZIKIR'
      ? "Sesi 2: Tap ba'da sholat 10m (Poin Wudhu bagi yg belum, Sholat Fardu, Dzikir/Doa & Ba'diyah)"
      : doaDzikir ? "Ikut doa dan dzikir ba'da sholat" : 'Tertib berjamaah';

    const record: AttendanceRecord = {
      id: `att-${Date.now().toString().slice(-6)}`,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      rfidCardUid: activeStudent.rfidCardUid,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      halaqah: activeStudent.halaqah,
      prayerType: prayerInfo.activePrayer,
      wudhuQuality: kioskWindow.allowedItems.wudhu ? selectedWudhu : 'tidak',
      pointsWudhu: points.pointsWudhu,
      sholatSunahQobliyahQuality: kioskWindow.allowedItems.sunnahQobliyah ? selectedQobliyah : 'tidak',
      pointsSunnahQobliyah: points.pointsSunnahQobliyah,
      sholatWajibQuality: kioskWindow.allowedItems.sholatWajib ? selectedWajib : 'tidak',
      pointsSholatWajib: points.pointsSholatWajib,
      sholatSunahBadiyahQuality: kioskWindow.allowedItems.sunnahBadiyah ? selectedBadiyah : 'tidak',
      pointsSunnahBadiyah: points.pointsSunnahBadiyah,
      sholatSunahQuality: selectedSunah,
      pointsSholatSunah: points.pointsSholatSunah,
      bonusAdab: points.bonusAdab,
      totalPoints: points.totalPoints,
      verifiedBy: 'Mesin RFID Gate Masjid',
      notes: phaseNote,
      syncedToGoogleSheet: true
    };

    onSaveAttendance(record);
    setVerificationSuccess(true);
    setAutoSaveTimer(null);

    // Confetti celebration for good score
    if (points.totalPoints >= 10) {
      soundEffects.playCelebration();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // fallback
      }
    }

    // Reset back to scan mode after 3.2 seconds
    setTimeout(() => {
      setActiveStudent(null);
      setVerificationSuccess(false);
      setCardUidInput('');
    }, 3200);
  };

  const calculated = calculatePoints(
    prayerInfo.activePrayer,
    selectedWudhu,
    selectedWajib,
    selectedSunah,
    doaDzikir,
    selectedQobliyah,
    selectedBadiyah,
    kioskWindow.allowedItems
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Kiosk Top Bar - Fully Responsive */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 md:px-6 py-2.5 md:py-3.5 flex items-center justify-between gap-2 text-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/50 shrink-0">
            <Scan className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-extrabold text-sm md:text-base tracking-tight truncate text-white">
                GERBANG RFID SANTRI
              </h2>
              <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                DKI JAKARTA
              </span>
              {isStandalone && (
                <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse hidden sm:inline-block">
                  STANDALONE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              Dekatkan Kartu RFID Santri ke Pemindai USB / RFID Reader
            </p>
          </div>
        </div>

        {/* Live Clock, Tools, & Navigation Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-medium">
              <Clock className="w-2.5 h-2.5 text-emerald-400" />
              <span>{kioskWindow.activePrayer}</span>
            </div>
            <div className="font-mono text-sm md:text-lg font-black text-emerald-400">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Action buttons with comfortable touch targets */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Buka Layar Penuh (Fullscreen)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Standalone: Return to Dashboard button. Modal: Open in new tab or close button */}
            {isStandalone ? (
              <button
                onClick={() => {
                  navigateToDashboard();
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 rounded-lg text-white text-xs font-bold transition shadow-xs cursor-pointer"
                title="Beralih ke Dashboard Spreadsheet Admin"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigateToKiosk(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                  title="Buka Kiosk ini di Tab Browser Baru (URL Terpisah)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tab Baru</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Tutup Mode Kiosk & Kembali ke Spreadsheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KIOSK ADZAN TIMING BANNER */}
      <div className={`px-3 md:px-6 py-2 border-b text-xs flex items-center justify-between gap-2 shrink-0 ${
        kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU'
          ? 'bg-sky-950/90 border-sky-800/80 text-sky-200'
          : kioskWindow.phase === 'JEDA_SHOLAT_DITUTUP'
          ? 'bg-rose-950/90 border-rose-800/80 text-rose-200'
          : kioskWindow.phase === 'SESI_2_FARDU_DZIKIR'
          ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-extrabold text-[10px] tracking-wide shrink-0 ${
            kioskWindow.isOpen ? 'bg-emerald-500 text-emerald-950' : 'bg-rose-500 text-white'
          }`}>
            {kioskWindow.isOpen ? '● TERBUKA' : '■ DITUTUP'}
          </span>
          <span className="font-extrabold text-white text-xs truncate">{kioskWindow.phaseLabel}</span>
          <span className="hidden lg:inline text-slate-400">•</span>
          <span className="hidden lg:inline text-[11px] opacity-90">{kioskWindow.phaseDescription}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono font-bold text-xs shrink-0 bg-black/30 px-2.5 py-0.5 rounded-lg border border-white/10">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{kioskWindow.timeRemainingLabel}</span>
        </div>
      </div>

      {/* Main Kiosk Body */}
      <div className="flex-1 p-3 md:p-8 flex items-center justify-center overflow-y-auto">
        {!activeStudent ? (
          /* SCANNING WAITING STATE (Mobile & Desktop Beautiful Design) */
          <div className="max-w-2xl w-full text-center flex flex-col items-center py-1">
            {/* Islamic Greeting Ornament */}
            <div className="text-emerald-400/80 font-serif text-xs md:text-sm tracking-widest mb-1.5 select-none drop-shadow-sm">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            {/* Warning Alert if Tapped while Kiosk is Closed */}
            {closedWarning && (
              <div className="mb-4 p-3.5 bg-rose-950/95 border-2 border-rose-500 rounded-2xl text-rose-200 text-xs flex items-center gap-3 shadow-2xl animate-bounce w-full text-left">
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <div className="font-black text-white text-sm">AKSES PRESENSI DITOLAK SEMENTARA</div>
                  <div className="mt-0.5 text-xs">{closedWarning}</div>
                </div>
              </div>
            )}

            {/* Simulation Phase Selector for Testing Rules - Sleek Horizontal Scroll on Mobile */}
            <div className="mb-4 p-2 md:p-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl w-full flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> Uji Jadwal:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSimPhaseMode('LIVE')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap ${
                    simPhaseMode === 'LIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Gunakan waktu jam asli sekarang"
                >
                  ⏱️ Waktu Nyata
                </button>
                <button
                  type="button"
                  onClick={() => setSimPhaseMode('SESI_1')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap ${
                    simPhaseMode === 'SESI_1'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Simulasi Masuk Adzan (15 menit, Subuh 18 menit): Terbuka untuk Poin Sholat Sunnah Qobliyah & Wudhu"
                >
                  🟢 Sesi 1 (15m/Subuh 18m: Qobliyah & Wudhu)
                </button>
                <button
                  type="button"
                  onClick={() => setSimPhaseMode('JEDA_SHOLAT')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap ${
                    simPhaseMode === 'JEDA_SHOLAT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Simulasi Sholat Fardu (10 menit): Kiosk tertutup saat sholat fardu berjamaah"
                >
                  🔴 Sholat Fardu (Tertutup 10m)
                </button>
                <button
                  type="button"
                  onClick={() => setSimPhaseMode('SESI_2')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap ${
                    simPhaseMode === 'SESI_2'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Simulasi Ba'da Sholat (10 menit): Terbuka lagi untuk Wudhu bagi yg belum, Sholat Wajib, Doa/Dzikir & Ba'diyah"
                >
                  🟢 Sesi 2 (Ba'da Sholat 10m: Wajib & Dzikir)
                </button>
                <button
                  type="button"
                  onClick={() => setSimPhaseMode('STANDBY')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap ${
                    simPhaseMode === 'STANDBY'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Simulasi Siaga Di Luar Jam Sholat: Menunggu waktu masuk adzan berikutnya"
                >
                  ⚪ Siaga (Tunggu Adzan)
                </button>

                {/* Friday Dzuhur special simulation buttons */}
                <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />

                <button
                  type="button"
                  onClick={() => setSimPhaseMode('JUMAT_SESI_1')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap border ${
                    simPhaseMode === 'JUMAT_SESI_1'
                      ? 'bg-sky-600 text-white border-sky-400 shadow-xs'
                      : 'bg-slate-800 text-sky-400 border-sky-900/50 hover:bg-slate-700'
                  }`}
                  title="Simulasi Jumat Sesi 1 (-15m s.d. +15m Adzan): Khusus Santri Laki-laki (Wudhu & Qobliyah)"
                >
                  🕌 Sesi 1 Jumat (Ikhwan 15m sebelum-sesudah)
                </button>

                <button
                  type="button"
                  onClick={() => setSimPhaseMode('JUMAT_JEDA')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap border ${
                    simPhaseMode === 'JUMAT_JEDA'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-xs'
                      : 'bg-slate-800 text-rose-400 border-rose-900/50 hover:bg-slate-700'
                  }`}
                  title="Simulasi Jumat Jeda Khutbah & Sholat (10m): Kiosk ditutup"
                >
                  🔴 Jeda Khutbah & Sholat Jumat (10m)
                </button>

                <button
                  type="button"
                  onClick={() => setSimPhaseMode('JUMAT_SESI_2')}
                  className={`px-2 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer whitespace-nowrap border ${
                    simPhaseMode === 'JUMAT_SESI_2'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                      : 'bg-slate-800 text-emerald-400 border-emerald-900/50 hover:bg-slate-700'
                  }`}
                  title="Simulasi Jumat Sesi 2 (+25m s.d. +70m): Dibuka 45 menit, Santri Laki-laki & Perempuan"
                >
                  🟢 Sesi 2 Jumat (45m: Laki & Perempuan)
                </button>
              </div>
            </div>

            {/* ARTISTIC RFID SCANNER HERO COMPONENT (Mobile-Optimized) */}
            <div className="relative my-2 flex flex-col items-center">
              {/* Outer Glowing Ripple Rings */}
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-44 h-44 md:w-56 md:h-56 rounded-full border border-emerald-500/20 ${kioskWindow.isOpen ? 'animate-ping duration-1000' : ''}`} />
                <div className={`absolute w-36 h-36 md:w-48 md:h-48 rounded-full border-2 ${kioskWindow.isOpen ? 'border-emerald-500/30' : 'border-rose-500/30'} animate-pulse`} />

                {/* Central RFID Touch Scanner Pad */}
                <div 
                  onClick={() => {
                    const firstStudent = students[0];
                    if (firstStudent) processRfidTap(firstStudent.rfidCardUid);
                  }}
                  className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl border-2 flex flex-col items-center justify-center relative transition-all duration-300 shadow-2xl cursor-pointer active:scale-95 group ${
                    kioskWindow.isOpen 
                      ? 'bg-gradient-to-b from-emerald-900/50 via-slate-900 to-slate-950 border-emerald-400/60 shadow-emerald-500/20 hover:border-emerald-300' 
                      : 'bg-gradient-to-b from-rose-900/50 via-slate-900 to-slate-950 border-rose-500/60 shadow-rose-500/20'
                  }`}
                >
                  {/* Glowing NFC Smart Card Icon Visual */}
                  <div className="relative">
                    <Scan className={`w-12 h-12 md:w-16 md:h-16 transition-transform group-hover:scale-110 ${
                      kioskWindow.isOpen ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
                    }`} />
                    <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-spin duration-700" />
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300/90 mt-1 font-mono">
                    {kioskWindow.isOpen ? 'SENSOR RFID' : 'TERKUNCI'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inspiring Titles */}
            <h3 className="text-xl md:text-3xl font-black text-white tracking-tight mt-3">
              {kioskWindow.isOpen ? 'TEMPELKAN KARTU RFID SANTRI' : 'GERBANG PRESENSI SEDANG DITUTUP'}
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-sm md:max-w-md px-2">
              {kioskWindow.isOpen 
                ? 'Dekatkan kartu RFID ke scanner. Poin sholat akan otomatis tercatat sesuai aturan jadwal Kemenag DKI.'
                : 'Kiosk RFID ditutup sementara agar santri fokus sholat berjamaah secara khusyuk.'
              }
            </p>

            {/* Active Prayer Pill */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 font-semibold shadow-xs">
              <span className="text-emerald-400">🕌</span>
              <span>Sholat {kioskWindow.activePrayer}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-emerald-400">{kioskWindow.prayerAdzanTime} WIB</span>
            </div>

            {/* Allowed Points Badges for Current Phase */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-lg px-2">
              {kioskWindow.allowedItems.wudhu && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] md:text-[11px] font-bold">
                  ✓ Wudhu (+5)
                </span>
              )}
              {kioskWindow.allowedItems.sunnahQobliyah && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] md:text-[11px] font-bold">
                  ✓ Qobliyah ({kioskWindow.activePrayer === 'Subuh' ? '+10' : '+5'})
                </span>
              )}
              {kioskWindow.allowedItems.sholatWajib && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] md:text-[11px] font-bold">
                  ✓ Sholat Fardu ({kioskWindow.activePrayer === 'Subuh' ? '+20' : '+10'})
                </span>
              )}
              {kioskWindow.allowedItems.sunnahBadiyah && (
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] md:text-[11px] font-bold">
                  ✓ Ba'diyah (+5)
                </span>
              )}
              {kioskWindow.allowedItems.dzikirDoa && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] md:text-[11px] font-bold">
                  ✓ Dzikir & Doa (+5)
                </span>
              )}
              {!kioskWindow.isOpen && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] md:text-[11px] font-bold">
                  ✕ Tidak Ada Poin (Kiosk Ditutup)
                </span>
              )}
            </div>

            {/* Error Alert if Unknown Card */}
            {isUnknownCard && (
              <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-bounce max-w-md">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Kartu RFID tidak terdaftar di database santri. Daftarkan di menu Master Santri.</span>
              </div>
            )}

            {/* Quick Mobile Student Tap Simulator Carousel */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 w-full max-w-xl">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Uji Cepat Tap Kartu Santri:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {students.filter(s => simFilterMasjid === 'ALL' || s.halaqah === simFilterMasjid).length} Santri
                </span>
              </div>

              {/* Mosque Filter Tabs */}
              <div className="flex items-center gap-1 mb-2.5 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  onClick={() => setSimFilterMasjid('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    simFilterMasjid === 'ALL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSimFilterMasjid('Masjid Baitul Faqih')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    simFilterMasjid === 'Masjid Baitul Faqih'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Baitul Faqih (27)
                </button>
                <button
                  type="button"
                  onClick={() => setSimFilterMasjid('Masjid Alkautsar')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    simFilterMasjid === 'Masjid Alkautsar'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Alkautsar (17)
                </button>
                <button
                  type="button"
                  onClick={() => setSimFilterMasjid('Masjid Baitul Karim')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    simFilterMasjid === 'Masjid Baitul Karim'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Baitul Karim (14)
                </button>
              </div>

              {/* Student Carousel: Smooth touch scroll with photos and names */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin px-1">
                {students
                  .filter(s => simFilterMasjid === 'ALL' || s.halaqah === simFilterMasjid)
                  .map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => processRfidTap(s.rfidCardUid)}
                      title={`${s.name} - ${s.halaqah} - UID: ${s.rfidCardUid}`}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-emerald-950/80 border border-slate-700/80 hover:border-emerald-500 rounded-xl text-left transition shrink-0 cursor-pointer shadow-xs active:scale-95 group min-w-[130px]"
                    >
                      <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate max-w-[90px]">
                          {s.name}
                        </div>
                        <div className="font-mono text-[9px] text-emerald-400">
                          {s.rfidCardUid}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              {/* Manual UID input */}
              <div className="mt-3 flex items-center gap-2 max-w-sm mx-auto">
                <input
                  id="rfid-direct-input"
                  type="text"
                  placeholder="Ketik UID RFID & Enter..."
                  value={cardUidInput}
                  onChange={(e) => setCardUidInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && cardUidInput.trim()) {
                      processRfidTap(cardUidInput.trim());
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500 flex-1 text-center"
                />
                <button
                  type="button"
                  onClick={() => cardUidInput.trim() && processRfidTap(cardUidInput.trim())}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs shrink-0"
                >
                  Scan UID
                </button>
              </div>
            </div>
          </div>
        ) : alreadyTappedNotice ? (
          /* ANTI DOUBLE POIN NOTICE (Taping berulang di sesi yang sama tetap 1 kali dan tidak double poin) */
          <div className="bg-slate-900 border-2 border-sky-500/90 rounded-2xl md:rounded-3xl max-w-lg w-full p-5 md:p-7 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Aturan Sistem: Anti Double Poin Aktif
            </div>

            {/* Student Photo & Identity */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={alreadyTappedNotice.student.avatar}
                  alt={alreadyTappedNotice.student.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-sky-400 shadow-lg shadow-sky-500/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">{alreadyTappedNotice.student.name}</h3>
              <div className="text-xs text-sky-400 font-semibold mt-0.5">🕌 {alreadyTappedNotice.student.halaqah}</div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">UID RFID: {alreadyTappedNotice.student.rfidCardUid}</div>
            </div>

            {/* Presensi Details */}
            <div className="mt-4 p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/70">
                <span className="text-slate-400">Status Presensi:</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Tercatat (Tetap 1x Presensi)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/70">
                <span className="text-slate-400">Sesi Sholat:</span>
                <span className="font-bold text-white">{alreadyTappedNotice.phaseLabel}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Poin Terkumpul:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  +{alreadyTappedNotice.record.totalPoints} Poin (Aman Tersimpan)
                </span>
              </div>
            </div>

            {/* System Rule Banner */}
            <div className="mt-3.5 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs text-left">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <span>🛡️</span> Ketentuan Sistem DKM:
              </div>
              <div className="text-[11px] text-amber-200/90 leading-relaxed">
                Santri melakukan taping kartu berulang kali di sesi yang sama <strong>tetap dihitung 1 kali</strong> dan <strong>tidak double poin</strong>.
              </div>
            </div>

            {/* Advice note */}
            <p className="text-slate-300 text-xs mt-3">
              {alreadyTappedNotice.phase === 'SESI_1'
                ? 'Silakan berwudhu & bersiap sholat fardu berjamaah di shaf pertama. Kiosk Sesi 2 akan dibuka kembali ba\'da sholat.'
                : `Alhamdulillah, seluruh presensi Sholat ${prayerInfo.activePrayer} telah tuntas tercatat.`}
            </p>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAlreadyTappedNotice(null);
                  setActiveStudent(null);
                  setCardUidInput('');
                }}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-sky-600/30"
              >
                Lanjut Scan Santri Lain
              </button>

              <button
                type="button"
                onClick={() => {
                  // Allow ustadz to open evaluation form if adjustments are needed
                  setAlreadyTappedNotice(null);
                  setAutoSaveTimer(null);
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="Buka form evaluasi untuk koreksi penilaian ustadz"
              >
                Koreksi Penilaian (Ustadz)
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE STUDENT VERIFICATION POPUP (Fully Responsive for Mobile) */
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl md:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col p-4 md:p-6 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Success Overlay if confirmed */}
            {verificationSuccess && (
              <div className="absolute inset-0 bg-emerald-950/95 z-30 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-3 shadow-xl shadow-emerald-500/50">
                  <Check className="w-10 h-10 md:w-12 md:h-12" />
                </div>
                <h3 className="text-xl md:text-3xl font-black text-white">
                  {kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU'
                    ? 'ALHAMDULILLAH, SESI 1 TERCATAT!'
                    : kioskWindow.phase === 'SESI_2_FARDU_DZIKIR'
                    ? 'ALHAMDULILLAH, SESI 2 TERCATAT!'
                    : 'ALHAMDULILLAH, PRESENSI TERCATAT!'}
                </h3>
                <p className="text-emerald-300 text-sm md:text-base mt-1 font-medium">
                  {activeStudent.name} mendapatkan <strong>+{calculated.totalPoints} Poin</strong> pada Sholat {prayerInfo.activePrayer}!
                </p>
                {kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU' ? (
                  <p className="text-sky-300 text-xs mt-2 bg-sky-900/50 px-3 py-1.5 rounded-lg border border-sky-600/40 max-w-md">
                    Poin Wudhu & Sholat Sunnah Qobliyah tersimpan. Silakan sholat fardu berjamaah, lalu tap kembali di Sesi 2 ba'da sholat!
                  </p>
                ) : (
                  <div className="mt-3 text-xs text-emerald-400/80 font-mono">
                    Data otomatis tersinkronisasi ke Google Spreadsheet DKM Masjid DKI
                  </div>
                )}
              </div>
            )}

            {/* Student Header Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base md:text-lg font-black text-white truncate max-w-[160px] md:max-w-none">{activeStudent.name}</h3>
                    <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {activeStudent.starBadge}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <span>🕌</span> <span className="truncate">{activeStudent.halaqah}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    RFID: <span className="text-white font-bold">{activeStudent.rfidCardUid}</span> • Streak: <span className="text-orange-400 font-bold">{activeStudent.streakDays} Hari 🔥</span>
                  </div>
                </div>
              </div>

              {/* Sholat badge */}
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sholat:</span>
                <div className="text-sm md:text-base font-black text-emerald-400 uppercase">{prayerInfo.activePrayer}</div>
              </div>
            </div>

            {/* Session Indicator Banner */}
            <div className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border shrink-0 ${
              kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU'
                ? 'bg-sky-950/70 border-sky-500/40 text-sky-200'
                : kioskWindow.phase === 'SESI_2_FARDU_DZIKIR'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <span className={`w-2 h-2 rounded-full ${kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU' ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                <span>{kioskWindow.phaseLabel}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-300 hidden sm:inline">
                {kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU'
                  ? 'Fokus: Poin Wudhu & Qobliyah (10m)'
                  : "Fokus: Wudhu (bagi yg belum), Fardu, Dzikir & Ba'diyah (10m)"}
              </span>
            </div>

            {/* Existing Record Notice */}
            {(() => {
              const todayStr = effectiveTime.toISOString().slice(0, 10);
              const prev = records.find(
                r => r.studentId === activeStudent.id && r.date === todayStr && r.prayerType === prayerInfo.activePrayer
              );

              if (!prev) return null;

              if (kioskWindow.phase === 'SESI_1_QOBLIYAH_WUDHU') {
                return (
                  <div className="mt-2 p-2 bg-sky-900/40 border border-sky-500/30 rounded-xl text-sky-200 text-[11px] flex items-center gap-1.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Santri sudah tap di Sesi 1 (+{prev.totalPoints} Poin). Tap ulang akan memperbarui data Sesi 1.</span>
                  </div>
                );
              }

              if (kioskWindow.phase === 'SESI_2_FARDU_DZIKIR') {
                const s1Points = (prev.pointsWudhu || 0) + (prev.pointsSunnahQobliyah || 0);
                return (
                  <div className="mt-2 p-2 bg-emerald-900/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-[11px] flex items-center gap-1.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      {s1Points > 0 ? (
                        <>
                          <strong className="text-white">Santri telah hadir di Sesi 1 (+{s1Points} Poin Wudhu & Qobliyah).</strong>
                          <span className="block text-[10px] text-emerald-300/80">Poin Sholat Fardu, Dzikir/Doa & Ba'diyah akan otomatis digabungkan.</span>
                        </>
                      ) : (
                        <>
                          <strong className="text-white">Presensi Sesi 2 Terbuka (10 Menit).</strong>
                          <span className="block text-[10px] text-emerald-300/80">Mencatat Poin Wudhu (bagi yang belum tap di Sesi 1), Sholat Fardu, Dzikir & Ba'diyah.</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Quick Scoring & Evaluation Options - Scrollable Body */}
            <div className="flex-1 overflow-y-auto my-2.5 pr-1 space-y-3.5 scrollbar-thin">
            {(() => {
              const todayStr = effectiveTime.toISOString().slice(0, 10);
              const prev = records.find(
                r => r.studentId === activeStudent.id && r.date === todayStr && r.prayerType === prayerInfo.activePrayer
              );
              const hasPrevWudhu = prev && (prev.pointsWudhu || 0) > 0;

              const isSubuh = prayerInfo.activePrayer === 'Subuh';
              const isAshar = prayerInfo.activePrayer === 'Ashar';
              const wajibConfig = isSubuh ? POINT_CONFIG.sholatWajib.subuh : POINT_CONFIG.sholatWajib.selainSubuh;
              const hasBadiyahSunnah = !isSubuh && !isAshar;

              const canScoreWudhu = kioskWindow.allowedItems.wudhu;
              const canScoreQobliyah = kioskWindow.allowedItems.sunnahQobliyah;
              const canScoreWajib = kioskWindow.allowedItems.sholatWajib;
              const canScoreBadiyah = kioskWindow.allowedItems.sunnahBadiyah && hasBadiyahSunnah;
              const canScoreDzikir = kioskWindow.allowedItems.dzikirDoa;

              return (
                <div className="my-5 space-y-4">
                  {/* Wudhu Options */}
                  <div className={!canScoreWudhu ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>
                          {kioskWindow.phase === 'SESI_2_FARDU_DZIKIR'
                            ? hasPrevWudhu
                              ? `1. Poin Wudhu (Sudah Tercatat di Sesi 1: +${prev.pointsWudhu} Pts):`
                              : '1. Poin Wudhu (Bagi yang Belum di Sesi 1: +5 Pts):'
                            : '1. Kualitas & Ketertiban Wudhu (Poin 5):'}
                        </span>
                        {!canScoreWudhu && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Tidak dihitung di Sesi Ini
                          </span>
                        )}
                        {kioskWindow.phase === 'SESI_2_FARDU_DZIKIR' && hasPrevWudhu && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Tersimpan dari Sesi 1
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">
                        +{canScoreWudhu ? POINT_CONFIG.wudhu[selectedWudhu].points : 0} Poin
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {(['sempurna', 'mandiri', 'bimbingan', 'tidak'] as WudhuQuality[]).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWudhu(w)}
                          disabled={!canScoreWudhu}
                          className={`p-2 rounded-lg border text-left transition ${
                            selectedWudhu === w
                              ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-xs'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="capitalize font-medium">{w === 'sempurna' ? 'Sempurna' : w === 'mandiri' ? 'Mandiri' : w === 'bimbingan' ? 'Bimbingan' : 'Tidak'}</div>
                          <div className="text-[10px] opacity-80">+{canScoreWudhu ? POINT_CONFIG.wudhu[w].points : 0} pts</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Sholat Sunnah Qobliyah (Sebelum Sholat Wajib) */}
                  <div className={!canScoreQobliyah ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="text-xs font-bold text-sky-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>
                          2. Sholat Sunnah Qobliyah {isSubuh ? '(2 Rakaat Fajar: 10 Poin)' : '(Qobliyah: 5 Poin)'}:
                        </span>
                        {!canScoreQobliyah && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {prev && (prev.pointsSunnahQobliyah || 0) > 0
                              ? `Tersimpan dari Sesi 1 (+${prev.pointsSunnahQobliyah} Pts)`
                              : 'Hanya dihitung saat Masuk Adzan (Sesi 1)'}
                          </span>
                        )}
                      </span>
                      <span className="text-sky-400 font-mono font-bold">
                        +{canScoreQobliyah ? (selectedQobliyah === 'tidak' ? 0 : (isSubuh ? 10 : 5)) : 0} Poin
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedQobliyah('qobliyah')}
                        disabled={!canScoreQobliyah}
                        className={`p-2 rounded-lg border text-left transition ${
                          selectedQobliyah === 'qobliyah'
                            ? 'bg-sky-600 border-sky-400 text-white font-bold shadow-xs'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate">
                          {isSubuh ? '2 Rakaat Fajar' : 'Qobliyah Rawatib'}
                        </div>
                        <div className="text-[10px] opacity-80">+{canScoreQobliyah ? (isSubuh ? 10 : 5) : 0} pts</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedQobliyah('tahiyyatul_masjid')}
                        disabled={!canScoreQobliyah}
                        className={`p-2 rounded-lg border text-left transition ${
                          selectedQobliyah === 'tahiyyatul_masjid'
                            ? 'bg-sky-600 border-sky-400 text-white font-bold shadow-xs'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate">Tahiyyatul Masjid</div>
                        <div className="text-[10px] opacity-80">+{canScoreQobliyah ? (isSubuh ? 10 : 5) : 0} pts</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedQobliyah('tidak')}
                        disabled={!canScoreQobliyah}
                        className={`p-2 rounded-lg border text-left transition ${
                          selectedQobliyah === 'tidak'
                            ? 'bg-rose-900/60 border-rose-500 text-white font-bold shadow-xs'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate">Tidak Qobliyah</div>
                        <div className="text-[10px] opacity-80">+0 pts</div>
                      </button>
                    </div>
                  </div>

                  {/* 3. Sholat Wajib Berjamaah (Di Tengah Antara Qobliyah dan Ba'diyah) */}
                  <div className={!canScoreWajib ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="text-xs font-bold text-emerald-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>3. Sholat Wajib Berjamaah {isSubuh ? '(Wajib Subuh: 20 Poin)' : '(Selain Subuh: 10 Poin)'}:</span>
                        {!canScoreWajib && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Hanya dihitung setelah Sholat (Sesi 2)
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">
                        +{canScoreWajib ? (wajibConfig[selectedWajib]?.points ?? (isSubuh ? 20 : 10)) : 0} Poin
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {(['jamaah_shaf1', 'jamaah_belakang', 'masbuq'] as SholatWajibQuality[]).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWajib(w)}
                          disabled={!canScoreWajib}
                          className={`p-2 rounded-lg border text-left transition ${
                            selectedWajib === w
                              ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-xs'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="capitalize font-semibold">
                            {w === 'jamaah_shaf1' ? 'Shaf Pertama' : w === 'jamaah_belakang' ? 'Shaf Belakang' : 'Masbuq'}
                          </div>
                          <div className="text-[10px] opacity-80">
                            +{canScoreWajib ? (wajibConfig[w]?.points ?? 0) : 0} pts
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Sholat Sunnah Ba'diyah (Setelah Sholat Wajib) */}
                  <div className={!canScoreBadiyah ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="text-xs font-bold text-teal-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>
                          4. Sholat Sunnah Ba'diyah {hasBadiyahSunnah ? "(Poin 5)" : "(Tidak ada ba'diyah setelah Subuh/Ashar)"}:
                        </span>
                        {!canScoreBadiyah && hasBadiyahSunnah && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Hanya dihitung setelah Sholat (Sesi 2)
                          </span>
                        )}
                      </span>
                      <span className="text-teal-400 font-mono font-bold">
                        +{canScoreBadiyah ? (selectedBadiyah === 'tidak' ? 0 : 5) : 0} Poin
                      </span>
                    </label>
                    {hasBadiyahSunnah ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedBadiyah('badiyah')}
                          disabled={!canScoreBadiyah}
                          className={`p-2 rounded-lg border text-left transition ${
                            selectedBadiyah === 'badiyah'
                              ? 'bg-teal-600 border-teal-400 text-white font-bold shadow-xs'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs truncate">Ba'diyah Rawatib</div>
                          <div className="text-[10px] opacity-80">+{canScoreBadiyah ? 5 : 0} pts</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedBadiyah('tidak')}
                          disabled={!canScoreBadiyah}
                          className={`p-2 rounded-lg border text-left transition ${
                            selectedBadiyah === 'tidak'
                              ? 'bg-rose-900/60 border-rose-500 text-white font-bold shadow-xs'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs truncate">Tidak Ba'diyah</div>
                          <div className="text-[10px] opacity-80">+0 pts</div>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400 italic">
                        Waktu sholat {prayerInfo.activePrayer} tidak ada syariat sholat sunnah ba'diyah.
                      </div>
                    )}
                  </div>

                  {/* 5. Dzikir dan Doa (Poin 5) */}
                  <div className={!canScoreDzikir ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>5. Dzikir dan Doa Ba'da Sholat (Poin 5):</span>
                        {!canScoreDzikir && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Hanya dihitung setelah Sholat (Sesi 2)
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">
                        +{canScoreDzikir && doaDzikir ? POINT_CONFIG.doaDzikir.points : 0} Poin
                      </span>
                    </label>
                    <div>
                      <button
                        type="button"
                        onClick={() => setDoaDzikir(!doaDzikir)}
                        disabled={!canScoreDzikir}
                        className={`w-full p-2.5 rounded-xl border transition flex items-center justify-between text-xs font-semibold ${
                          doaDzikir 
                            ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-xs' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            doaDzikir ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'
                          }`}>
                            {doaDzikir && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span>Mengikuti Dzikir dan Doa Bersama Ba'da Sholat</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">
                          +{canScoreDzikir ? POINT_CONFIG.doaDzikir.points : 0} Poin
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            </div>

            {/* Bottom Actions & Total Points Display - Sticky/Fixed at Bottom */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0 gap-2">
              <div>
                <div className="text-[10px] text-slate-400">Total Poin Sesi:</div>
                <div className="text-xl md:text-2xl font-mono font-black text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0" />
                  <span>+{calculated.totalPoints} Pts</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStudent(null);
                    setAutoSaveTimer(null);
                  }}
                  className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="px-4 sm:px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-700/40 transition flex items-center gap-1.5 transform active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Verifikasi</span>
                  {autoSaveTimer !== null && (
                    <span className="text-[11px] font-mono opacity-80">
                      ({autoSaveTimer}s)
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kiosk Footer: Hadith Motivation */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 md:px-6 py-2 text-center text-[10px] md:text-xs text-slate-400 flex items-center justify-between shrink-0">
        <div className="italic text-emerald-300/90 truncate max-w-sm sm:max-w-xl">
          "Sholat lima waktu adalah penghapus dosa di antara keduanya." (HR. Muslim)
        </div>
        <div className="text-slate-500 font-mono text-[10px] shrink-0 hidden sm:inline">
          Mesin RFID v2.4 • Kemenag DKI
        </div>
      </div>
    </div>
  );
};
