import { PrayerSchedule, PrayerType, KioskWindowInfo, KioskSessionPhase } from '../types';

// Default / standard DKI Jakarta prayer times for fallback
const DEFAULT_DKI_SCHEDULE: Record<number, PrayerSchedule> = {
  // Typical times for Jakarta across months
  1: { tanggal: '2026-01-15', imsak: '04:15', subuh: '04:25', terbit: '05:45', dhuha: '06:12', dzuhur: '12:04', ashar: '15:28', maghrib: '18:18', isya: '19:32', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  2: { tanggal: '2026-02-15', imsak: '04:25', subuh: '04:35', terbit: '05:51', dhuha: '06:17', dzuhur: '12:09', ashar: '15:23', maghrib: '18:20', isya: '19:31', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  3: { tanggal: '2026-03-15', imsak: '04:26', subuh: '04:36', terbit: '05:49', dhuha: '06:14', dzuhur: '12:03', ashar: '15:10', maghrib: '18:10', isya: '19:18', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  4: { tanggal: '2026-04-15', imsak: '04:21', subuh: '04:31', terbit: '05:46', dhuha: '06:11', dzuhur: '11:53', ashar: '15:12', maghrib: '17:56', isya: '19:06', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  5: { tanggal: '2026-05-15', imsak: '04:20', subuh: '04:30', terbit: '05:47', dhuha: '06:13', dzuhur: '11:49', ashar: '15:11', maghrib: '17:49', isya: '19:02', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  6: { tanggal: '2026-06-15', imsak: '04:24', subuh: '04:34', terbit: '05:53', dhuha: '06:19', dzuhur: '11:53', ashar: '15:15', maghrib: '17:51', isya: '19:06', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  7: { tanggal: '2026-07-15', imsak: '04:30', subuh: '04:40', terbit: '05:59', dhuha: '06:24', dzuhur: '11:58', ashar: '15:20', maghrib: '17:56', isya: '19:09', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  8: { tanggal: '2026-08-15', imsak: '04:29', subuh: '04:39', terbit: '05:56', dhuha: '06:21', dzuhur: '11:58', ashar: '15:18', maghrib: '17:56', isya: '19:07', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  9: { tanggal: '2026-09-21', imsak: '04:19', subuh: '04:29', terbit: '05:44', dhuha: '06:08', dzuhur: '11:48', ashar: '14:58', maghrib: '17:53', isya: '19:01', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta (Kemenag)' },
  10: { tanggal: '2026-10-15', imsak: '04:06', subuh: '04:16', terbit: '05:32', dhuha: '05:56', dzuhur: '11:41', ashar: '14:48', maghrib: '17:49', isya: '18:59', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  11: { tanggal: '2026-11-15', imsak: '03:59', subuh: '04:09', terbit: '05:28', dhuha: '05:53', dzuhur: '11:42', ashar: '15:00', maghrib: '17:54', isya: '19:06', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
  12: { tanggal: '2026-12-15', imsak: '04:05', subuh: '04:15', terbit: '05:36', dhuha: '06:02', dzuhur: '11:53', ashar: '15:18', maghrib: '18:07', isya: '19:21', lokasi: 'DKI Jakarta', daerah: 'Prov. DKI Jakarta' },
};

export async function fetchKemenagPrayerTimes(date: Date = new Date()): Promise<PrayerSchedule> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // 1. Try myQuran API (Kemenag Bimas Islam DKI Jakarta ID: 1301)
  try {
    const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${year}/${month}/${day}`, {
      cache: 'force-cache'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.status && data?.data?.jadwal) {
        const j = data.data.jadwal;
        return {
          tanggal: j.date || formattedDate,
          imsak: j.imsak || '04:19',
          subuh: j.subuh || '04:29',
          terbit: j.terbit || '05:44',
          dhuha: j.dhuha || '06:08',
          dzuhur: j.dzuhur || '11:48',
          ashar: j.ashar || '14:58',
          maghrib: j.maghrib || '17:53',
          isya: j.isya || '19:01',
          lokasi: 'DKI Jakarta',
          daerah: 'Kemenag RI (Bimas Islam Jakarta)'
        };
      }
    }
  } catch (err) {
    console.warn('myQuran API offline/unreachable, trying Aladhan fallback...', err);
  }

  // 2. Try Aladhan API as secondary live source for Jakarta
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=20`, {
      cache: 'force-cache'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.code === 200 && data?.data?.timings) {
        const t = data.data.timings;
        return {
          tanggal: formattedDate,
          imsak: t.Imsak?.slice(0, 5) || '04:19',
          subuh: t.Fajr?.slice(0, 5) || '04:29',
          terbit: t.Sunrise?.slice(0, 5) || '05:44',
          dhuha: '06:08',
          dzuhur: t.Dhuhr?.slice(0, 5) || '11:48',
          ashar: t.Asr?.slice(0, 5) || '14:58',
          maghrib: t.Maghrib?.slice(0, 5) || '17:53',
          isya: t.Isha?.slice(0, 5) || '19:01',
          lokasi: 'DKI Jakarta',
          daerah: 'Kemenag RI Method'
        };
      }
    }
  } catch (err) {
    console.warn('Aladhan API unreachable, using calibrated DKI Jakarta Kemenag table', err);
  }

  // 3. Calibrated fallback table for DKI Jakarta
  const fallback = DEFAULT_DKI_SCHEDULE[month] || DEFAULT_DKI_SCHEDULE[9];
  return {
    ...fallback,
    tanggal: formattedDate,
  };
}

/**
 * Determine which prayer is closest or currently active based on current time
 */
export function getCurrentActivePrayer(schedule: PrayerSchedule, now: Date = new Date()): {
  activePrayer: PrayerType;
  nextPrayer: PrayerType;
  nextPrayerTime: string;
  minutesToNext: number;
  isPrayerWindowActive: boolean; // e.g., within 20 mins before to 45 mins after adzan
} {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const subuhM = parseMins(schedule.subuh);
  const dzuhurM = parseMins(schedule.dzuhur);
  const asharM = parseMins(schedule.ashar);
  const maghribM = parseMins(schedule.maghrib);
  const isyaM = parseMins(schedule.isya);

  // Prayer windows (approximate):
  // Subuh: subuhM - 20 to subuhM + 90
  // Dzuhur: dzuhurM - 20 to asharM
  // Ashar: asharM - 20 to maghribM
  // Maghrib: maghribM - 20 to isyaM
  // Isya: isyaM - 20 to 23:59 or subuh

  if (currentMinutes < dzuhurM - 30) {
    // Subuh period
    const diff = subuhM - currentMinutes;
    return {
      activePrayer: 'Subuh',
      nextPrayer: currentMinutes < subuhM ? 'Subuh' : 'Dzuhur',
      nextPrayerTime: currentMinutes < subuhM ? schedule.subuh : schedule.dzuhur,
      minutesToNext: currentMinutes < subuhM ? diff : (dzuhurM - currentMinutes),
      isPrayerWindowActive: Math.abs(currentMinutes - subuhM) <= 45
    };
  } else if (currentMinutes < asharM - 30) {
    // Dzuhur period
    const diff = dzuhurM - currentMinutes;
    return {
      activePrayer: 'Dzuhur',
      nextPrayer: currentMinutes < dzuhurM ? 'Dzuhur' : 'Ashar',
      nextPrayerTime: currentMinutes < dzuhurM ? schedule.dzuhur : schedule.ashar,
      minutesToNext: currentMinutes < dzuhurM ? diff : (asharM - currentMinutes),
      isPrayerWindowActive: Math.abs(currentMinutes - dzuhurM) <= 45
    };
  } else if (currentMinutes < maghribM - 30) {
    // Ashar period
    const diff = asharM - currentMinutes;
    return {
      activePrayer: 'Ashar',
      nextPrayer: currentMinutes < asharM ? 'Ashar' : 'Maghrib',
      nextPrayerTime: currentMinutes < asharM ? schedule.ashar : schedule.maghrib,
      minutesToNext: currentMinutes < asharM ? diff : (maghribM - currentMinutes),
      isPrayerWindowActive: Math.abs(currentMinutes - asharM) <= 45
    };
  } else if (currentMinutes < isyaM - 30) {
    // Maghrib period
    const diff = maghribM - currentMinutes;
    return {
      activePrayer: 'Maghrib',
      nextPrayer: currentMinutes < maghribM ? 'Maghrib' : 'Isya',
      nextPrayerTime: currentMinutes < maghribM ? schedule.maghrib : schedule.isya,
      minutesToNext: currentMinutes < maghribM ? diff : (isyaM - currentMinutes),
      isPrayerWindowActive: Math.abs(currentMinutes - maghribM) <= 40
    };
  } else {
    // Isya period
    const diff = isyaM - currentMinutes;
    return {
      activePrayer: 'Isya',
      nextPrayer: currentMinutes < isyaM ? 'Isya' : 'Subuh',
      nextPrayerTime: currentMinutes < isyaM ? schedule.isya : schedule.subuh,
      minutesToNext: currentMinutes < isyaM ? diff : (24 * 60 - currentMinutes + subuhM),
      isPrayerWindowActive: Math.abs(currentMinutes - isyaM) <= 60
    };
  }
}

/**
 * Aturan Buka-Tutup Kiosk RFID Adzan Sholat (Diperbarui):
 * 1. Sesi 1 (Waktu Masuk Adzan):
 *    - Kiosk RFID DIBUKA setelah adzan selama 15 menit (khusus sholat Subuh selama 18 menit).
 *    - Poin yang terhitung: HANYA poin Sholat Sunnah Qobliyah dan Wudhu.
 * 2. Jeda Sholat Fardu (Kiosk Tertutup selama 10 Menit):
 *    - Kiosk DITUTUP selama 10 menit saat pelaksanaan sholat fardu berjamaah di masjid agar santri khusyuk sholat.
 * 3. Sesi 2 (Pasca Sholat Fardu, Dzikir & Ba'diyah selama 10 Menit):
 *    - Kiosk DIBUKA KEMBALI selama 10 menit.
 *    - Poin yang terhitung: Poin Wudhu (bagi santri yg belum), Sholat Wajib, Doa dan Dzikir, serta Sholat Sunnah Ba'diyah (jika ada).
 * 
 * Pengecualian: Sholat Dhuhur di Hari Jumat mengikuti aturan khusus Sholat Jumat (Sesi 1: -15m s.d. +15m adzan khusus laki-laki, Jeda 10m, Sesi 2: 45m untuk laki-laki & perempuan).
 */
export function getKioskAdzanWindow(schedule: PrayerSchedule, now: Date = new Date()): KioskWindowInfo {
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const parseToSeconds = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60;
  };

  const prayers: { type: PrayerType; timeStr: string; sec: number }[] = [
    { type: 'Subuh', timeStr: schedule.subuh, sec: parseToSeconds(schedule.subuh) },
    { type: 'Dzuhur', timeStr: schedule.dzuhur, sec: parseToSeconds(schedule.dzuhur) },
    { type: 'Ashar', timeStr: schedule.ashar, sec: parseToSeconds(schedule.ashar) },
    { type: 'Maghrib', timeStr: schedule.maghrib, sec: parseToSeconds(schedule.maghrib) },
    { type: 'Isya', timeStr: schedule.isya, sec: parseToSeconds(schedule.isya) },
  ];

  // Helper to format remaining mm:ss
  const formatRemain = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.max(0, secs) % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const isFriday = now.getDay() === 5;

  // Check each prayer window
  for (const prayer of prayers) {
    const adzanSec = prayer.sec;
    const diffSec = currentSeconds - adzanSec; // negatif jika sebelum adzan, positif jika setelah adzan

    // ATURAN KHUSUS SHOLAT DHUHUR DI HARI JUMAT:
    // Sesi 1 (Santri Laki-laki): Dibuka 15 menit sebelum adzan s.d. 15 menit setelah adzan (-900s s.d. +900s)
    // Jeda Khutbah & Sholat: Ditutup 10 menit (+900s s.d. +1500s)
    // Sesi 2 (Laki-laki & Perempuan): Dibuka 45 menit (+1500s s.d. +4200s)
    if (prayer.type === 'Dzuhur' && isFriday) {
      // Sesi 1 Jumat (-15 menit s.d. +15 menit adzan)
      if (diffSec >= -900 && diffSec < 900) {
        const remaining = 900 - diffSec;
        return {
          phase: 'SESI_1_QOBLIYAH_WUDHU',
          isOpen: true,
          activePrayer: 'Dzuhur',
          prayerAdzanTime: prayer.timeStr,
          isFridayDzuhur: true,
          isFridayDzuhurSesi1BoysOnly: true,
          targetGender: 'L',
          phaseLabel: 'Sesi 1 Sholat Jumat: Wudhu & Sunnah (Khusus Santri Laki-Laki)',
          phaseDescription: 'Gerbang Kiosk dibuka 15 menit sebelum adzan s.d. 15 menit setelah adzan khusus santri ikhwan (laki-laki) untuk mencari poin Wudhu dan Sholat Sunah (Qobliyah/Tahiyyatul Masjid).',
          allowedItems: {
            wudhu: true,
            sunnahQobliyah: true,
            sholatWajib: false,
            sunnahBadiyah: false,
            dzikirDoa: false,
          },
          countdownSeconds: remaining,
          timeRemainingLabel: `Ditutup saat Khutbah & Sholat Jumat dalam ${formatRemain(remaining)}`
        };
      }

      // Jeda Sholat Jumat: Ditutup 10 menit (+15m s.d. +25m setelah adzan)
      if (diffSec >= 900 && diffSec < 1500) {
        const remaining = 1500 - diffSec;
        return {
          phase: 'JEDA_SHOLAT_DITUTUP',
          isOpen: false,
          activePrayer: 'Dzuhur',
          prayerAdzanTime: prayer.timeStr,
          isFridayDzuhur: true,
          phaseLabel: 'Kiosk Ditutup: Khutbah & Sholat Jumat Berjamaah',
          phaseDescription: 'Kiosk RFID ditutup selama 10 menit saat imam & jamaah melaksanakan ibadah Sholat Jumat berjamaah di masjid.',
          allowedItems: {
            wudhu: false,
            sunnahQobliyah: false,
            sholatWajib: false,
            sunnahBadiyah: false,
            dzikirDoa: false,
          },
          countdownSeconds: remaining,
          timeRemainingLabel: `Dibuka kembali untuk Sesi 2 dalam ${formatRemain(remaining)} (Durasi 45 Menit)`
        };
      }

      // Sesi 2 Jumat (+25m s.d. +70m setelah adzan, durasi 45 menit)
      if (diffSec >= 1500 && diffSec < 4200) {
        const remaining = 4200 - diffSec;
        return {
          phase: 'SESI_2_FARDU_DZIKIR',
          isOpen: true,
          activePrayer: 'Dzuhur',
          prayerAdzanTime: prayer.timeStr,
          isFridayDzuhur: true,
          targetGender: 'ALL',
          phaseLabel: "Sesi 2 Ba'da Sholat Jumat: Santri Laki-Laki & Perempuan (45 Menit)",
          phaseDescription: "Kiosk dibuka 45 menit. Berlaku untuk santri laki-laki (wudhu bagi yg belum, Sholat Jumat, Ba'diyah & Dzikir) dan santri perempuan (otomatis seluruh paket poin: Wudhu, Qobliyah, Dhuhur & Ba'diyah).",
          allowedItems: {
            wudhu: true,
            sunnahQobliyah: true,
            sholatWajib: true,
            sunnahBadiyah: true,
            dzikirDoa: true,
          },
          countdownSeconds: remaining,
          timeRemainingLabel: `Sesi 2 Jumat ditutup dalam ${formatRemain(remaining)}`
        };
      }
      continue;
    }

    // ATURAN UMUM PENILAIAN SHOLAT (KECUALI SHOLAT DHUHUR SAAT HARI JUMAT):
    // 1. Setelah adzan kiosk dibuka selama 15 menit untuk mencari poin sholat sunah qobliyah dan wudhu (khusus sholat Subuh selama 18 menit).
    // 2. Setelah itu kiosk ditutup selama 10 menit (pelaksanaan sholat fardu berjamaah).
    // 3. Kemudian dibuka lagi selama 10 menit untuk mencari poin wudhu bagi santri yg belum, sholat wajib, doa dan dzikir, dan sholat sunah badiyah kalau ada.
    const isSubuh = prayer.type === 'Subuh';
    const sesi1DurationSec = isSubuh ? 18 * 60 : 15 * 60; // 18 menit Subuh (1080s), 15 menit sholat lainnya (900s)
    const jedaDurationSec = 10 * 60;                      // 10 menit ditutup (600s)
    const sesi2DurationSec = 10 * 60;                     // 10 menit dibuka lagi (600s)

    const jedaEndSec = sesi1DurationSec + jedaDurationSec; // Subuh: 28m (1680s), Lainnya: 25m (1500s)
    const sesi2EndSec = jedaEndSec + sesi2DurationSec;     // Subuh: 38m (2280s), Lainnya: 35m (2100s)
    const sesi1Minutes = isSubuh ? 18 : 15;

    // Sesi 1: Waktu masuk adzan (0s s.d. sesi1DurationSec)
    if (diffSec >= 0 && diffSec < sesi1DurationSec) {
      const remaining = sesi1DurationSec - diffSec;
      return {
        phase: 'SESI_1_QOBLIYAH_WUDHU',
        isOpen: true,
        activePrayer: prayer.type,
        prayerAdzanTime: prayer.timeStr,
        phaseLabel: `Sesi 1: Masuk Adzan & Qobliyah Sholat ${prayer.type} (${sesi1Minutes} Menit)`,
        phaseDescription: `Kiosk Terbuka saat masuk adzan selama ${sesi1Minutes} menit. Khusus mencari Poin Sholat Sunnah Qobliyah dan Wudhu.`,
        allowedItems: {
          wudhu: true,
          sunnahQobliyah: true,
          sholatWajib: false,
          sunnahBadiyah: false,
          dzikirDoa: false,
        },
        countdownSeconds: remaining,
        timeRemainingLabel: `Ditutup dalam ${formatRemain(remaining)} (Saat Sholat Fardu Berjamaah)`
      };
    }

    // Jeda Sholat Fardu: Ditutup selama 10 menit saat sholat fardu berlangsung
    if (diffSec >= sesi1DurationSec && diffSec < jedaEndSec) {
      const remaining = jedaEndSec - diffSec;
      return {
        phase: 'JEDA_SHOLAT_DITUTUP',
        isOpen: false,
        activePrayer: prayer.type,
        prayerAdzanTime: prayer.timeStr,
        phaseLabel: `Kiosk Tertutup: Sedang Berlangsung Sholat Fardu ${prayer.type} Berjamaah`,
        phaseDescription: `Kiosk RFID ditutup selama 10 menit saat imam & jamaah melaksanakan sholat fardu berjamaah di masjid.`,
        allowedItems: {
          wudhu: false,
          sunnahQobliyah: false,
          sholatWajib: false,
          sunnahBadiyah: false,
          dzikirDoa: false,
        },
        countdownSeconds: remaining,
        timeRemainingLabel: `Dibuka kembali dalam ${formatRemain(remaining)} (Sesi 2 Ba'da Sholat Fardu)`
      };
    }

    // Sesi 2: Terbuka lagi selama 10 menit
    if (diffSec >= jedaEndSec && diffSec < sesi2EndSec) {
      const remaining = sesi2EndSec - diffSec;
      const hasBadiyah = prayer.type !== 'Subuh' && prayer.type !== 'Ashar';
      return {
        phase: 'SESI_2_FARDU_DZIKIR',
        isOpen: true,
        activePrayer: prayer.type,
        prayerAdzanTime: prayer.timeStr,
        phaseLabel: `Sesi 2: Ba'da Sholat Fardu & Dzikir ${prayer.type} (10 Menit)`,
        phaseDescription: `Kiosk Terbuka kembali selama 10 menit. Mencari Poin Wudhu (bagi yang belum), Sholat Wajib, Doa & Dzikir, serta Sholat Sunnah Ba'diyah${hasBadiyah ? '' : ' (tidak ada ba\'diyah)'}.`,
        allowedItems: {
          wudhu: true, // mencari poin wudhu bagi santri yg belum
          sunnahQobliyah: false,
          sholatWajib: true,
          sunnahBadiyah: hasBadiyah,
          dzikirDoa: true,
        },
        countdownSeconds: remaining,
        timeRemainingLabel: `Sesi 2 ditutup dalam ${formatRemain(remaining)}`
      };
    }
  }

  // Jika di luar jendela aktif (sebelum waktu adzan atau setelah sesi berakhir), tentukan sholat terdekat berikutnya
  const activePrayerInfo = getCurrentActivePrayer(schedule, now);
  const nextP = prayers.find(p => p.type === activePrayerInfo.nextPrayer) || prayers[0];
  let secToOpen = nextP.sec - currentSeconds;
  if (secToOpen < 0) {
    secToOpen += 24 * 3600; // jika besok subuh
  }
  const nextSesi1Duration = nextP.type === 'Subuh' ? '18' : '15';

  return {
    phase: 'DILUAR_JADWAL',
    isOpen: false,
    activePrayer: activePrayerInfo.activePrayer,
    prayerAdzanTime: nextP.timeStr,
    phaseLabel: `Kiosk Siaga (Menunggu Waktu Masuk Adzan ${nextP.type})`,
    phaseDescription: `Kiosk RFID akan otomatis terbuka tepat saat waktu masuk adzan tiba (${nextP.timeStr} WIB) selama ${nextSesi1Duration} menit untuk mencari Poin Sholat Sunnah Qobliyah & Wudhu.`,
    allowedItems: {
      wudhu: true,
      sunnahQobliyah: true,
      sholatWajib: true,
      sunnahBadiyah: true,
      dzikirDoa: true,
    },
    countdownSeconds: secToOpen,
    timeRemainingLabel: `Kiosk dibuka tepat saat adzan ${formatRemain(secToOpen)} lagi (Pukul ${nextP.timeStr} WIB)`
  };
}

function formatTimeMinusMinutes(timeStr: string, minusMins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  let totalM = h * 60 + m - minusMins;
  if (totalM < 0) totalM += 24 * 60;
  const newH = Math.floor(totalM / 60);
  const newM = totalM % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

