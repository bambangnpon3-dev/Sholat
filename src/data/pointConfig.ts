import { 
  PointConfig, 
  PrayerType, 
  WudhuQuality, 
  SholatWajibQuality, 
  SholatSunahQuality, 
  SunnahQobliyahQuality, 
  SunnahBadiyahQuality 
} from '../types';

export const POINT_CONFIG: PointConfig = {
  wudhu: {
    sempurna: { label: 'Wudhu Tertib & Sempurna Sesuai Sunnah', points: 5 },
    mandiri: { label: 'Wudhu Mandiri & Basuhan Rata', points: 5 },
    bimbingan: { label: 'Wudhu dengan Bimbingan Ustadz', points: 5 },
    tidak: { label: 'Tidak / Belum Wudhu di Masjid', points: 0 },
  },
  sholatWajib: {
    subuh: {
      jamaah_shaf1: { label: 'Wajib Subuh Berjamaah (Shaf Pertama)', points: 20 },
      jamaah_belakang: { label: 'Wajib Subuh Berjamaah (Shaf Belakang)', points: 20 },
      masbuq: { label: 'Wajib Subuh Masbuq', points: 20 },
      munfarid: { label: 'Wajib Subuh Munfarid', points: 20 },
      tidak: { label: 'Tidak Sholat Wajib Subuh', points: 0 },
    },
    selainSubuh: {
      jamaah_shaf1: { label: 'Wajib Berjamaah (Shaf Pertama)', points: 10 },
      jamaah_belakang: { label: 'Wajib Berjamaah (Shaf Belakang)', points: 10 },
      masbuq: { label: 'Wajib Masbuq', points: 10 },
      munfarid: { label: 'Wajib Munfarid', points: 10 },
      tidak: { label: 'Tidak Sholat Wajib', points: 0 },
    },
  },
  sholatSunah: {
    sebelumSubuh: {
      rawatib: { label: 'Sunnah Qobliyah Subuh (2 Rakaat Fajar)', points: 10 },
      tahiyyatul_masjid: { label: 'Sunnah Tahiyyatul Masjid', points: 10 },
      dhuha_tarawih: { label: 'Sunnah Qiyamul Lail / Witir', points: 10 },
      tidak: { label: 'Tidak Sholat Sunnah Sebelum Subuh', points: 0 },
    },
    selainSubuh: {
      rawatib: { label: "Sunnah Rawatib Qobliyah / Ba'diyah", points: 5 },
      tahiyyatul_masjid: { label: 'Sunnah Tahiyyatul Masjid', points: 5 },
      dhuha_tarawih: { label: 'Sunnah Dhuha / Tarawih', points: 5 },
      tidak: { label: 'Tidak Sholat Sunnah', points: 0 },
    },
  },
  qobliyah: {
    subuh: { label: 'Sunnah Qobliyah Subuh (2 Rakaat Fajar)', points: 10 },
    selainSubuh: { label: 'Sunnah Qobliyah Rawatib / Tahiyyatul', points: 5 },
  },
  badiyah: {
    selainSubuh: { label: "Sunnah Ba'diyah Rawatib", points: 5 },
    subuh: { label: "Tidak Ada Ba'diyah Subuh", points: 0 },
  },
  doaDzikir: {
    label: "Dzikir dan Doa Ba'da Sholat",
    points: 5,
  },
};

/**
 * Aturan Poin Absensi Sholat:
 * 1. Poin wudhu: 5
 * 2. Poin sholat wajib: 10, kecuali sholat subuh 20
 * 3. Poin sholat sunah qobliyah: 5, kecuali subuh (sebelum subuh) 10
 * 4. Poin sholat sunah ba'diyah: 5 (kecuali subuh dan ashar yang tidak disunnahkan ba'diyah = 0)
 * 5. Bonus adab dirubah menjadi Dzikir dan Doa: 5
 */
export function calculatePoints(
  prayerType: PrayerType,
  wudhu: WudhuQuality,
  sholatWajib: SholatWajibQuality,
  sholatSunah?: SholatSunahQuality,
  dzikirDoaActive: boolean = true,
  qobliyah?: SunnahQobliyahQuality | string,
  badiyah?: SunnahBadiyahQuality | string,
  allowedItems?: {
    wudhu?: boolean;
    sunnahQobliyah?: boolean;
    sholatWajib?: boolean;
    sunnahBadiyah?: boolean;
    dzikirDoa?: boolean;
  }
): {
  pointsWudhu: number;
  pointsSunnahQobliyah: number;
  pointsSholatWajib: number;
  pointsSunnahBadiyah: number;
  pointsSholatSunah: number;
  bonusAdab: number; // Dzikir dan Doa (5 poin)
  totalPoints: number;
} {
  const isSubuh = prayerType === 'Subuh';

  // Poin wudhu: 5 (0 jika tidak atau tidak dihitung di sesi ini)
  const canWudhu = allowedItems?.wudhu !== false;
  const pWudhu = (!canWudhu || wudhu === 'tidak') ? 0 : 5;
  
  // Poin sholat wajib: 10, kecuali sholat subuh 20 (0 jika tidak atau tidak dihitung di sesi ini)
  const canWajib = allowedItems?.sholatWajib !== false;
  const pWajib = (!canWajib || sholatWajib === 'tidak') ? 0 : (isSubuh ? 20 : 10);

  // Qobliyah:
  // Subuh: 10 poin jika qobliyah / tahiyyatul
  // Selain subuh: 5 poin jika qobliyah / tahiyyatul
  const canQobliyah = allowedItems?.sunnahQobliyah !== false;
  let pQobliyah = 0;
  if (canQobliyah) {
    if (qobliyah !== undefined) {
      if (qobliyah !== 'tidak') {
        pQobliyah = isSubuh ? 10 : 5;
      }
    } else {
      // Default derive from sholatSunah if not explicitly given
      if (sholatSunah && sholatSunah !== 'tidak') {
        pQobliyah = isSubuh ? 10 : 5;
      }
    }
  }

  // Ba'diyah:
  // Subuh & Ashar: tidak disyariatkan ba'diyah (0 poin)
  // Dzuhur, Maghrib, Isya: 5 poin jika ba'diyah
  const canBadiyah = allowedItems?.sunnahBadiyah !== false;
  let pBadiyah = 0;
  if (canBadiyah && prayerType !== 'Subuh' && prayerType !== 'Ashar') {
    if (badiyah !== undefined) {
      if (badiyah !== 'tidak') {
        pBadiyah = 5;
      }
    } else {
      // Default: 5 jika ba'diyah aktif
      pBadiyah = 5;
    }
  }

  // Aggregate total sunnah points
  const pSunah = pQobliyah + pBadiyah;

  // Bonus adab dirubah menjadi Dzikir dan Doa: 5 (0 jika tidak dihitung di sesi ini)
  const canDzikir = allowedItems?.dzikirDoa !== false;
  const pDzikirDoa = (canDzikir && dzikirDoaActive) ? 5 : 0;

  return {
    pointsWudhu: pWudhu,
    pointsSunnahQobliyah: pQobliyah,
    pointsSholatWajib: pWajib,
    pointsSunnahBadiyah: pBadiyah,
    pointsSholatSunah: pSunah,
    bonusAdab: pDzikirDoa, // Dzikir dan Doa: 5 poin
    totalPoints: pWudhu + pQobliyah + pWajib + pBadiyah + pDzikirDoa,
  };
}
