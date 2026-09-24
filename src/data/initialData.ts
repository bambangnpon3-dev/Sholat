import { Student, AttendanceRecord, PrayerType } from '../types';

export const MASJID_OPTIONS = [
  'Masjid Baitul Faqih',
  'Masjid Alkautsar',
  'Masjid Baitul Karim'
] as const;

export const INITIAL_STUDENTS: Student[] = [
  // === MASJID BAITUL FAQIH (27 Santri) ===
  {
    id: 's-001',
    rfidCardUid: '0964561466',
    name: 'AFNA',
    nickname: 'Afna',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Aminah',
    parentPhone: '0812-8101-0001',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AFNA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-002',
    rfidCardUid: '2847547777',
    name: 'CERELIA',
    nickname: 'Cerelia',
    gender: 'P',
    age: 11,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Ratna',
    parentPhone: '0812-8101-0002',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CERELIA&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-003',
    rfidCardUid: '1652263850',
    name: 'HAFIDZAH',
    nickname: 'Hafidzah',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Khadijah',
    parentPhone: '0812-8101-0003',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HAFIDZAH&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-004',
    rfidCardUid: '1652601098',
    name: 'SHEZA',
    nickname: 'Sheza',
    gender: 'P',
    age: 9,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Nurbaiti',
    parentPhone: '0812-8101-0004',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SHEZA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-005',
    rfidCardUid: '3546830335',
    name: 'SYAKIRA',
    nickname: 'Syakira',
    gender: 'P',
    age: 8,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Fatimah',
    parentPhone: '0812-8101-0005',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SYAKIRA&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-006',
    rfidCardUid: '2852696817',
    name: 'ZAYYANA',
    nickname: 'Zayyana',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Wardah',
    parentPhone: '0812-8101-0006',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZAYYANA&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-007',
    rfidCardUid: '1341742874',
    name: 'FATKAH',
    nickname: 'Fatkah',
    gender: 'P',
    age: 9,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Maryam',
    parentPhone: '0812-8101-0007',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FATKAH&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-008',
    rfidCardUid: '2847596161',
    name: 'SAFIA',
    nickname: 'Safia',
    gender: 'P',
    age: 11,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Hasanah',
    parentPhone: '0812-8101-0008',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SAFIA&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-009',
    rfidCardUid: '1653190730',
    name: 'FADIA',
    nickname: 'Fadia',
    gender: 'P',
    age: 12,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Ibu Laila',
    parentPhone: '0812-8101-0009',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FADIA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-010',
    rfidCardUid: '1652238778',
    name: 'ABIZAR',
    nickname: 'Abizar',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Ridwan',
    parentPhone: '0812-8101-0010',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ABIZAR&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-011',
    rfidCardUid: '2850026065',
    name: 'AMZAR',
    nickname: 'Amzar',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Gunawan',
    parentPhone: '0812-8101-0011',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AMZAR&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-012',
    rfidCardUid: '2849659121',
    name: 'HAFISZ',
    nickname: 'Hafisz',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Hendra',
    parentPhone: '0812-8101-0012',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HAFISZ&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-013',
    rfidCardUid: '2845259601',
    name: 'HAMIZAN',
    nickname: 'Hamizan',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Yusuf',
    parentPhone: '0812-8101-0013',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HAMIZAN&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-014',
    rfidCardUid: '2848583969',
    name: 'RAFIF',
    nickname: 'Rafif',
    gender: 'L',
    age: 8,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Arif',
    parentPhone: '0812-8101-0014',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RAFIF&backgroundColor=ffdfbf',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-015',
    rfidCardUid: '3546151759',
    name: 'UWAIS',
    nickname: 'Uwais',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Fauzi',
    parentPhone: '0812-8101-0015',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=UWAIS&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-016',
    rfidCardUid: '1340961706',
    name: 'QAISAR',
    nickname: 'Qaisar',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Lukman',
    parentPhone: '0812-8101-0016',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=QAISAR&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-017',
    rfidCardUid: '0965223514',
    name: 'ARSENO',
    nickname: 'Arseno',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Bambang',
    parentPhone: '0812-8101-0017',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ARSENO&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-018',
    rfidCardUid: '2845704849',
    name: 'EVANO',
    nickname: 'Evano',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Surya',
    parentPhone: '0812-8101-0018',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=EVANO&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-019',
    rfidCardUid: '1654743642',
    name: 'FATIH',
    nickname: 'Fatih',
    gender: 'L',
    age: 12,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Fathurrahman',
    parentPhone: '0812-8101-0019',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FATIH&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-020',
    rfidCardUid: '1653149562',
    name: 'AMMAR',
    nickname: 'Ammar',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Irfan',
    parentPhone: '0812-8101-0020',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AMMAR&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-021',
    rfidCardUid: '0965107498',
    name: 'FAEZYA',
    nickname: 'Faezya',
    gender: 'L',
    age: 8,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Syarif',
    parentPhone: '0812-8101-0021',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FAEZYA&backgroundColor=ffdfbf',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-022',
    rfidCardUid: '2846869233',
    name: 'FAIRUZ',
    nickname: 'Fairuz',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Wahyu',
    parentPhone: '0812-8101-0022',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FAIRUZ&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-023',
    rfidCardUid: '1653177322',
    name: 'FASZIRUL',
    nickname: 'Faszirul',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Zulkifli',
    parentPhone: '0812-8101-0023',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FASZIRUL&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-024',
    rfidCardUid: '3733880258',
    name: 'FIRMAN',
    nickname: 'Firman',
    gender: 'L',
    age: 12,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Suherman',
    parentPhone: '0812-8101-0024',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FIRMAN&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-025',
    rfidCardUid: '1653894026',
    name: 'ARSYAD',
    nickname: 'Arsyad',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Dani',
    parentPhone: '0812-8101-0025',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ARSYAD&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-026',
    rfidCardUid: '1653864058',
    name: 'IRSYAD',
    nickname: 'Irsyad',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Dani',
    parentPhone: '0812-8101-0026',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=IRSYAD&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-027',
    rfidCardUid: '2842431009',
    name: 'EID',
    nickname: 'Eid',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Faqih',
    parentName: 'Bpk. Idris',
    parentPhone: '0812-8101-0027',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=EID&backgroundColor=ffdfbf',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },

  // === MASJID ALKAUTSAR (17 Santri) ===
  {
    id: 's-028',
    rfidCardUid: '2849999105',
    name: 'MAHAR',
    nickname: 'Mahar',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Mahardi',
    parentPhone: '0813-8202-0028',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MAHAR&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-029',
    rfidCardUid: '2847766625',
    name: 'MUHAR',
    nickname: 'Muhar',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Muharam',
    parentPhone: '0813-8202-0029',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MUHAR&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-030',
    rfidCardUid: '2849617713',
    name: 'HAZIQ',
    nickname: 'Haziq',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Hazairin',
    parentPhone: '0813-8202-0030',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HAZIQ&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-031',
    rfidCardUid: '1653719258',
    name: 'HILMAN',
    nickname: 'Hilman',
    gender: 'L',
    age: 12,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Hilman Wijaya',
    parentPhone: '0813-8202-0031',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HILMAN&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-032',
    rfidCardUid: '2842784337',
    name: 'OZA',
    nickname: 'Oza',
    gender: 'L',
    age: 8,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Fauzan',
    parentPhone: '0813-8202-0032',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=OZA&backgroundColor=ffdfbf',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-033',
    rfidCardUid: '2846190497',
    name: 'RAFKA',
    nickname: 'Rafka',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Rasyid',
    parentPhone: '0813-8202-0033',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RAFKA&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-034',
    rfidCardUid: '1653086986',
    name: 'HIRSON',
    nickname: 'Hirson',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Haris',
    parentPhone: '0813-8202-0034',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HIRSON&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-035',
    rfidCardUid: '1652767706',
    name: 'ZEYN',
    nickname: 'Zeyn',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Zainuddin',
    parentPhone: '0813-8202-0035',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZEYN&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-036',
    rfidCardUid: '2850018497',
    name: 'KHAIZURAN',
    nickname: 'Khaizuran',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Khairul',
    parentPhone: '0813-8202-0036',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KHAIZURAN&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-037',
    rfidCardUid: '2848968673',
    name: 'ATTAH',
    nickname: 'Attah',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Attaya',
    parentPhone: '0813-8202-0037',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ATTAH&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-038',
    rfidCardUid: '1653659674',
    name: 'KAYYIS',
    nickname: 'Kayyis',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Bpk. Kamaruddin',
    parentPhone: '0813-8202-0038',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KAYYIS&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-039',
    rfidCardUid: '2845382369',
    name: 'MUYA',
    nickname: 'Muya',
    gender: 'P',
    age: 8,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Ibu Mulyati',
    parentPhone: '0813-8202-0039',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MUYA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-040',
    rfidCardUid: '2846053585',
    name: 'NAILA',
    nickname: 'Naila',
    gender: 'P',
    age: 11,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Ibu Nabila',
    parentPhone: '0813-8202-0040',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NAILA&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-041',
    rfidCardUid: '2849878929',
    name: 'ZIYA',
    nickname: 'Ziya',
    gender: 'P',
    age: 9,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Ibu Zubaidah',
    parentPhone: '0813-8202-0041',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZIYA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-042',
    rfidCardUid: '3489175202',
    name: 'ZUYYINA',
    nickname: 'Zuyyina',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Ibu Rahma',
    parentPhone: '0813-8202-0042',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZUYYINA&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-043',
    rfidCardUid: '2848421633',
    name: 'ADEL',
    nickname: 'Adel',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Ibu Adelia',
    parentPhone: '0813-8202-0043',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ADEL&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-044',
    rfidCardUid: '2847159953',
    name: 'ADIBA',
    nickname: 'Adiba',
    gender: 'P',
    age: 9,
    halaqah: 'Masjid Alkautsar',
    parentName: 'Ibu Adibah',
    parentPhone: '0813-8202-0044',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ADIBA&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },

  // === MASJID BAITUL KARIM (14 Santri) ===
  {
    id: 's-045',
    rfidCardUid: '2847536417',
    name: 'AIMAN',
    nickname: 'Aiman',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Aiman Syarif',
    parentPhone: '0857-8303-0045',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AIMAN&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-046',
    rfidCardUid: '2849763249',
    name: 'HANIF',
    nickname: 'Hanif',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Abu Hanif',
    parentPhone: '0857-8303-0046',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HANIF&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-047',
    rfidCardUid: '1652821338',
    name: 'MAZAYA',
    nickname: 'Mazaya',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Maya',
    parentPhone: '0857-8303-0047',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MAZAYA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-048',
    rfidCardUid: '2846630721',
    name: 'RAIN',
    nickname: 'Rain',
    gender: 'L',
    age: 9,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Rayhan',
    parentPhone: '0857-8303-0048',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RAIN&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-049',
    rfidCardUid: '2846539697',
    name: 'KALILA',
    nickname: 'Kalila',
    gender: 'P',
    age: 8,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Kartika',
    parentPhone: '0857-8303-0049',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KALILA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-050',
    rfidCardUid: '2845013473',
    name: 'ADIEVA',
    nickname: 'Adieva',
    gender: 'P',
    age: 11,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Dian',
    parentPhone: '0857-8303-0050',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ADIEVA&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-051',
    rfidCardUid: '1652808378',
    name: 'SABILA',
    nickname: 'Sabila',
    gender: 'P',
    age: 10,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Salma',
    parentPhone: '0857-8303-0051',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SABILA&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-052',
    rfidCardUid: '2849690481',
    name: 'ZICO',
    nickname: 'Zico',
    gender: 'L',
    age: 12,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Zakaria',
    parentPhone: '0857-8303-0052',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZICO&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-053',
    rfidCardUid: '1653199434',
    name: 'FICO',
    nickname: 'Fico',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Firdaus',
    parentPhone: '0857-8303-0053',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FICO&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-054',
    rfidCardUid: '2850071745',
    name: 'AROFAH',
    nickname: 'Arofah',
    gender: 'P',
    age: 11,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Aisyah',
    parentPhone: '0857-8303-0054',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AROFAH&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-055',
    rfidCardUid: '0965784906',
    name: 'HANUM',
    nickname: 'Hanum',
    gender: 'P',
    age: 9,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Halimah',
    parentPhone: '0857-8303-0055',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HANUM&backgroundColor=d1d4f9',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-056',
    rfidCardUid: '2845256065',
    name: 'ALIFA',
    nickname: 'Alifa',
    gender: 'P',
    age: 8,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Ibu Alawiyah',
    parentPhone: '0857-8303-0056',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ALIFA&backgroundColor=ffd5dc',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-057',
    rfidCardUid: '0965795802',
    name: 'KEITA',
    nickname: 'Keita',
    gender: 'L',
    age: 10,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Kemal',
    parentPhone: '0857-8303-0057',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KEITA&backgroundColor=b6e3f4',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  },
  {
    id: 's-058',
    rfidCardUid: '2845169009',
    name: 'ALVIAN',
    nickname: 'Alvian',
    gender: 'L',
    age: 11,
    halaqah: 'Masjid Baitul Karim',
    parentName: 'Bpk. Alamsyah',
    parentPhone: '0857-8303-0058',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ALVIAN&backgroundColor=c0aede',
    totalPoints: 0,
    totalAttendances: 0,
    streakDays: 0,
    starBadge: 'Bintang Perunggu'
  }
];

// Helper to get local date in YYYY-MM-DD format
export function getTodayDateLocal(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Memeriksa apakah tanggal berada pada atau setelah 14 September 2026 (periode kegiatan sholat yang dihapus semua)
 */
export function isDateFrom14SeptOnwards(dateStr: string): boolean {
  if (!dateStr) return false;
  const trimmed = dateStr.trim();

  // Format Standar YYYY-MM-DD
  if (trimmed >= '2026-09-14') return true;

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (year > 2026) return true;
    if (year === 2026 && month > 9) return true;
    if (year === 2026 && month === 9 && day >= 14) return true;
  }

  if (/2026-09-(1[4-9]|2[0-9]|3[0-1])/.test(trimmed)) return true;

  return false;
}

/**
 * Backward compatibility alias untuk isDateIn18To21SeptRange
 */
export function isDateIn18To21SeptRange(dateStr: string): boolean {
  return isDateFrom14SeptOnwards(dateStr);
}

/**
 * Filter data absensi untuk menghapus seluruh data pada rentang tanggal 14 September sampai sekarang
 */
export function filterOutRecordsFrom14Sept(records: AttendanceRecord[]): AttendanceRecord[] {
  return records.filter(r => !isDateFrom14SeptOnwards(r.date));
}

export function filterOutRecords18To21Sept(records: AttendanceRecord[]): AttendanceRecord[] {
  return filterOutRecordsFrom14Sept(records);
}

// Helper to recalculate student totalPoints, attendances, and streaks accurately from valid records
// Aturan: Apabila santri beberapa kali taping kartu di sesi yang sama tetap dihitung 1 kali dan tidak double poin.
export function recalculateStudentPoints(students: Student[], records: AttendanceRecord[]): Student[] {
  // Pastikan data records bersih dari tanggal 14 September sampai sekarang
  const cleanRecords = filterOutRecordsFrom14Sept(records);

  return students.map(s => {
    const sRecords = cleanRecords.filter(r => r.studentId === s.id || r.rfidCardUid === s.rfidCardUid);

    // Kelompokkan per sesi sholat (tanggal + waktu sholat) agar taping berulang kali di sesi yang sama
    // tetap dihitung 1 kali dan tidak double poin
    const sessionMap = new Map<string, AttendanceRecord>();
    sRecords.forEach(r => {
      const key = `${r.date}_${r.prayerType}`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, r);
      } else {
        const existing = sessionMap.get(key)!;
        // Konsolidasi nilai per komponen (bukan dijumlahkan ganda/double)
        const pointsWudhu = Math.max(existing.pointsWudhu || 0, r.pointsWudhu || 0);
        const pointsSunnahQobliyah = Math.max(existing.pointsSunnahQobliyah || 0, r.pointsSunnahQobliyah || 0);
        const pointsSholatWajib = Math.max(existing.pointsSholatWajib || 0, r.pointsSholatWajib || 0);
        const pointsSunnahBadiyah = Math.max(existing.pointsSunnahBadiyah || 0, r.pointsSunnahBadiyah || 0);
        const bonusAdab = Math.max(existing.bonusAdab || 0, r.bonusAdab || 0);
        const consolidatedTotal = pointsWudhu + pointsSunnahQobliyah + pointsSholatWajib + pointsSunnahBadiyah + bonusAdab;

        sessionMap.set(key, {
          ...existing,
          pointsWudhu,
          pointsSunnahQobliyah,
          pointsSholatWajib,
          pointsSunnahBadiyah,
          bonusAdab,
          totalPoints: consolidatedTotal
        });
      }
    });

    const uniqueSessions = Array.from(sessionMap.values());
    const totalPts = uniqueSessions.reduce((acc, r) => acc + r.totalPoints, 0);
    const totalAtt = uniqueSessions.length; // Tetap dihitung 1 kali
    const distinctDates = Array.from(new Set(uniqueSessions.map(r => r.date)));
    const streak = distinctDates.length;
    let badge: Student['starBadge'] = 'Bintang Perunggu';
    if (totalPts >= 300) badge = 'Santri Teladan';
    else if (totalPts >= 200) badge = 'Bintang Emas';
    else if (totalPts >= 100) badge = 'Bintang Perak';

    return {
      ...s,
      totalPoints: totalPts,
      totalAttendances: totalAtt,
      streakDays: streak,
      starBadge: badge
    };
  });
}

// Helper to generate starter attendance records
// PERHATIAN:
// Seluruh point & kegiatan sholat dari tanggal 14 September 2026 sampai sekarang telah dihapus semua.
// Sehingga initial attendance records kosong (semua santri memiliki poin default 0).
export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  return [];
}
