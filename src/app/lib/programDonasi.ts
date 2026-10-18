import { useEffect, useState } from "react";
import {
  metodeDonasi as metodeBawaan,
  programDonasi as programBawaan,
  rekeningDonasi as rekeningBawaan,
  type ProgramDonasi,
} from "../data/donasi";

/**
 * Katalog program donasi untuk situs.
 *
 * Seluruh isinya — program, gambar, rincian penggunaan dana, riwayat laporan, dan
 * donatur yang tampil — dibaca dari database lewat `/api/program-donasi`, sehingga
 * perubahan di halaman Admin ZIS langsung tampil di situs. Tidak ada lagi riwayat
 * atau donatur contoh: bila petugas belum mencatat, bagian itu kosong dan situs
 * mengatakannya dengan jelas.
 *
 * Katalog dibaca ulang setiap halaman donasi dibuka, jadi laporan yang baru
 * dicatat petugas tidak perlu menunggu pengunjung memuat ulang peramban.
 */

export type CatatanRiwayatApi = {
  id: string;
  tanggal: string;
  judul: string;
  keterangan: string;
  /** "Laporan" atau "Penyaluran". */
  jenis: string;
  nominal: number;
};

export type DonaturApi = { id: string; nama: string; jumlah: number; metode: string; waktu: string };

export type MetodeBayar = {
  id: string;
  nama: string;
  keterangan: string;
  langkah: string[];
  /** Gambar kanal pembayaran (kode QRIS) yang tampil di popup donasi. */
  gambar?: string;
};

export type Rekening = { id: string; bank: string; nomor: string; atasNama: string };

export type ProgramLengkap = ProgramDonasi & {
  riwayat?: CatatanRiwayatApi[];
  donaturTampil?: DonaturApi[];
  /** Id metode pembayaran yang berlaku untuk program ini. */
  metode?: string[];
};

export type KatalogDonasi = {
  program: ProgramLengkap[];
  metode: MetodeBayar[];
  rekening: Rekening[];
};

/** Isi awal sebelum server menjawab: data bawaan (kosong) dari `data/donasi`. */
let katalog: KatalogDonasi = { program: programBawaan, metode: metodeBawaan, rekening: rekeningBawaan };
/** Apakah katalog sudah pernah tiba dari server. */
let dariServer = false;
/** Permintaan yang sedang berjalan, supaya dua halaman tidak meminta dua kali. */
let janji: Promise<KatalogDonasi> | null = null;
const pendengar = new Set<(v: KatalogDonasi) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(katalog);
}

/**
 * Baca katalog dari database. Bila layanan gagal, katalog terakhir (atau data
 * bawaan) tetap dipakai agar halaman tidak kosong.
 */
export function muatProgramDonasi(): Promise<KatalogDonasi> {
  if (janji) return janji;
  janji = fetch("/api/program-donasi", { headers: { Accept: "application/json" } })
    .then(async (jawab) => {
      const isi = (await jawab.json().catch(() => ({}))) as
        | ({ ok?: boolean } & Partial<KatalogDonasi>)
        | undefined;
      if (!jawab.ok || !isi?.ok || !Array.isArray(isi.program) || isi.program.length === 0) {
        throw new Error("Katalog program donasi belum tersedia.");
      }
      katalog = {
        program: isi.program,
        metode: isi.metode && isi.metode.length > 0 ? isi.metode : metodeBawaan,
        rekening: isi.rekening && isi.rekening.length > 0 ? isi.rekening : rekeningBawaan,
      };
      dariServer = true;
      kabari();
      return katalog;
    })
    .catch(() => katalog)
    .finally(() => {
      janji = null;
    });
  return janji;
}

/** Katalog program donasi yang siap dipakai halaman situs. */
export function useKatalogDonasi() {
  const [data, setData] = useState<KatalogDonasi>(katalog);
  const [siap, setSiap] = useState(dariServer);

  useEffect(() => {
    let batal = false;
    pendengar.add(setData);
    void muatProgramDonasi().then(() => {
      if (!batal) setSiap(dariServer);
    });
    return () => {
      batal = true;
      pendengar.delete(setData);
    };
  }, []);

  /** Metode pembayaran yang berlaku untuk satu program. */
  const metodeProgram = (p: ProgramLengkap | undefined) => {
    if (!p || !p.metode || p.metode.length === 0) return data.metode;
    const dipilih = data.metode.filter((m) => p.metode?.includes(m.id));
    return dipilih.length > 0 ? dipilih : data.metode;
  };

  return {
    daftar: data.program,
    metode: data.metode,
    rekening: data.rekening,
    metodeProgram,
    /** Sudah pernah menerima jawaban server (untuk membedakan "belum dimuat"). */
    siap,
  };
}

/** Program yang paling mendesak: batas waktunya paling dekat lebih dahulu. */
export const urutMendesak = (daftar: ProgramLengkap[]) =>
  [...daftar].sort((a, b) => String(a.batas).localeCompare(String(b.batas)));

/** Kategori yang benar-benar dipakai program, untuk pilihan saring di situs. */
export const kategoriDipakai = (daftar: ProgramLengkap[]) => [
  "Semua",
  ...Array.from(new Set(daftar.map((p) => p.kategori).filter(Boolean))),
];
