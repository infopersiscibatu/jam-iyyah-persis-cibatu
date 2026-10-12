/** Data portal wali santri — sama seperti situs rujukan. */

export const santri = {
  nama: "Muhammad Rizky Ramadhan",
  nis: "2024.0187",
  jenjang: "Madrasah Tsanawiyah (MTs) PERSIS Cibatu",
  jurusan: "Program Tahfizh Al-Qur'an",
  kelas: "Kelas VIII – B",
  semester: "Semester Ganjil 1447 H",
};

export type Pelajaran = { id: string; mapel: string; nilai: number; predikat: string };

export const nilaiWali: Pelajaran[] = [];

export type Setoran = { id: string; tanggal: string; materi: string; jenis: string; penilai: string; nilai: string };

export const setoranTahfidz: Setoran[] = [];

export const tahfidz = {
  capaian: "6 Juz 14 Lembar",
  target: "10 Juz — target kelas VIII",
  persen: 64,
  pembimbing: "Ust. Hilman Nurhakim, S.Pd.I",
  jadwal: "Setiap Senin & Kamis, 07.30 – 09.00 WIB",
  tempat: "Masjid Al-Furqan",
};

export type MetodeBayarWali = { id: string; nama: string; keterangan: string; detail: string[] };

/** Cara pembayaran tagihan wali santri (halaman "Sudah Bayar"). */
export const metodeBayarWali: MetodeBayarWali[] = [];

/** Rata-rata nilai seluruh mata pelajaran. */
export const rataRataNilai = () =>
  Math.round(nilaiWali.reduce((t, n) => t + n.nilai, 0) / Math.max(1, nilaiWali.length));

export type Tagihan = {
  id: string;
  label: string;
  keterangan: string;
  jumlah: number;
  jatuhTempo: string;
  status: string;
};

/** Tagihan yang belum dibayar (data awal). */
export const tagihanAwal: Tagihan[] = [];

export type TagihanMenunggu = {
  id: string;
  label: string;
  jumlah: number;
  metode: string;
  dibayarPada?: string;
};

/** Pembayaran yang sudah dicatat dan menunggu pemeriksaan bendahara (data awal). */
export const menungguAwal: TagihanMenunggu[] = [];

export type PembayaranRiwayat = { id: string; label: string; jumlah: number; metode: string; tanggal: string };

/** Riwayat pembayaran yang sudah terverifikasi (data awal). */
export const riwayatAwal: PembayaranRiwayat[] = [];

/* ---------------------------- paginasi ---------------------------- */

export const UKURAN_HALAMAN = 5;

/** Potongan daftar untuk satu halaman. */
export function potongHalaman<T>(daftar: T[], halaman: number) {
  return daftar.slice((halaman - 1) * UKURAN_HALAMAN, halaman * UKURAN_HALAMAN);
}

/** Nomor halaman yang sah untuk sejumlah data. */
export function halamanSah(total: number, halaman: number) {
  return Math.min(Math.max(1, halaman), Math.max(1, Math.ceil(total / UKURAN_HALAMAN)));
}

export function batasHalaman(total: number, halaman: number) {
  return {
    dari: total === 0 ? 0 : (halaman - 1) * UKURAN_HALAMAN + 1,
    sampai: Math.min(total, halaman * UKURAN_HALAMAN),
    totalHalaman: Math.max(1, Math.ceil(total / UKURAN_HALAMAN)),
  };
}
