import { hariKe, hariTersisa, rupiah } from "../lib/format";
import { gambar } from "./content";

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

export type CatatanRiwayat = {
  id: string;
  tanggal: string;
  judul: string;
  keterangan: string;
  jenis: string;
  /** Porsi dana terkumpul (dipakai data contoh bila nominal tidak tersedia). */
  porsi?: number;
  /** Nominal penyaluran yang dicatat petugas ZIS di panel admin. */
  nominal?: number;
};

const riwayatDasar: { hari: number; judul: string; keterangan: string; jenis: string; porsi?: number }[] = [
  {
    hari: -3,
    judul: "Pemeriksaan internal bendahara",
    keterangan:
      "Bendahara memeriksa kesesuaian penggunaan dana dengan rincian kebutuhan yang diumumkan, termasuk bukti pembelian dan foto pelaksanaan.",
    jenis: "Laporan",
  },
  {
    hari: -9,
    judul: "Laporan penggunaan dana tahap 1",
    keterangan:
      "Nota pembelian dan dokumentasi tahap pertama diarsipkan di sekretariat dan dapat diperiksa oleh donatur kapan saja pada jam layanan.",
    jenis: "Laporan",
  },
  {
    hari: -31,
    judul: "Pencairan dana tahap 1",
    keterangan:
      "Dana tahap pertama diserahkan kepada penanggung jawab program sesuai rencana kebutuhan yang tercantum pada halaman ini.",
    jenis: "Penyaluran",
    porsi: 0.3,
  },
  {
    hari: -58,
    judul: "Laporan penerimaan donasi pekan pertama",
    keterangan:
      "Rekap donasi awal beserta jumlah donatur diumumkan melalui pengumuman resmi lembaga dan kanal informasi wali santri.",
    jenis: "Laporan",
  },
  {
    hari: -96,
    judul: "Program dibuka",
    keterangan:
      "Program diumumkan kepada wali santri, alumni, dan masyarakat beserta target, batas waktu, dan rincian penggunaan dana.",
    jenis: "Program",
  },
];

/** Riwayat program, terbaru lebih dahulu. */
export const riwayatProgram = (p: ProgramDonasi): CatatanRiwayat[] =>
  riwayatDasar
    .map((r, i) => ({ ...r, id: `${p.id}-rw-${i + 1}`, tanggal: hariKe(r.hari) }))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

/** Donatur yang sudah tercatat tiap program (urut terbaru). */
const donaturDasar: Record<string, { nama: string; jumlah: number; hari: number; metode: string }[]> = {
  "pembangunan-ruang-kelas-baru-mts": [
    { nama: "Hamba Allah", jumlah: 10000000, hari: -5, metode: "Transfer Bank" },
  ],
  "beasiswa-santri-yatim-dhuafa": [
    { nama: "H. Asep Saepudin", jumlah: 5000000, hari: -6, metode: "Transfer Bank" },
  ],
  "wakaf-al-quran-buku-pelajaran": [
    { nama: "Keluarga Bapak Umar", jumlah: 2500000, hari: -7, metode: "QRIS" },
  ],
  "renovasi-tempat-wudhu-toilet-santri": [
    { nama: "Hudan Miftahurroji", jumlah: 100000, hari: -4, metode: "Transfer Bank" },
    { nama: "Ibu Nenden Hasanah", jumlah: 1500000, hari: -7, metode: "Tunai di Bendahara" },
  ],
  "santunan-bulanan-anak-yatim": [
    { nama: "Alumni MA 2015", jumlah: 1000000, hari: -7, metode: "Transfer Bank" },
  ],
  "ambulans-layanan-kesehatan-warga": [{ nama: "Hamba Allah", jumlah: 500000, hari: -7, metode: "QRIS" }],
  "pembangunan-masjid-al-furqan-lantai-dua": [
    { nama: "Komunitas Pengajian Cibatu", jumlah: 300000, hari: -7, metode: "Tunai di Bendahara" },
  ],
  "pengadaan-komputer-laboratorium": [
    { nama: "Bapak Rahmat Hidayat", jumlah: 250000, hari: -14, metode: "Transfer Bank" },
  ],
};

export type DonaturProgram = { id: string; nama: string; jumlah: number; waktu: string; metode: string };

/** Donatur sebuah program, terbaru lebih dahulu. */
export const donaturProgram = (slug: string): DonaturProgram[] =>
  (donaturDasar[slug] ?? []).map((d, i) => ({
    id: `${slug}-dnr-${i + 1}`,
    nama: d.nama,
    jumlah: d.jumlah,
    waktu: hariKe(d.hari),
    metode: d.metode,
  }));

/** Program lain untuk bagian "Program Lainnya": batas waktu terdekat lebih dahulu. */
export const programLainnya = (slug: string, n = 3) => programUrut().filter((p) => p.slug !== slug).slice(0, n);
