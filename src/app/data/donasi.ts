import { hariTersisa, rupiah } from "../lib/format";

export type ProgramDonasi = {
  id: string;
  slug: string;
  judul: string;
  kategori: string;
  gambar: string;
  target: number;
  terkumpul: number;
  donatur: number;
  batas: string;
  ringkasan: string;
  pengelola: string;
  body: string[];
  rincian: { item: string; jumlah: number }[];
};

/** Program donasi — data & angka seperti pada situs rujukan. */
export const programDonasi: ProgramDonasi[] = [];

/** Kategori program, dipakai untuk saringan di halaman donasi. */
export const kategoriDonasi = ["Pembangunan","Pendidikan","Sarana Ibadah","Sosial"];

/** Jumlah seluruh program donasi. */
export const jumlahProgram = () => programDonasi.length;

/** Kemajuan sebuah program dalam persen (maksimal 100). */
export function progresProgram(p: ProgramDonasi) {
  return {
    terkumpul: p.terkumpul,
    donatur: p.donatur,
    persen: Math.min(100, Math.round((p.terkumpul / p.target) * 100)),
  };
}

/** Seluruh program, batas waktu terdekat lebih dahulu. */
export const programUrut = () => [...programDonasi].sort((a, b) => a.batas.localeCompare(b.batas));

/** Program dengan batas waktu terdekat lebih dahulu. */
export const programMendesak = (jumlah = 5) => programUrut().slice(0, jumlah);

/** Sisa hari sebuah program. */
export const sisaHari = (p: ProgramDonasi) => hariTersisa(p.batas);

/** Ringkas target untuk program utama: "Rp28.100.000 dari target Rp30.000.000". */
export const ringkasTarget = (p: ProgramDonasi) => `${rupiah(p.terkumpul)} dari target ${rupiah(p.target)}`;

/** Cari program berdasarkan alamat. */
export function cariProgram(slug: string) {
  return programDonasi.find((p) => p.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Halaman detail program                                             */
/* ------------------------------------------------------------------ */

export type MetodeDonasi = {
  id: string;
  nama: string;
  keterangan: string;
  langkah: string[];
};

/** Cara menyalurkan donasi, sama seperti rujukan. */
export const metodeDonasi: MetodeDonasi[] = [];

/** Rekening resmi lembaga. */
export const rekeningDonasi = [];

/** Pilihan nominal cepat pada formulir donasi. */
export const nominalCepat = [50000, 100000, 250000, 500000, 1000000, 2500000];

/** Tab informasi program. */
export const tabDonasi = [
  { id: "keterangan", label: "Keterangan" },
  { id: "donatur", label: "Donatur" },
  { id: "riwayat", label: "Riwayat" },
];

/*
 * Catatan riwayat penyaluran dan daftar donatur TIDAK lagi dibuat di sini.
 * Keduanya dibaca dari database lewat /api/program-donasi (tabel
 * donasi_riwayat dan donasi_donatur) dan diisi petugas di panel ZIS,
 * sehingga halaman donasi tidak pernah menampilkan contoh yang dibuat-buat.
 */

/** Program lain untuk bagian "Program Lainnya": batas waktu terdekat lebih dahulu. */
export const programLainnya = (slug: string, n = 3) => programUrut().filter((p) => p.slug !== slug).slice(0, n);
