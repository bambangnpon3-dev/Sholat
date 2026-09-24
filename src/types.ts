export type PrayerType = 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';

export interface PrayerSchedule {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  lokasi: string;
  daerah: string;
}

export type WudhuQuality = 'sempurna' | 'mandiri' | 'bimbingan' | 'tidak';
export type SholatWajibQuality = 'jamaah_shaf1' | 'jamaah_belakang' | 'masbuq' | 'munfarid' | 'tidak';
export type SholatSunahQuality = 'rawatib' | 'tahiyyatul_masjid' | 'dhuha_tarawih' | 'tidak';

export type SunnahQobliyahQuality = 'qobliyah' | 'tahiyyatul_masjid' | 'tidak';
export type SunnahBadiyahQuality = 'badiyah' | 'witir' | 'tidak';

export interface PointConfig {
  wudhu: Record<WudhuQuality, { label: string; points: number }>;
  sholatWajib: {
    subuh: Record<SholatWajibQuality, { label: string; points: number }>;
    selainSubuh: Record<SholatWajibQuality, { label: string; points: number }>;
  };
  sholatSunah: {
    sebelumSubuh: Record<SholatSunahQuality, { label: string; points: number }>;
    selainSubuh: Record<SholatSunahQuality, { label: string; points: number }>;
  };
  qobliyah: {
    subuh: { label: string; points: number };
    selainSubuh: { label: string; points: number };
  };
  badiyah: {
    selainSubuh: { label: string; points: number };
    subuh: { label: string; points: number };
  };
  doaDzikir: { label: string; points: number };
}

export type NamaMasjid = 'Masjid Baitul Faqih' | 'Masjid Alkautsar' | 'Masjid Baitul Karim';

export type KioskSessionPhase = 
  | 'SESI_1_QOBLIYAH_WUDHU' // Masuk adzan 15 menit (khusus Subuh 18 menit): Poin sholat sunah qobliyah & wudhu
  | 'JEDA_SHOLAT_DITUTUP'    // Tertutup 10 menit saat sholat fardu berjamaah
  | 'SESI_2_FARDU_DZIKIR'    // Terbuka lagi 10 menit: Poin wudhu bagi yg belum, sholat wajib, doa dan dzikir, sholat ba'diyah
  | 'DILUAR_JADWAL';         // Diluar jadwal buka kiosk (siaga menunggu waktu masuk adzan berikutnya)

export interface KioskWindowInfo {
  phase: KioskSessionPhase;
  isOpen: boolean;
  activePrayer: PrayerType;
  prayerAdzanTime: string;
  phaseLabel: string;
  phaseDescription: string;
  allowedItems: {
    wudhu: boolean;
    sunnahQobliyah: boolean;
    sholatWajib: boolean;
    sunnahBadiyah: boolean;
    dzikirDoa: boolean;
  };
  countdownSeconds: number;
  timeRemainingLabel: string;
  isFridayDzuhur?: boolean;
  isFridayDzuhurSesi1BoysOnly?: boolean;
  targetGender?: 'L' | 'P' | 'ALL';
}

export interface MosqueSetting {
  id: string;
  name: string;
  isActive: boolean;
  notes?: string;
}

export interface Student {
  id: string;
  rfidCardUid: string;
  name: string;
  nickname: string;
  gender: 'L' | 'P';
  age?: number;
  halaqah: string; // Nama Masjid (Masjid Baitul Faqih, Masjid Alkautsar, Masjid Baitul Karim)
  namaMasjid?: NamaMasjid | string;
  parentName?: string;
  parentPhone?: string;
  avatar: string;
  totalPoints: number;
  totalAttendances: number;
  streakDays: number;
  starBadge: 'Bintang Emas' | 'Bintang Perak' | 'Bintang Perunggu' | 'Santri Teladan';
  isActive?: boolean;
  inactivationReason?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  rfidCardUid: string;
  studentId: string;
  studentName: string;
  halaqah: string; // Nama Masjid
  namaMasjid?: NamaMasjid | string;
  prayerType: PrayerType;
  wudhuQuality: WudhuQuality;
  pointsWudhu: number;
  // 1. Sholat Sunnah Qobliyah (Sebelum Sholat Wajib)
  sholatSunahQobliyahQuality?: SunnahQobliyahQuality | string;
  pointsSunnahQobliyah?: number;
  // 2. Sholat Wajib
  sholatWajibQuality: SholatWajibQuality;
  pointsSholatWajib: number;
  // 3. Sholat Sunnah Ba'diyah (Setelah Sholat Wajib)
  sholatSunahBadiyahQuality?: SunnahBadiyahQuality | string;
  pointsSunnahBadiyah?: number;
  // Legacy / aggregated field
  sholatSunahQuality: SholatSunahQuality;
  pointsSholatSunah: number;
  bonusAdab: number; // Dzikir & Doa (5 poin)
  totalPoints: number;
  verifiedBy: string; // e.g. "Auto-RFID (Gate 1)", "Ustadz Hanif"
  notes?: string;
  syncedToGoogleSheet?: boolean;
}

export type SpreadsheetTabId = 
  | 'absensi' 
  | 'jadwal_dki' 
  | 'laporan_harian' 
  | 'laporan_mingguan' 
  | 'laporan_bulanan' 
  | 'master_santri' 
  | 'apps_script';

export interface SpreadsheetTab {
  id: SpreadsheetTabId;
  label: string;
  color: string;
  countBadge?: number | string;
}

export interface DailyReportSummary {
  date: string;
  totalStudents: number;
  totalPresent: number;
  subuhCount: number;
  dzuhurCount: number;
  asharCount: number;
  maghribCount: number;
  isyaCount: number;
  avgPoints: number;
  totalPointsEarned: number;
  topStudentToday?: string;
}

export interface WeeklyReportSummary {
  weekLabel: string;
  startDate: string;
  endDate: string;
  dailyStats: {
    day: string;
    date: string;
    totalAttendance: number;
    avgPoints: number;
  }[];
  prayerDistribution: Record<PrayerType, number>;
  topStudents: {
    studentName: string;
    halaqah: string;
    attendanceCount: number;
    totalPoints: number;
  }[];
}

export interface MonthlyReportSummary {
  monthName: string;
  year: number;
  totalPrayersTarget: number; // e.g. 150
  studentRankings: {
    rank: number;
    student: Student;
    totalPrayersAttended: number;
    attendancePercentage: number;
    wudhuAvgPoints: number;
    sunnahAvgPoints: number;
    totalPoints: number;
    badge: string;
  }[];
}
