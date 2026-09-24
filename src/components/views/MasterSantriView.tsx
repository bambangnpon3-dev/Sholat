import React, { useState } from 'react';
import { 
  CreditCard, 
  UserPlus, 
  Search, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Edit,
  Trash2,
  X,
  RotateCcw,
  Printer,
  FileText,
  Award,
  LayoutGrid,
  List,
  Building2,
  Power,
  PowerOff,
  AlertTriangle,
  ShieldCheck,
  Check,
  RefreshCw,
  User,
  Phone,
  Wand2
} from 'lucide-react';
import { Student, MosqueSetting } from '../../types';
import { exportStudentsToCSV } from '../../services/googleSheetsService';

interface Props {
  students: Student[];
  onAddStudent: (newStudent: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onSimulateTap: (uid: string) => void;
  onResetToPdfData?: () => void;
  onResetStudentPoints?: (studentId: string) => void;
  onResetAllStudentPoints?: () => void;
  onSyncData?: () => void;
  isSyncing?: boolean;
}

export const MasterSantriView: React.FC<Props> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSimulateTap,
  onResetToPdfData,
  onResetStudentPoints,
  onResetAllStudentPoints,
  onSyncData,
  isSyncing,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMasjid, setSelectedMasjid] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isPrintPdfOpen, setIsPrintPdfOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mosque Settings persistence
  const [mosques, setMosques] = useState<MosqueSetting[]>(() => {
    const saved = localStorage.getItem('dkm_mosque_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'm-1', name: 'Masjid Baitul Faqih', location: 'Kompleks Pesantren Pusat', isActive: true },
      { id: 'm-2', name: 'Masjid Alkautsar', location: 'Kompleks Pesantren Timur', isActive: true },
      { id: 'm-3', name: 'Masjid Baitul Karim', location: 'Kompleks Pesantren Barat', isActive: true }
    ];
  });

  // New Student Form State
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formUid, setFormUid] = useState('');
  const [formHalaqah, setFormHalaqah] = useState('Masjid Baitul Faqih');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formAge, setFormAge] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Edit Student Form State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editUid, setEditUid] = useState('');
  const [editHalaqah, setEditHalaqah] = useState('');
  const [editGender, setEditGender] = useState<'L' | 'P'>('L');
  const [editAge, setEditAge] = useState<string>('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editReason, setEditReason] = useState('');

  // Open Edit Modal
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditNickname(student.nickname || student.name.split(' ')[0]);
    setEditUid(student.rfidCardUid);
    setEditHalaqah(student.halaqah);
    setEditGender(student.gender);
    setEditAge(student.age !== undefined && student.age !== null ? String(student.age) : '');
    setEditParentName(student.parentName || '');
    setEditParentPhone(student.parentPhone || '');
    setEditAvatar(student.avatar || '');
    setEditIsActive(student.isActive !== false);
    setEditReason(student.inactivationReason || '');
  };

  // Helper to re-generate / randomize avatar matching student name & gender
  const handleRegenerateAvatar = (targetGender?: 'L' | 'P') => {
    const gen = targetGender || editGender;
    const nameSeed = editName.trim() || (gen === 'L' ? 'Ikhwan' : 'Akhwat');
    const bg = gen === 'L' ? 'b6e3f4' : 'ffd5dc';
    const randomSuffix = Math.floor(Math.random() * 1000);
    const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nameSeed)}_${randomSuffix}&backgroundColor=${bg}`;
    setEditAvatar(newAvatar);
  };

  // Switch gender and auto-adjust avatar background color if using default DiceBear avatar
  const handleSwitchEditGender = (newGender: 'L' | 'P') => {
    setEditGender(newGender);
    if (editAvatar.includes('dicebear.com')) {
      const bg = newGender === 'L' ? 'b6e3f4' : 'ffd5dc';
      const cleanSeed = encodeURIComponent(editName.trim() || (newGender === 'L' ? 'Ikhwan' : 'Akhwat'));
      setEditAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanSeed}&backgroundColor=${bg}`);
    }
  };

  // Helper to generate a fresh 10-digit RFID UID (e.g. replacing a lost card)
  const handleGenerateRandomRfid = () => {
    const randomUid = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setEditUid(randomUid);
  };

  const handleGenerateFormRandomRfid = () => {
    const randomUid = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setFormUid(randomUid);
  };

  // Handle Edit Submit
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const cleanName = editName.trim();
    const cleanUid = editUid.trim();

    if (!cleanName || !cleanUid) {
      alert('Nama lengkap santri dan No Kartu RFID (UID) wajib diisi!');
      return;
    }

    // Check if the new RFID UID is already taken by ANOTHER student
    const duplicate = students.find(s => s.id !== editingStudent.id && s.rfidCardUid.trim() === cleanUid);
    if (duplicate) {
      alert(`Peringatan: No Kartu RFID "${cleanUid}" sudah digunakan oleh santri "${duplicate.name}" (${duplicate.halaqah}).\n\nSetiap santri wajib memiliki No Kartu RFID yang unik. Silakan gunakan kartu RFID lain.`);
      return;
    }

    // Ensure avatar is set and matches current gender
    let finalAvatar = editAvatar.trim();
    if (!finalAvatar) {
      const bg = editGender === 'L' ? 'b6e3f4' : 'ffd5dc';
      finalAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=${bg}`;
    }

    const parsedAge = editAge.trim() !== '' ? parseInt(editAge, 10) : undefined;

    const updated: Student = {
      ...editingStudent,
      name: cleanName,
      nickname: editNickname.trim() || cleanName.split(' ')[0],
      rfidCardUid: cleanUid,
      halaqah: editHalaqah,
      namaMasjid: editHalaqah,
      gender: editGender,
      age: !isNaN(Number(parsedAge)) && parsedAge !== undefined ? parsedAge : undefined,
      parentName: editParentName.trim() || undefined,
      parentPhone: editParentPhone.trim() || undefined,
      avatar: finalAvatar,
      isActive: editIsActive,
      inactivationReason: !editIsActive ? editReason.trim() || 'Izin / Sakit' : undefined
    };

    onUpdateStudent(updated);
    setEditingStudent(null);
    if (onSyncData) onSyncData();
    setToastMessage(`✓ Data santri "${updated.name}" (${updated.gender === 'L' ? 'Santri Ikhwan' : 'Santri Akhwat'}, Usia: ${updated.age ? `${updated.age} thn` : '-'}, Wali: ${updated.parentName || '-'}, RFID: ${updated.rfidCardUid}) berhasil diperbarui dan disimpan!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Mosque Active / Inactive
  const handleToggleMosqueStatus = (mosqueName: string) => {
    const target = mosques.find(m => m.name === mosqueName);
    const nextStatus = !(target?.isActive ?? true);
    const nextMosques = mosques.map(m => m.name === mosqueName ? { ...m, isActive: nextStatus } : m);
    setMosques(nextMosques);
    localStorage.setItem('dkm_mosque_settings', JSON.stringify(nextMosques));

    // Offer to also toggle all students of this mosque
    if (confirm(`Kegiatan di ${mosqueName} sekarang ${nextStatus ? 'DIAKTIFKAN (BUKA)' : 'DINONAKTIFKAN (LIBUR)'}.\n\nApakah Anda juga ingin me-${nextStatus ? 'ngaktifkan' : 'nonaktifkan'} seluruh santri yang berhalaqah di masjid ini?`)) {
      students.forEach(s => {
        if (s.halaqah === mosqueName) {
          onUpdateStudent({
            ...s,
            isActive: nextStatus,
            inactivationReason: nextStatus ? undefined : `Kegiatan di ${mosqueName} Libur / Non-Aktif`
          });
        }
      });
    }

    if (onSyncData) onSyncData();
    setToastMessage(`Status kegiatan ${mosqueName} diubah menjadi ${nextStatus ? 'AKTIF' : 'NON-AKTIF / LIBUR'}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Individual Student Active / Inactive
  const handleToggleStudentStatus = (student: Student) => {
    const nextStatus = student.isActive === false;
    let reason: string | undefined = undefined;
    if (!nextStatus) {
      const input = prompt(`Alasan menonaktifkan santri ${student.name} (contoh: Sakit, Izin Pulang, Cuti)?`, 'Izin / Sakit');
      if (input === null) return;
      reason = input.trim() || 'Izin / Sakit';
    }
    const updated: Student = {
      ...student,
      isActive: nextStatus,
      inactivationReason: reason
    };
    onUpdateStudent(updated);
    if (onSyncData) onSyncData();
    setToastMessage(`Santri ${student.name} sekarang ${nextStatus ? 'AKTIF' : 'NON-AKTIF'}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mosque count helpers
  const countBaitulFaqih = students.filter(s => s.halaqah === 'Masjid Baitul Faqih').length;
  const countAlkautsar = students.filter(s => s.halaqah === 'Masjid Alkautsar').length;
  const countBaitulKarim = students.filter(s => s.halaqah === 'Masjid Baitul Karim').length;

  const filtered = students.filter(s => {
    const matchesMasjid = selectedMasjid === 'ALL' || s.halaqah === selectedMasjid;
    if (!matchesMasjid) return false;

    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
      s.rfidCardUid.includes(q) ||
      s.halaqah.toLowerCase().includes(q);
  });

  // Urutan santri berdasarkan peringkat poin terbanyak terlebih dahulu untuk cetak PDF A4
  const sortedByPointsDesc = [...students].sort((a, b) => b.totalPoints - a.totalPoints);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUid.trim()) {
      alert('Nama santri dan No Kartu RFID wajib diisi!');
      return;
    }

    const newStudent: Student = {
      id: `s-${Date.now().toString().slice(-4)}`,
      rfidCardUid: formUid.trim(),
      name: formName.trim(),
      nickname: formNickname.trim() || formName.trim().split(' ')[0],
      gender: formGender,
      halaqah: formHalaqah,
      isActive: formIsActive,
      avatar: formGender === 'L' 
        ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      totalPoints: 0,
      totalAttendances: 0,
      streakDays: 0,
      starBadge: 'Bintang Perunggu'
    };

    onAddStudent(newStudent);
    setIsAddModalOpen(false);
    // Reset form
    setFormName('');
    setFormNickname('');
    setFormUid('');
    setFormIsActive(true);
    if (onSyncData) onSyncData();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-6 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Master Santri & Kartu RFID Masjid
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen data santri, penugasan UID kartu RFID, edit & hapus data santri, serta cetak peringkat PDF A4.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintPdfOpen(true)}
            title="Cetak format PDF ukuran kertas A4 tersusun dari peringkat poin terbanyak"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak PDF A4 Peringkat Poin
          </button>

          {onResetToPdfData && (
            <button
              onClick={onResetToPdfData}
              title="Kembalikan master data ke 58 santri resmi dari file PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset ke Data PDF (58)
            </button>
          )}

          {onResetAllStudentPoints && (
            <button
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin me-reset SELURUH poin 58 santri ke 0 dan menghapus seluruh catatan absensi?')) {
                  onResetAllStudentPoints();
                }
              }}
              title="Reset seluruh poin dan absensi seluruh santri ke 0"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-400 rounded-md text-xs font-semibold text-rose-700 shadow-2xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Reset Poin Semua (0)
            </button>
          )}

          <button
            onClick={() => exportStudentsToCSV(students)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Santri CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" /> + Tambah Santri & Kartu
          </button>
        </div>
      </div>

      {/* KONTROL STATUS KEGIATAN MASJID & DKM */}
      <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Kontrol Status Kegiatan Masjid & DKM:
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Aktifkan / nonaktifkan kegiatan masjid. Santri di masjid yang dinonaktifkan tidak dapat tap di kiosk.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
          {mosques.map(m => {
            const mCount = students.filter(s => s.halaqah === m.name).length;
            const mActiveCount = students.filter(s => s.halaqah === m.name && s.isActive !== false).length;
            const isMosqueActive = m.isActive !== false;

            return (
              <div 
                key={m.id}
                className={`p-2.5 rounded-lg border transition flex flex-col justify-between ${
                  isMosqueActive 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      <span>🕌</span>
                      <span>{m.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {mActiveCount} dari {mCount} santri aktif
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${
                    isMosqueActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-rose-600 text-white'
                  }`}>
                    {isMosqueActive ? 'AKTIF' : 'LIBUR'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleMosqueStatus(m.name)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      isMosqueActive 
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isMosqueActive ? (
                      <>
                        <PowerOff className="w-3 h-3" />
                        <span>Liburkan Kegiatan</span>
                      </>
                    ) : (
                      <>
                        <Power className="w-3 h-3" />
                        <span>Aktifkan Kegiatan</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allActive = mActiveCount === mCount;
                      const next = !allActive;
                      students.forEach(s => {
                        if (s.halaqah === m.name) {
                          onUpdateStudent({
                            ...s,
                            isActive: next,
                            inactivationReason: next ? undefined : `Kegiatan di ${m.name} Libur`
                          });
                        }
                      });
                      if (onSyncData) onSyncData();
                      setToastMessage(`Seluruh santri di ${m.name} telah di-${next ? 'aktifkan' : 'nonaktifkan'}!`);
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="text-[10px] text-slate-600 hover:text-slate-900 hover:underline font-semibold cursor-pointer"
                    title="Aktifkan atau nonaktifkan seluruh santri di masjid ini sekaligus"
                  >
                    {mActiveCount === mCount ? 'Nonaktifkan Santri' : 'Aktifkan Semua Santri'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mosque Filter Tabs & Search Bar */}
      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedMasjid('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMasjid === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Masjid ({students.length})
          </button>

          <button
            onClick={() => setSelectedMasjid('Masjid Baitul Faqih')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedMasjid === 'Masjid Baitul Faqih'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Masjid Baitul Faqih</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
              selectedMasjid === 'Masjid Baitul Faqih' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {countBaitulFaqih}
            </span>
          </button>

          <button
            onClick={() => setSelectedMasjid('Masjid Alkautsar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedMasjid === 'Masjid Alkautsar'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Masjid Alkautsar</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
              selectedMasjid === 'Masjid Alkautsar' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {countAlkautsar}
            </span>
          </button>

          <button
            onClick={() => setSelectedMasjid('Masjid Baitul Karim')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedMasjid === 'Masjid Baitul Karim'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Masjid Baitul Karim</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
              selectedMasjid === 'Masjid Baitul Karim' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {countBaitulKarim}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama santri, UID, masjid..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu / Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Data RFID"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student View: Cards Grid or Data Table */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">No</th>
                  <th className="px-3 py-2.5">Nama Santri</th>
                  <th className="px-3 py-2.5 text-center font-mono">No RFID UID</th>
                  <th className="px-3 py-2.5">Masjid / Halaqah</th>
                  <th className="px-2 py-2.5 text-center w-12">Gender</th>
                  <th className="px-2 py-2.5 text-center w-24">Status</th>
                  <th className="px-3 py-2.5 text-center">Total Sholat</th>
                  <th className="px-3 py-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">Total Poin</th>
                  <th className="px-3 py-2.5 text-center">Predikat</th>
                  <th className="px-3 py-2.5 text-center w-28">Aksi Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          {student.nickname && (
                            <div className="text-[10px] text-slate-400">Panggilan: {student.nickname}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <span className="font-mono font-black text-slate-800 text-[11px]">{student.rfidCardUid}</span>
                        <button
                          onClick={() => onSimulateTap(student.rfidCardUid)}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer underline"
                          title="Uji tap di kiosk"
                        >
                          Uji
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-medium">
                      <span>🕌 {student.halaqah}</span>
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        student.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {student.gender === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleStudentStatus(student)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                          student.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                        }`}
                        title={student.isActive !== false ? 'Klik untuk non-aktifkan santri ini' : `Non-aktif (${student.inactivationReason || 'Izin'}). Klik untuk aktifkan kembali.`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${student.isActive !== false ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <span>{student.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-700">
                      {student.totalAttendances}x
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/40 text-sm">
                      {student.totalPoints.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {student.starBadge}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                          title={`Edit data santri ${student.name}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onResetStudentPoints && (
                          <button
                            onClick={() => {
                              if (confirm(`Reset poin santri ${student.name} ke 0 dan hapus seluruh riwayat absensinya?`)) {
                                onResetStudentPoints(student.id);
                              }
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                            title="Reset poin ke 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Hapus santri ${student.name}? Semua riwayat absensi santri ini juga akan dihapus.`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Hapus data santri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Student Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {filtered.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{student.name}</h3>
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <span>🕌</span>
                      <span>{student.halaqah}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{student.gender === 'L' ? 'Santri Ikhwan' : 'Santri Akhwat'}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {student.starBadge}
                  </span>

                  <button
                    onClick={() => handleToggleStudentStatus(student)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      student.isActive !== false
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                    }`}
                    title={student.isActive !== false ? 'Klik untuk non-aktifkan santri ini' : `Non-aktif (${student.inactivationReason || 'Izin'}). Klik untuk aktifkan kembali.`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${student.isActive !== false ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    <span>{student.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span>
                  </button>
                </div>
              </div>

              {/* RFID Card Section */}
              <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    No Kartu RFID (UID)
                  </div>
                  <div className="font-mono text-xs font-black text-slate-800 tracking-wider">
                    💳 {student.rfidCardUid}
                  </div>
                </div>
                <button
                  onClick={() => onSimulateTap(student.rfidCardUid)}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded transition cursor-pointer"
                  title="Simulasikan tap kartu santri ini di kiosk presensi"
                >
                  Uji Tap
                </button>
              </div>
            </div>

            {/* Bottom Stats & Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-700 font-mono">{student.totalPoints.toLocaleString()} Poin</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono">{student.totalAttendances}x Sholat</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditModal(student)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                  title={`Edit data santri ${student.name}`}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                {onResetStudentPoints && (
                  <button
                    onClick={() => {
                      if (confirm(`Reset poin santri ${student.name} ke 0 dan hapus seluruh riwayat absensinya?`)) {
                        onResetStudentPoints(student.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                    title="Reset poin santri ini ke 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Hapus santri ${student.name}? Semua riwayat absensi santri ini juga akan dihapus.`)) {
                      onDeleteStudent(student.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                  title="Hapus santri"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal Edit Student */}
      {editingStudent && (() => {
        const duplicateRfidStudent = students.find(
          s => s.id !== editingStudent.id && editUid.trim() !== '' && s.rfidCardUid.trim() === editUid.trim()
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-linear-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Edit className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                      Edit Master Data Santri & RFID
                    </h3>
                    <p className="text-[11px] text-indigo-200/90 font-medium">
                      ID: {editingStudent.id} • {editingStudent.totalPoints} Poin • {editingStudent.totalAttendances}x Presensi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer text-indigo-100 hover:text-white"
                  title="Tutup Form Edit"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <form onSubmit={handleUpdateSubmit} className="p-5 sm:p-6 space-y-4.5 overflow-y-auto flex-1">
                {/* 1. Avatar & Live Visual Summary */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={editAvatar || editingStudent.avatar}
                      alt={editName || editingStudent.name}
                      className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-sm ${
                        editGender === 'L' ? 'border-sky-400 bg-sky-50' : 'border-pink-400 bg-pink-50'
                      }`}
                    />
                    <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shadow-xs ${
                      editGender === 'L' ? 'bg-sky-600 text-white' : 'bg-pink-600 text-white'
                    }`}>
                      {editGender === 'L' ? 'Ikhwan' : 'Akhwat'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-slate-900 text-sm truncate">
                      {editName || 'Nama Santri'}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{editUid || 'RFID: Belum diisi'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      🕌 {editHalaqah}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRegenerateAvatar()}
                    className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    title="Buat ulang avatar acak sesuai gender dan nama santri"
                  >
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px]">Ganti Avatar</span>
                  </button>
                </div>

                {/* 2. Jenis Kelamin (Gender) - Highlighted Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Jenis Kelamin (Gender) *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSwitchEditGender('L')}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        editGender === 'L'
                          ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/20 ring-2 ring-sky-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">👦</span>
                      <span>Laki-laki (Ikhwan)</span>
                      {editGender === 'L' && <Check className="w-4 h-4 text-white ml-auto" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchEditGender('P')}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        editGender === 'P'
                          ? 'bg-pink-500 text-white border-pink-600 shadow-md shadow-pink-500/20 ring-2 ring-pink-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">🧕</span>
                      <span>Perempuan (Akhwat)</span>
                      {editGender === 'P' && <Check className="w-4 h-4 text-white ml-auto" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    Aturan sistem: Menentukan pembagian Sesi 1 Sholat Jumat dan profil presensi.
                  </p>
                </div>

                {/* 3. No Kartu RFID (UID) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      No Kartu RFID UID (10 Digit) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomRfid}
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer underline"
                      title="Generate nomor UID 10 digit baru acak"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Generate UID Baru</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Cth: 0014298104"
                      value={editUid}
                      onChange={(e) => setEditUid(e.target.value.replace(/\s+/g, ''))}
                      className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-mono font-bold outline-none transition ${
                        duplicateRfidStudent
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-300 text-indigo-950 focus:border-indigo-500 bg-white'
                      }`}
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {duplicateRfidStudent ? (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>UID ini sudah dipakai oleh: {duplicateRfidStudent.name} ({duplicateRfidStudent.halaqah})</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      Nomor UID fisik kartu RFID atau e-KTP santri yang akan di-tap pada Terminal Kiosk.
                    </p>
                  )}
                </div>

                {/* 4. Nama Lengkap & Panggilan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Nama Lengkap Santri *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: Muhammad Bilal Al-Fatih"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Panggilan
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: Bilal"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* 5. Nama Masjid / Halaqah & Usia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Nama Masjid / Halaqah *
                    </label>
                    <select
                      value={editHalaqah}
                      onChange={(e) => setEditHalaqah(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-bold text-slate-800 bg-white"
                    >
                      <option value="Masjid Baitul Faqih">Masjid Baitul Faqih</option>
                      <option value="Masjid Alkautsar">Masjid Alkautsar</option>
                      <option value="Masjid Baitul Karim">Masjid Baitul Karim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Usia (Tahun)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      placeholder="Cth: 10"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* 6. Orang Tua / Wali */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Nama Wali / Orang Tua
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cth: Bpk. Ahmad"
                        value={editParentName}
                        onChange={(e) => setEditParentName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-medium text-slate-800"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      No HP / WA Wali
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cth: 0812-8101-0001"
                        value={editParentPhone}
                        onChange={(e) => setEditParentPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-medium text-slate-800 font-mono"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* 7. Status Keaktifan Santri */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Status Keaktifan Santri</div>
                      <div className="text-[10px] text-slate-500">
                        Santri non-aktif otomatis ditolak saat tap presensi di Kiosk
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  {!editIsActive && (
                    <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-100">
                      <label className="block text-[11px] font-bold text-rose-700 mb-1">
                        Alasan Non-Aktif (Sakit, Cuti, Izin Pulang):
                      </label>
                      <input
                        type="text"
                        placeholder="Cth: Izin pulang kampung / Sakit"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-rose-300 bg-rose-50/50 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-rose-500"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Submit Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!!duplicateRfidStudent}
                    className={`px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer ${
                      duplicateRfidStudent
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal Cetak PDF A4 Peringkat Poin Terbanyak */}
      {isPrintPdfOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Cetak Dokumen PDF Format A4: Peringkat Poin Terbanyak Santri
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak / Unduh PDF (A4)
                </button>
                <button
                  onClick={() => setIsPrintPdfOpen(false)}
                  className="p-1 text-slate-300 hover:text-white rounded-full hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printable Sheet Container */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/50 print:bg-white print:p-0">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 max-w-[210mm] mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">
                {/* Print Letterhead / Kop Surat */}
                <div className="text-center pb-4 border-b-2 border-slate-800 mb-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                    DEWAN KEMAKMURAN MASJID & BADAN PEMBINAAN SANTRI
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase">
                    DAFTAR PERINGKAT POIN KEHADIRAN SHOLAT SANTRI
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Dokumen Resmi Rekapitulasi Istiqomah Berjamaah di Masjid • Format Kertas A4
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 mt-2">
                    <span>Dicetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>Total: {sortedByPointsDesc.length} Santri</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-700">Urutan: Poin Terbanyak ke Terendah</span>
                  </div>
                </div>

                {/* Table sorted by points descending */}
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold text-[11px]">
                    <tr className="border-b border-slate-300">
                      <th className="py-2 px-2 text-center border-r border-slate-300 w-12">Rank</th>
                      <th className="py-2 px-3 border-r border-slate-300">Nama Lengkap Santri</th>
                      <th className="py-2 px-3 border-r border-slate-300">Halaqah / Masjid</th>
                      <th className="py-2 px-2 text-center border-r border-slate-300 w-28">No RFID (UID)</th>
                      <th className="py-2 px-2 text-center border-r border-slate-300 w-20">Total Sholat</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-24 bg-emerald-50">Total Poin</th>
                      <th className="py-2 px-2 text-center w-28">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedByPointsDesc.map((s, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                      return (
                        <tr key={s.id} className={idx < 3 ? 'bg-amber-50/40 font-semibold' : 'hover:bg-slate-50'}>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-200">
                            {medal}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                            {s.name}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                            {s.halaqah}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600 border-r border-slate-200">
                            {s.rfidCardUid}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {s.totalAttendances}x
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/30 border-r border-slate-200 text-sm">
                            {s.totalPoints.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center text-[10px] font-bold">
                            <span className={`px-1.5 py-0.5 rounded ${
                              s.totalPoints >= 300 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : s.totalPoints >= 200
                                ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                                : s.totalPoints >= 100
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-slate-50 text-slate-500'
                            }`}>
                              {s.starBadge}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer Signature on print */}
                <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end text-xs text-slate-700">
                  <div>
                    <p className="font-semibold">Catatan Sistem Presensi RFID:</p>
                    <p className="text-[11px] text-slate-500">
                      • Seluruh data terintegrasi real-time dengan Kemenag Jadwal & RFID Kiosk.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      • Aturan sistem: Taping kartu berulang kali pada sesi yang sama dihitung 1 kali presensi (anti double poin).
                    </p>
                  </div>
                  <div className="text-center min-w-44">
                    <p className="text-[11px] text-slate-500 mb-12">Mengetahui,<br />Koordinator Presensi Masjid</p>
                    <p className="font-bold border-b border-slate-700 pb-1">Ustadz Pembina DKM</p>
                    <p className="text-[10px] text-slate-400">NIP. DKM-SANTRI-2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Registrasi Santri & Kartu RFID Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Santri *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Muhammad Bilal Al-Fatih"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: Bilal"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No Kartu RFID UID (10 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cth: 0014298104"
                    value={formUid}
                    onChange={(e) => setFormUid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500"
                >
                  <option value="L">Laki-laki (Ikhwan)</option>
                  <option value="P">Perempuan (Akhwat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Masjid
                </label>
                <select
                  value={formHalaqah}
                  onChange={(e) => setFormHalaqah(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Masjid Baitul Faqih">Masjid Baitul Faqih</option>
                  <option value="Masjid Alkautsar">Masjid Alkautsar</option>
                  <option value="Masjid Baitul Karim">Masjid Baitul Karim</option>
                </select>
              </div>

              {/* Status Keaktifan Awal */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Status Keaktifan:</span>
                <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Santri Aktif Mengikuti Kegiatan</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  Simpan Santri & Kartu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
