/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  AttendanceRecord, 
  PrayerSchedule, 
  PrayerType, 
  SpreadsheetTabId 
} from './types';
import { 
  INITIAL_STUDENTS, 
  generateInitialAttendanceRecords,
  getTodayDateLocal,
  recalculateStudentPoints,
  isDateIn18To21SeptRange,
  filterOutRecords18To21Sept
} from './data/initialData';
import { fetchKemenagPrayerTimes, getCurrentActivePrayer } from './services/prayerTimeService';
import { exportAttendanceToCSV, syncRecordToGoogleSheet } from './services/googleSheetsService';

import { GoogleSheetsHeader } from './components/GoogleSheetsHeader';
import { GoogleSheetsToolbar } from './components/GoogleSheetsToolbar';
import { SheetsTabsBar } from './components/SheetsTabsBar';

import { AbsensiSpreadsheetView } from './components/views/AbsensiSpreadsheetView';
import { JadwalSholatKemenagView } from './components/views/JadwalSholatKemenagView';
import { LaporanHarianView } from './components/views/LaporanHarianView';
import { LaporanMingguanView } from './components/views/LaporanMingguanView';
import { LaporanBulananView } from './components/views/LaporanBulananView';
import { MasterSantriView } from './components/views/MasterSantriView';
import { GoogleSheetsIntegrationView } from './components/views/GoogleSheetsIntegrationView';
import { JurnalPublikLiveView } from './components/views/JurnalPublikLiveView';
import { PeringkatHarianPublikView } from './components/views/PeringkatHarianPublikView';

import { RfidKioskModal } from './components/kiosk/RfidKioskModal';
import { AddAttendanceManualModal } from './components/modals/AddAttendanceManualModal';
import { KioskLinkModal } from './components/modals/KioskLinkModal';
import { SyncStatusModal } from './components/modals/SyncStatusModal';
import { executeSyncAttendanceAndPoints, SyncResult } from './services/syncService';
import { 
  isKioskRouteActive, 
  navigateToDashboard,
  isPublicJournalRouteActive,
  navigateToPublicJournal,
  isDailyRankingRouteActive,
  navigateToDailyRanking
} from './services/kioskRoutingService';

export default function App() {
  // Document Title
  const [documentTitle, setDocumentTitle] = useState<string>(() => {
    return localStorage.getItem('dkm_doc_title') || 'Jadwal & Absensi Sholat Santri Masjid DKI Jakarta';
  });

  // Dedicated Standalone Kiosk Route detection (?mode=kiosk, #kiosk, /kiosk)
  const [isStandaloneKiosk, setIsStandaloneKiosk] = useState<boolean>(() => isKioskRouteActive());
  const [isPublicJournal, setIsPublicJournal] = useState<boolean>(() => isPublicJournalRouteActive());
  const [isDailyRanking, setIsDailyRanking] = useState<boolean>(() => isDailyRankingRouteActive());
  const [isKioskLinkModalOpen, setIsKioskLinkModalOpen] = useState(false);

  // Listen to route changes (hash changes, pushState, popstate)
  useEffect(() => {
    const handleRouteChange = () => {
      setIsStandaloneKiosk(isKioskRouteActive());
      setIsPublicJournal(isPublicJournalRouteActive());
      setIsDailyRanking(isDailyRankingRouteActive());
    };
    window.addEventListener('kiosk-route-change', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('kiosk-route-change', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Helper to filter out today, future records AND deleted range 18/9 s.d. 21/9
  const filterOutInvalidRecords = (list: AttendanceRecord[]): AttendanceRecord[] => {
    const todayStr = getTodayDateLocal();
    const todayUtc = new Date().toISOString().slice(0, 10);
    return list.filter(r => r.date < todayStr && r.date < todayUtc && !isDateIn18To21SeptRange(r.date));
  };

  // Attendance records with local storage persistence - strictly excluding today, future, and 18/9 - 21/9
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const savedV3 = localStorage.getItem('dkm_attendance_records_v3');
    if (savedV3) {
      try {
        const parsed: AttendanceRecord[] = JSON.parse(savedV3);
        if (Array.isArray(parsed)) {
          return filterOutInvalidRecords(parsed);
        }
      } catch { /* fallback */ }
    }
    const saved = localStorage.getItem('dkm_attendance_records_v2');
    if (saved) {
      try { 
        const parsed: AttendanceRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterOutInvalidRecords(parsed); 
        }
      } catch { /* fallback */ }
    }
    const oldSaved = localStorage.getItem('dkm_attendance_records');
    if (oldSaved) {
      try {
        const parsed: AttendanceRecord[] = JSON.parse(oldSaved);
        if (Array.isArray(parsed)) {
          return filterOutInvalidRecords(parsed);
        }
      } catch { /* fallback */ }
    }
    return filterOutInvalidRecords(generateInitialAttendanceRecords());
  });

  // Students list with local storage persistence and points accurately synchronized
  const [students, setStudents] = useState<Student[]>(() => {
    let baseList = INITIAL_STUDENTS;
    const savedV3 = localStorage.getItem('dkm_students_data_v3');
    if (savedV3) {
      try {
        const parsed: Student[] = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
          baseList = parsed;
        }
      } catch { /* fallback */ }
    } else {
      const saved = localStorage.getItem('dkm_students_data_v2');
      if (saved) {
        try { 
          const parsed: Student[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
            baseList = parsed;
          }
        } catch { /* fallback */ }
      }
    }
    return recalculateStudentPoints(baseList, records);
  });

  // Google Sheets Webhook URL
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('dkm_sheets_webhook_url') || '';
  });

  // Active Sheet tab
  const [activeTab, setActiveTab] = useState<SpreadsheetTabId>('absensi');

  // Live Kemenag DKI Schedule
  const [schedule, setSchedule] = useState<PrayerSchedule | null>(null);
  const [isLoadingPrayer, setIsLoadingPrayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Kiosk and Modal States
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Spreadsheet formula bar state
  const [selectedCellCoordinate, setSelectedCellCoordinate] = useState('K2');
  const [formulaContent, setFormulaContent] = useState('=SUM(G2:J2)');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrayer, setFilterPrayer] = useState('ALL');

  // Synchronization State (Harmonize attendance, recalculate points, and sync daily, weekly, monthly reports)
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('dkm_last_sync_timestamp');
    return saved ? new Date(saved) : null;
  });
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('dkm_doc_title', documentTitle);
  }, [documentTitle]);

  useEffect(() => {
    localStorage.setItem('dkm_students_data_v3', JSON.stringify(students));
    localStorage.setItem('dkm_students_data_v2', JSON.stringify(students));
    localStorage.setItem('dkm_students_data', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(records));
    localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(records));
    localStorage.setItem('dkm_attendance_records', JSON.stringify(records));
  }, [records]);

  // Purge any today, future records, AND 18/9 - 21/9 records on startup to ensure points/attendance are clean
  useEffect(() => {
    const todayStr = getTodayDateLocal();
    const todayUtc = new Date().toISOString().slice(0, 10);
    const hasInvalid = records.some(r => r.date >= todayStr || r.date >= todayUtc || isDateIn18To21SeptRange(r.date));
    if (hasInvalid) {
      const cleanRecords = filterOutInvalidRecords(records);
      setRecords(cleanRecords);
      const cleanStudents = recalculateStudentPoints(students, cleanRecords);
      setStudents(cleanStudents);
      localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(cleanRecords));
      localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(cleanRecords));
      localStorage.setItem('dkm_attendance_records', JSON.stringify(cleanRecords));
      localStorage.setItem('dkm_students_data_v3', JSON.stringify(cleanStudents));
      localStorage.setItem('dkm_students_data_v2', JSON.stringify(cleanStudents));
      localStorage.setItem('dkm_students_data', JSON.stringify(cleanStudents));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dkm_sheets_webhook_url', webhookUrl);
  }, [webhookUrl]);

  // Listen for standalone kiosk URL changes (?mode=kiosk, #kiosk, /kiosk)
  useEffect(() => {
    const handleRouteChange = () => {
      setIsStandaloneKiosk(isKioskRouteActive());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('kiosk-route-change', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('kiosk-route-change', handleRouteChange);
    };
  }, []);

  // Fetch Kemenag DKI Jakarta prayer schedule
  const loadKemenagPrayerTimes = async () => {
    setIsLoadingPrayer(true);
    try {
      const data = await fetchKemenagPrayerTimes(new Date());
      setSchedule(data);
    } catch (err) {
      console.error('Failed to load prayer times:', err);
    } finally {
      setIsLoadingPrayer(false);
    }
  };

  useEffect(() => {
    loadKemenagPrayerTimes();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Compute active prayer and countdown
  const activePrayerInfo = useMemo(() => {
    if (!schedule) {
      return {
        activePrayer: 'Maghrib' as PrayerType,
        nextPrayer: 'Isya' as PrayerType,
        nextPrayerTime: '19:01',
        minutesToNext: 20
      };
    }
    return getCurrentActivePrayer(schedule, currentTime);
  }, [schedule, currentTime]);

  const countdownText = useMemo(() => {
    const mins = activePrayerInfo.minutesToNext;
    if (mins <= 0) return 'Sedang Waktu Sholat';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}j ` : ''}${m}m menuju ${activePrayerInfo.nextPrayer}`;
  }, [activePrayerInfo]);

  // Handle saving new attendance record (from RFID Kiosk or Manual modal)
  // Handle saving new attendance record (from RFID Kiosk or Manual modal)
  // Aturan Sistem: Apabila santri beberapa kali taping kartu di sesi yang sama, tetap dihitung 1 kali dan tidak double poin.
  const handleSaveAttendance = (record: AttendanceRecord) => {
    setRecords(prevRecords => {
      // Check if there is already a record for this student on the same date and prayer
      const existingIndex = prevRecords.findIndex(
        r => r.studentId === record.studentId && r.date === record.date && r.prayerType === record.prayerType
      );

      if (existingIndex >= 0) {
        // Record already exists for this prayer (e.g. Sesi 1 wudhu/sunnah recorded, now adding Sesi 2 fardu/dzikir, or duplicate tap)
        const existing = prevRecords[existingIndex];

        // Konsolidasi nilai per komponen secara ketat (tidak berlipat ganda)
        const pointsWudhu = record.pointsWudhu > 0 ? Math.max(record.pointsWudhu, existing.pointsWudhu) : existing.pointsWudhu;
        const wudhuQuality = record.wudhuQuality !== 'tidak' ? record.wudhuQuality : existing.wudhuQuality;

        const pointsSunnahQobliyah = (record.pointsSunnahQobliyah && record.pointsSunnahQobliyah > 0)
          ? Math.max(record.pointsSunnahQobliyah, existing.pointsSunnahQobliyah || 0)
          : (existing.pointsSunnahQobliyah || 0);
        const sholatSunahQobliyahQuality = record.sholatSunahQobliyahQuality !== 'tidak'
          ? record.sholatSunahQobliyahQuality
          : existing.sholatSunahQobliyahQuality;

        const pointsSholatWajib = record.pointsSholatWajib > 0 ? Math.max(record.pointsSholatWajib, existing.pointsSholatWajib) : existing.pointsSholatWajib;
        const sholatWajibQuality = record.sholatWajibQuality !== 'tidak' ? record.sholatWajibQuality : existing.sholatWajibQuality;

        const pointsSunnahBadiyah = (record.pointsSunnahBadiyah && record.pointsSunnahBadiyah > 0)
          ? Math.max(record.pointsSunnahBadiyah, existing.pointsSunnahBadiyah || 0)
          : (existing.pointsSunnahBadiyah || 0);
        const sholatSunahBadiyahQuality = record.sholatSunahBadiyahQuality !== 'tidak'
          ? record.sholatSunahBadiyahQuality
          : existing.sholatSunahBadiyahQuality;

        const bonusAdab = Math.max(record.bonusAdab || 0, existing.bonusAdab || 0);

        const totalPoints = pointsWudhu + pointsSunnahQobliyah + pointsSholatWajib + pointsSunnahBadiyah + bonusAdab;
        // Poin bertambah HANYA jika ada fase ibadah baru yang ditambahkan (misal Sesi 2 setelah Sesi 1)
        // Jika taping berulang di sesi yang sama, pointsDiff = 0 (TIDAK DOUBLE POIN)
        const pointsDiff = Math.max(0, totalPoints - existing.totalPoints);

        const mergedRecord: AttendanceRecord = {
          ...existing,
          time: existing.time.includes(record.time) ? existing.time : `${existing.time} / ${record.time}`,
          wudhuQuality,
          pointsWudhu,
          sholatSunahQobliyahQuality,
          pointsSunnahQobliyah,
          sholatWajibQuality,
          pointsSholatWajib,
          sholatSunahBadiyahQuality,
          pointsSunnahBadiyah,
          sholatSunahQuality: record.sholatSunahQuality !== 'tidak' ? record.sholatSunahQuality : existing.sholatSunahQuality,
          pointsSholatSunah: pointsSunnahQobliyah + pointsSunnahBadiyah,
          bonusAdab,
          totalPoints,
          notes: (pointsWudhu > 0 && pointsSholatWajib > 0)
            ? "Sesi 1 & 2 Lengkap (Wudhu, Qobliyah, Fardu, Dzikir/Doa & Ba'diyah)"
            : record.notes || existing.notes,
          syncedToGoogleSheet: true
        };

        const next = [...prevRecords];
        next[existingIndex] = mergedRecord;

        // Update student's points by the newly added difference only (TIDAK DOUBLE POIN, kehadiran tetap dihitung 1x)
        if (pointsDiff > 0) {
          setStudents(prevStudents => prevStudents.map(s => {
            if (s.id === record.studentId) {
              const newTotalPts = s.totalPoints + pointsDiff;
              let badge: Student['starBadge'] = 'Bintang Perunggu';
              if (newTotalPts >= 300) badge = 'Santri Teladan';
              else if (newTotalPts >= 200) badge = 'Bintang Emas';
              else if (newTotalPts >= 100) badge = 'Bintang Perak';

              return {
                ...s,
                totalPoints: newTotalPts,
                starBadge: badge
              };
            }
            return s;
          }));
        }

        if (webhookUrl) {
          syncRecordToGoogleSheet(mergedRecord, webhookUrl);
        }
        return next;
      }

      // New attendance record (Pertama kali tap di sesi sholat hari ini)
      const nextRecords = [record, ...prevRecords];

      // Update student's points and streak (kehadiran bertambah 1x)
      setStudents(prevStudents => prevStudents.map(s => {
        if (s.id === record.studentId) {
          const newTotalPts = s.totalPoints + record.totalPoints;
          const newTotalAtt = s.totalAttendances + 1;
          const newStreak = s.streakDays + 1;

          let badge: Student['starBadge'] = 'Bintang Perunggu';
          if (newTotalPts >= 300) badge = 'Santri Teladan';
          else if (newTotalPts >= 200) badge = 'Bintang Emas';
          else if (newTotalPts >= 100) badge = 'Bintang Perak';

          return {
            ...s,
            totalPoints: newTotalPts,
            totalAttendances: newTotalAtt,
            streakDays: newStreak,
            starBadge: badge
          };
        }
        return s;
      }));

      // Auto sync to Google Spreadsheet if webhook is configured
      if (webhookUrl) {
        syncRecordToGoogleSheet(record, webhookUrl);
      }

      return nextRecords;
    });
  };

  // Cell selection on spreadsheet
  const handleSelectCell = (coord: string, val: string) => {
    setSelectedCellCoordinate(coord);
    setFormulaContent(val);
  };

  // Student CRUD operations
  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => {
      const next = [newStudent, ...prev];
      localStorage.setItem('dkm_students_data_v3', JSON.stringify(next));
      localStorage.setItem('dkm_students_data_v2', JSON.stringify(next));
      localStorage.setItem('dkm_students_data', JSON.stringify(next));
      return next;
    });
    window.dispatchEvent(new Event('kiosk-attendance-updated'));
    window.dispatchEvent(new Event('storage'));
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    // 1. Update students in state & immediate localStorage
    setStudents(prev => {
      const next = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      localStorage.setItem('dkm_students_data_v3', JSON.stringify(next));
      localStorage.setItem('dkm_students_data_v2', JSON.stringify(next));
      localStorage.setItem('dkm_students_data', JSON.stringify(next));
      return next;
    });

    // 2. Cascade changes to attendance records (update studentName, rfidCardUid, halaqah)
    setRecords(prev => {
      let isChanged = false;
      const next = prev.map(r => {
        if (r.studentId === updatedStudent.id) {
          isChanged = true;
          return {
            ...r,
            studentName: updatedStudent.name,
            rfidCardUid: updatedStudent.rfidCardUid,
            halaqah: updatedStudent.halaqah,
            namaMasjid: updatedStudent.halaqah,
          };
        }
        return r;
      });
      if (isChanged) {
        localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(next));
        localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(next));
        localStorage.setItem('dkm_attendance_records', JSON.stringify(next));
      }
      return next;
    });

    // 3. Dispatch global sync event for any open components or modals
    window.dispatchEvent(new Event('kiosk-attendance-updated'));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => {
      const next = prev.filter(s => s.id !== id);
      localStorage.setItem('dkm_students_data_v3', JSON.stringify(next));
      localStorage.setItem('dkm_students_data_v2', JSON.stringify(next));
      localStorage.setItem('dkm_students_data', JSON.stringify(next));
      return next;
    });
    setRecords(prev => {
      const next = prev.filter(r => r.studentId !== id);
      localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(next));
      localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(next));
      localStorage.setItem('dkm_attendance_records', JSON.stringify(next));
      return next;
    });
    window.dispatchEvent(new Event('kiosk-attendance-updated'));
    window.dispatchEvent(new Event('storage'));
  };

  // Helper to persist records and student points synchronization across local storage
  const syncAndPersist = (newRecords: AttendanceRecord[]) => {
    setRecords(newRecords);
    const updatedStudents = recalculateStudentPoints(students, newRecords);
    setStudents(updatedStudents);
    localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(newRecords));
    localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(newRecords));
    localStorage.setItem('dkm_attendance_records', JSON.stringify(newRecords));
    localStorage.setItem('dkm_students_data_v3', JSON.stringify(updatedStudents));
    localStorage.setItem('dkm_students_data_v2', JSON.stringify(updatedStudents));
    localStorage.setItem('dkm_students_data', JSON.stringify(updatedStudents));
    return updatedStudents;
  };

  // 1. Delete a single attendance record and automatically recalculate points
  const handleDeleteRecord = (id: string) => {
    const targetRecord = records.find(r => r.id === id);
    const cleanRecords = records.filter(r => r.id !== id);
    syncAndPersist(cleanRecords);
    if (targetRecord) {
      // Visual notification/alert
      console.log(`Presensi ${targetRecord.studentName} (${targetRecord.prayerType}) dihapus. Poin dikalkulasi ulang.`);
    }
  };

  // 2. Delete multiple attendance records at once (bulk delete)
  const handleDeleteMultipleRecords = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);
    const cleanRecords = records.filter(r => !idsSet.has(r.id));
    syncAndPersist(cleanRecords);
  };

  // 3. Reset / zero out points for specific records without deleting the row
  const handleZeroPointsForRecords = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);
    const modifiedRecords = records.map(r => {
      if (idsSet.has(r.id)) {
        return {
          ...r,
          pointsWudhu: 0,
          pointsSholatWajib: 0,
          pointsSholatSunah: 0,
          pointsSunnahQobliyah: 0,
          pointsSunnahBadiyah: 0,
          bonusAdab: 0,
          totalPoints: 0,
          notes: (r.notes ? r.notes + ' • ' : '') + 'Poin dinolkan manual'
        };
      }
      return r;
    });
    syncAndPersist(modifiedRecords);
  };

  // 3b. Update / Edit attendance details & points
  const handleUpdateAttendanceRecord = (updatedRecord: AttendanceRecord) => {
    const updatedRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    syncAndPersist(updatedRecords);
    if (webhookUrl) {
      syncRecordToGoogleSheet(updatedRecord, webhookUrl);
    }
  };

  // 4. Clear all attendance records & zero all points
  const handleClearAllAttendanceRecords = () => {
    syncAndPersist([]);
  };

  // 5. Reset points & clear attendance records for a specific student
  const handleResetStudentPoints = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const cleanRecords = records.filter(r => r.studentId !== student.id && r.rfidCardUid !== student.rfidCardUid);
    syncAndPersist(cleanRecords);
  };

  // 6. Reset all students' points to 0
  const handleResetAllStudentPoints = () => {
    syncAndPersist([]);
  };

  const handleSimulateTapFromStudentList = (uid: string) => {
    setIsKioskOpen(true);
    // Let the kiosk open, then the user can tap or view
  };

  const handleClearTodayAndFutureRecords = () => {
    const todayStr = getTodayDateLocal();
    const todayUtc = new Date().toISOString().slice(0, 10);
    const cleanRecords = records.filter(r => r.date < todayStr && r.date < todayUtc && !isDateIn18To21SeptRange(r.date));
    syncAndPersist(cleanRecords);
  };

  // Explicit handler to delete all records & calculations from 18/9 s.d. 21/9
  const handleDeleteRecords18To21Sept = () => {
    const countToDelete = records.filter(r => isDateIn18To21SeptRange(r.date)).length;
    const cleanRecords = filterOutRecords18To21Sept(records);
    syncAndPersist(cleanRecords);
  };

  // Explicit handler to delete any custom date range
  const handleDeleteDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;
    const countToDelete = records.filter(r => r.date >= startDate && r.date <= endDate).length;
    const cleanRecords = records.filter(r => !(r.date >= startDate && r.date <= endDate));
    syncAndPersist(cleanRecords);
  };

  const handleResetToPdfData = () => {
    if (confirm('Kembalikan master santri dan kehadiran ke data resmi 58 santri dari dokumen PDF? (Data hari ini dan berikutnya tetap kosong karena kegiatan belum terlaksana)')) {
      const cleanRecords = generateInitialAttendanceRecords();
      const cleanStudents = recalculateStudentPoints(INITIAL_STUDENTS, cleanRecords);
      setStudents(cleanStudents);
      setRecords(cleanRecords);
      localStorage.setItem('dkm_students_data_v3', JSON.stringify(cleanStudents));
      localStorage.setItem('dkm_students_data_v2', JSON.stringify(cleanStudents));
      localStorage.setItem('dkm_students_data', JSON.stringify(cleanStudents));
      localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(cleanRecords));
      localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(cleanRecords));
      localStorage.setItem('dkm_attendance_records', JSON.stringify(cleanRecords));
    }
  };

  const totalPointsOverall = useMemo(() => {
    return records.reduce((acc, r) => acc + r.totalPoints, 0);
  }, [records]);

  // Handle Manual & Instant Synchronization of Attendance, Points, and 3 Reports (Daily, Weekly, Monthly)
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const result = await executeSyncAttendanceAndPoints(
        records,
        students,
        webhookUrl
      );

      setRecords(result.updatedRecords);
      setStudents(result.updatedStudents);
      setLastSyncTime(result.timestamp);
      setSyncResult(result);
      setIsSyncModalOpen(true);

      // Persist harmonized & recalculated data to local storage
      localStorage.setItem('dkm_attendance_records_v3', JSON.stringify(result.updatedRecords));
      localStorage.setItem('dkm_attendance_records_v2', JSON.stringify(result.updatedRecords));
      localStorage.setItem('dkm_attendance_records', JSON.stringify(result.updatedRecords));
      localStorage.setItem('dkm_students_data_v3', JSON.stringify(result.updatedStudents));
      localStorage.setItem('dkm_students_data_v2', JSON.stringify(result.updatedStudents));
      localStorage.setItem('dkm_students_data', JSON.stringify(result.updatedStudents));
      localStorage.setItem('dkm_last_sync_timestamp', result.timestamp.toISOString());
    } catch (err) {
      console.error('Data synchronization failed:', err);
      alert('Gagal melakukan sinkronisasi data absensi. Silakan coba kembali.');
    } finally {
      setIsSyncing(false);
    }
  };

  // If dedicated standalone Kiosk URL is active (?mode=kiosk, #kiosk, /kiosk), render kiosk directly
  if (isStandaloneKiosk) {
    return (
      <RfidKioskModal
        isOpen={true}
        isStandalone={true}
        onClose={() => {
          navigateToDashboard();
          setIsStandaloneKiosk(false);
        }}
        students={students}
        schedule={schedule}
        records={records}
        onSaveAttendance={handleSaveAttendance}
      />
    );
  }

  // If dedicated standalone Public Live Journal URL is active (?view=jurnal-publik, #jurnal-publik), render public journal directly
  if (isPublicJournal) {
    return (
      <JurnalPublikLiveView
        students={students}
        records={records}
        onNavigateToDashboard={() => {
          navigateToDashboard();
          setIsPublicJournal(false);
        }}
      />
    );
  }

  // If dedicated standalone Daily Ranking URL is active (?view=peringkat-harian, #peringkat-harian), render daily ranking directly
  if (isDailyRanking) {
    return (
      <PeringkatHarianPublikView
        students={students}
        records={records}
        onNavigateToDashboard={() => {
          navigateToDashboard();
          setIsDailyRanking(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      {/* 1. Google Sheets Style Header */}
      <GoogleSheetsHeader
        documentTitle={documentTitle}
        onUpdateTitle={setDocumentTitle}
        onOpenKiosk={() => setIsKioskOpen(true)}
        onOpenKioskLinkModal={() => setIsKioskLinkModalOpen(true)}
        onExportCSV={() => exportAttendanceToCSV(records)}
        onOpenIntegrationModal={() => setActiveTab('apps_script')}
        onOpenAddManual={() => setIsManualModalOpen(true)}
        onRefreshPrayerTimes={loadKemenagPrayerTimes}
        isLoadingPrayer={isLoadingPrayer}
        activePrayerName={activePrayerInfo.activePrayer}
        nextPrayerCountdown={countdownText}
        onSyncAllData={handleSyncData}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onOpenPublicJournal={() => navigateToPublicJournal()}
        onOpenDailyRanking={() => navigateToDailyRanking(true)}
      />

      {/* 2. Google Sheets Toolbar & Formula Bar */}
      <GoogleSheetsToolbar
        schedule={schedule}
        activePrayer={activePrayerInfo.activePrayer}
        selectedCellCoordinate={selectedCellCoordinate}
        formulaContent={formulaContent}
        onFormulaChange={setFormulaContent}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterPrayer={filterPrayer}
        onFilterPrayerChange={setFilterPrayer}
      />

      {/* 3. Main Work Area (Switchable Sheets) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'absensi' && (
          <AbsensiSpreadsheetView
            records={records}
            onSelectCell={handleSelectCell}
            selectedCoordinate={selectedCellCoordinate}
            onDeleteRecord={handleDeleteRecord}
            onDeleteMultipleRecords={handleDeleteMultipleRecords}
            onZeroPointsMultiple={handleZeroPointsForRecords}
            onClearAllRecords={handleClearAllAttendanceRecords}
            filterPrayer={filterPrayer}
            searchQuery={searchQuery}
            onClearTodayAndFuture={handleClearTodayAndFutureRecords}
            onDeleteRecords18To21Sept={handleDeleteRecords18To21Sept}
            onDeleteDateRange={handleDeleteDateRange}
            onSyncData={handleSyncData}
            isSyncing={isSyncing}
            onUpdateRecord={handleUpdateAttendanceRecord}
          />
        )}

        {activeTab === 'jadwal_dki' && (
          <JadwalSholatKemenagView
            currentSchedule={schedule}
            onRefresh={loadKemenagPrayerTimes}
            isLoading={isLoadingPrayer}
          />
        )}

        {activeTab === 'laporan_harian' && (
          <LaporanHarianView
            records={records}
            students={students}
            onSyncData={handleSyncData}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
          />
        )}

        {activeTab === 'laporan_mingguan' && (
          <LaporanMingguanView
            records={records}
            students={students}
            onSyncData={handleSyncData}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
          />
        )}

        {activeTab === 'laporan_bulanan' && (
          <LaporanBulananView
            records={records}
            students={students}
            onSyncData={handleSyncData}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
          />
        )}

        {activeTab === 'master_santri' && (
          <MasterSantriView
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onSimulateTap={handleSimulateTapFromStudentList}
            onResetToPdfData={handleResetToPdfData}
            onResetStudentPoints={handleResetStudentPoints}
            onResetAllStudentPoints={handleResetAllStudentPoints}
            onSyncData={handleSyncData}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'apps_script' && (
          <GoogleSheetsIntegrationView
            webhookUrl={webhookUrl}
            onSaveWebhookUrl={setWebhookUrl}
            latestRecord={records[0]}
            onExportCSV={() => exportAttendanceToCSV(records)}
          />
        )}
      </main>

      {/* 4. Google Sheets Bottom Tabs Bar */}
      <SheetsTabsBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        attendanceCount={records.length}
        studentsCount={students.length}
        totalPointsOverall={totalPointsOverall}
        onSyncData={handleSyncData}
        isSyncing={isSyncing}
      />

      {/* 5. Fullscreen RFID Mosque Attendance Kiosk */}
      {isKioskOpen && (
        <RfidKioskModal
          isOpen={isKioskOpen}
          onClose={() => setIsKioskOpen(false)}
          students={students}
          schedule={schedule}
          records={records}
          onSaveAttendance={handleSaveAttendance}
        />
      )}

      {/* 6. Manual Attendance Entry Modal */}
      {isManualModalOpen && (
        <AddAttendanceManualModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          students={students}
          schedule={schedule}
          onSave={handleSaveAttendance}
        />
      )}

      {/* 7. Dedicated Kiosk URL & Sharing Modal */}
      {isKioskLinkModalOpen && (
        <KioskLinkModal
          isOpen={isKioskLinkModalOpen}
          onClose={() => setIsKioskLinkModalOpen(false)}
          onOpenLocalKiosk={() => setIsKioskOpen(true)}
        />
      )}

      {/* 8. Sync Status & Harmonization Report Modal */}
      {isSyncModalOpen && (
        <SyncStatusModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          syncResult={syncResult}
          onNavigateTab={setActiveTab}
        />
      )}
    </div>
  );
}
