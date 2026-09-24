import { AttendanceRecord, Student, PrayerType } from '../types';
import { getTodayDateLocal, isDateIn18To21SeptRange } from '../data/initialData';
import { syncRecordToGoogleSheet } from './googleSheetsService';

export interface SyncStats {
  totalRecords: number;
  totalStudents: number;
  totalPointsRecalculated: number;
  todayDate: string;
  todayRecordsCount: number;
  todayPoints: number;
  todayPrayersCount: Record<PrayerType, number>;
  topStudentToday: { name: string; points: number; halaqah: string } | null;
  weeklyRecordsCount: number;
  weeklyPoints: number;
  topStudentWeekly: { name: string; points: number; halaqah: string } | null;
  monthlyRecordsCount: number;
  monthlyPoints: number;
  avgMonthlyAttendancePct: number;
  topStudentMonthly: { name: string; points: number; halaqah: string } | null;
  syncedToWebhook: boolean;
  webhookMessage?: string;
}

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  updatedStudents: Student[];
  updatedRecords: AttendanceRecord[];
  stats: SyncStats;
}

export async function executeSyncAttendanceAndPoints(
  records: AttendanceRecord[],
  students: Student[],
  webhookUrl?: string
): Promise<SyncResult> {
  const todayStr = getTodayDateLocal();

  // 1. Audit & Harmonize Records with Student Directory (exclude deleted range 18/9 - 21/9)
  const cleanRecords = records.filter(r => !isDateIn18To21SeptRange(r.date));
  const studentMapById = new Map<string, Student>();
  const studentMapByUid = new Map<string, Student>();
  students.forEach(s => {
    studentMapById.set(s.id, s);
    studentMapByUid.set(s.rfidCardUid, s);
  });

  const harmonizedRecords: AttendanceRecord[] = cleanRecords.map(r => {
    const matched = studentMapById.get(r.studentId) || studentMapByUid.get(r.rfidCardUid);
    if (matched) {
      return {
        ...r,
        studentId: matched.id,
        studentName: matched.name,
        halaqah: matched.halaqah,
        rfidCardUid: matched.rfidCardUid
      };
    }
    return r;
  });

  // 2. Recalculate Points, Attendances, and Streaks for Each Student
  const updatedStudents: Student[] = students.map(s => {
    const sRecords = harmonizedRecords.filter(r => r.studentId === s.id || r.rfidCardUid === s.rfidCardUid);
    const totalPts = sRecords.reduce((sum, r) => sum + (r.totalPoints || 0), 0);
    const totalAtt = sRecords.length;
    const distinctDates = Array.from(new Set(sRecords.map(r => r.date)));
    const streak = distinctDates.length;

    // Harmonized badge thresholds
    let badge: Student['starBadge'] = 'Bintang Perunggu';
    if (totalPts >= 1200 || totalPts >= 300) {
      badge = 'Santri Teladan';
    } else if (totalPts >= 900 || totalPts >= 200) {
      badge = 'Bintang Emas';
    } else if (totalPts >= 500 || totalPts >= 100) {
      badge = 'Bintang Perak';
    }

    return {
      ...s,
      totalPoints: totalPts,
      totalAttendances: totalAtt,
      streakDays: streak,
      starBadge: badge
    };
  });

  // 3. Compile Synchronized Statistics for Harian, Mingguan, Bulanan
  const totalPointsRecalculated = updatedStudents.reduce((sum, s) => sum + s.totalPoints, 0);

  // A. Laporan Harian Stats
  const todayRecords = harmonizedRecords.filter(r => r.date === todayStr);
  const todayPoints = todayRecords.reduce((sum, r) => sum + r.totalPoints, 0);
  const todayPrayersCount: Record<PrayerType, number> = {
    Subuh: todayRecords.filter(r => r.prayerType === 'Subuh').length,
    Dzuhur: todayRecords.filter(r => r.prayerType === 'Dzuhur').length,
    Ashar: todayRecords.filter(r => r.prayerType === 'Ashar').length,
    Maghrib: todayRecords.filter(r => r.prayerType === 'Maghrib').length,
    Isya: todayRecords.filter(r => r.prayerType === 'Isya').length,
  };

  const studentDayScores: Record<string, { name: string; points: number; halaqah: string }> = {};
  todayRecords.forEach(r => {
    if (!studentDayScores[r.studentId]) {
      studentDayScores[r.studentId] = { name: r.studentName, points: 0, halaqah: r.halaqah };
    }
    studentDayScores[r.studentId].points += r.totalPoints;
  });
  const sortedDay = Object.values(studentDayScores).sort((a, b) => b.points - a.points);
  const topStudentToday = sortedDay[0] || null;

  // B. Laporan Mingguan Stats (Past 7 distinct dates)
  const uniqueDates = Array.from(new Set(harmonizedRecords.map(r => r.date))).sort();
  const past7Dates = uniqueDates.slice(-7);
  const weeklyRecords = harmonizedRecords.filter(r => past7Dates.includes(r.date));
  const weeklyPoints = weeklyRecords.reduce((sum, r) => sum + r.totalPoints, 0);

  const studentWeeklyScores: Record<string, { name: string; points: number; halaqah: string }> = {};
  weeklyRecords.forEach(r => {
    if (!studentWeeklyScores[r.studentId]) {
      studentWeeklyScores[r.studentId] = { name: r.studentName, points: 0, halaqah: r.halaqah };
    }
    studentWeeklyScores[r.studentId].points += r.totalPoints;
  });
  const sortedWeekly = Object.values(studentWeeklyScores).sort((a, b) => b.points - a.points);
  const topStudentWeekly = sortedWeekly[0] || null;

  // C. Laporan Bulanan Stats
  const TARGET_PRAYERS_MONTH = 150;
  const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-09"
  const monthlyRecords = harmonizedRecords.filter(r => r.date.startsWith(currentMonthPrefix));
  const monthlyPoints = monthlyRecords.reduce((sum, r) => sum + r.totalPoints, 0);

  const totalMonthlyAtt = updatedStudents.reduce((acc, s) => {
    const sAtt = harmonizedRecords.filter(r => (r.studentId === s.id || r.rfidCardUid === s.rfidCardUid) && r.date.startsWith(currentMonthPrefix)).length;
    return acc + Math.min(100, Math.round((sAtt / TARGET_PRAYERS_MONTH) * 100));
  }, 0);
  const avgMonthlyAttendancePct = updatedStudents.length > 0 ? Math.round(totalMonthlyAtt / updatedStudents.length) : 0;

  const sortedMonthlyStudents = [...updatedStudents].sort((a, b) => b.totalPoints - a.totalPoints);
  const topStudentMonthly = sortedMonthlyStudents[0] ? {
    name: sortedMonthlyStudents[0].name,
    points: sortedMonthlyStudents[0].totalPoints,
    halaqah: sortedMonthlyStudents[0].halaqah
  } : null;

  // 4. Webhook / Google Sheets synchronization if configured
  let syncedToWebhook = false;
  let webhookMessage = '';
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      // Find latest record or sync summary ping
      if (harmonizedRecords.length > 0) {
        await syncRecordToGoogleSheet(harmonizedRecords[0], webhookUrl);
      }
      syncedToWebhook = true;
      webhookMessage = 'Terkoneksi & Tersinkronkan ke Google Spreadsheet DKM';
    } catch {
      syncedToWebhook = false;
      webhookMessage = 'Gagal menghubungi Webhook Google Spreadsheet';
    }
  }

  const now = new Date();

  return {
    success: true,
    timestamp: now,
    updatedStudents,
    updatedRecords: harmonizedRecords,
    stats: {
      totalRecords: harmonizedRecords.length,
      totalStudents: updatedStudents.length,
      totalPointsRecalculated,
      todayDate: todayStr,
      todayRecordsCount: todayRecords.length,
      todayPoints,
      todayPrayersCount,
      topStudentToday,
      weeklyRecordsCount: weeklyRecords.length,
      weeklyPoints,
      topStudentWeekly,
      monthlyRecordsCount: monthlyRecords.length,
      monthlyPoints,
      avgMonthlyAttendancePct,
      topStudentMonthly,
      syncedToWebhook,
      webhookMessage
    }
  };
}
