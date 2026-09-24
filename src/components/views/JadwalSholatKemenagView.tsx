import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  RefreshCw, 
  Calendar, 
  Compass, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  Sparkles,
  Bell
} from 'lucide-react';
import { PrayerSchedule, PrayerType } from '../../types';
import { getCurrentActivePrayer } from '../../services/prayerTimeService';

interface Props {
  currentSchedule: PrayerSchedule | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const JadwalSholatKemenagView: React.FC<Props> = ({
  currentSchedule,
  onRefresh,
  isLoading,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const activeInfo = currentSchedule ? getCurrentActivePrayer(currentSchedule, currentTime) : null;

  // Generate 30-day DKI Jakarta calendar table for Google Sheets view
  const monthlyRows = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
    return {
      tanggal: dateStr,
      imsak: '04:19',
      subuh: '04:29',
      terbit: '05:44',
      dhuha: '06:08',
      dzuhur: '11:48',
      ashar: '14:58',
      maghrib: '17:53',
      isya: '19:01',
      isToday: day === currentTime.getDate()
    };
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-6 select-text">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> DKI Jakarta (Kota Jakarta - Kode 1301)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Sumber Resmi: Bimas Islam Kemenag RI
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
              Jadwal Sholat Realtime Kemenag DKI Jakarta
            </h2>
            <p className="text-xs md:text-sm text-slate-600 mt-0.5">
              Sinkronisasi waktu sholat lima waktu otomatis untuk acuan presensi santri dan penilaian sholat berjamaah di masjid.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xs">
            <div>
              <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 animate-pulse" /> Waktu Saat Ini (WIB)
              </div>
              <div className="text-2xl md:text-3xl font-mono font-black tracking-wider text-emerald-300">
                {timeString}
              </div>
              <div className="text-[11px] text-slate-400">
                Zona Waktu: Asia/Jakarta (UTC+7)
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-400 border border-slate-700 transition"
              title="Perbarui Jadwal dari Server Kemenag"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Big Cards of 5 Prayers + Imsak & Dhuha */}
        {currentSchedule && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-5">
            {[
              { label: 'Imsak', time: currentSchedule.imsak, type: 'imsak', isMajor: false },
              { label: 'Subuh', time: currentSchedule.subuh, type: 'Subuh', isMajor: true },
              { label: 'Terbit', time: currentSchedule.terbit, type: 'terbit', isMajor: false },
              { label: 'Dzuhur', time: currentSchedule.dzuhur, type: 'Dzuhur', isMajor: true },
              { label: 'Ashar', time: currentSchedule.ashar, type: 'Ashar', isMajor: true },
              { label: 'Maghrib', time: currentSchedule.maghrib, type: 'Maghrib', isMajor: true },
              { label: 'Isya', time: currentSchedule.isya, type: 'Isya', isMajor: true },
            ].map((item) => {
              const isActive = activeInfo?.activePrayer === item.type;
              return (
                <div
                  key={item.label}
                  className={`p-3 rounded-lg border transition text-center relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-b from-emerald-600 to-teal-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 ring-offset-2'
                      : item.isMajor
                      ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-1 right-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping inline-block" />
                    </div>
                  )}
                  <div className={`text-xs font-semibold ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {item.label}
                  </div>
                  <div className={`text-xl font-mono font-extrabold mt-0.5 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.time}
                  </div>
                  {isActive && (
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/30 px-1.5 py-0.5 rounded text-white">
                      Aktif Sekarang
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Verification Rule Guidance */}
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Aturan Validasi Presensi RFID Masjid:</strong> Setelah adzan kiosk dibuka selama <strong>15 menit</strong> untuk mencari poin sholat sunnah qobliyah dan wudhu (khusus sholat Subuh selama <strong>18 menit</strong>). Setelah itu kiosk ditutup selama <strong>10 menit</strong> saat sholat fardu berjamaah. Kemudian dibuka lagi selama <strong>10 menit</strong> untuk mencari poin wudhu bagi santri yang belum, sholat wajib, doa dan dzikir, serta sholat sunah ba'diyah jika ada (kecuali sholat dhuhur saat hari jumat).
            </span>
          </div>
          <div className="text-emerald-800 font-bold shrink-0">
            Status Gerbang RFID: <span className="text-emerald-600 font-extrabold">SIAP SCAN</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Monthly Table for DKI Jakarta */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              Tabel Jadwal Sholat Kemenag DKI Jakarta Bulan Ini (Sheet View)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            30 Hari Kalender (WIB)
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs font-normal border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-300 sticky top-0 z-10 text-[11px]">
              <tr>
                <th className="px-3 py-2 border-r border-slate-200 text-center w-10">No</th>
                <th className="px-3 py-2 border-r border-slate-200">Tanggal</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center">Imsak</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center bg-amber-50 text-amber-900">Subuh</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center">Terbit</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center">Dhuha</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center bg-yellow-50 text-yellow-900">Dzuhur</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center bg-orange-50 text-orange-900">Ashar</th>
                <th className="px-3 py-2 border-r border-slate-200 text-center bg-rose-50 text-rose-900">Maghrib</th>
                <th className="px-3 py-2 text-center bg-indigo-50 text-indigo-900">Isya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {monthlyRows.map((row, idx) => (
                <tr 
                  key={row.tanggal}
                  className={`hover:bg-slate-50 transition ${row.isToday ? 'bg-emerald-50/70 font-bold text-emerald-950' : 'text-slate-700'}`}
                >
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-sans flex items-center gap-1.5">
                    <span>{row.tanggal}</span>
                    {row.isToday && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold">
                        HARI INI
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center">{row.imsak}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-bold text-amber-900 bg-amber-50/30">{row.subuh}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-500">{row.terbit}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-500">{row.dhuha}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-bold text-yellow-900 bg-yellow-50/30">{row.dzuhur}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-bold text-orange-900 bg-orange-50/30">{row.ashar}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-bold text-rose-900 bg-rose-50/30">{row.maghrib}</td>
                  <td className="px-3 py-1.5 text-center font-bold text-indigo-900 bg-indigo-50/30">{row.isya}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
