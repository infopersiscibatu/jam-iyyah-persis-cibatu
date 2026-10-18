import { useEffect, useState } from "react";
import { segarkanAgenda } from "./agenda";
import { segarkanArtikel } from "./artikel";
import { segarkanBeranda } from "./beranda";
import { segarkanBerita } from "./berita";
import { segarkanGaleri } from "./galeri";
import { segarkanIklan } from "./iklan";
import { segarkanJenjang } from "./jenjang";
import { segarkanKajian } from "./kajian";
import { segarkanKontak } from "./kontak";
import { segarkanPengumuman } from "./pengumuman";
import { segarkanProfil } from "./profil";
import { muatProgramDonasi } from "./programDonasi";
import { segarkanSpmb } from "./spmb";

/**
 * Memuat seluruh data situs selagi layar pembuka "Memuat Data" tampil.
 *
 * Setiap halaman mengambil datanya sendiri lewat penyimpanan di dalam modul
 * (lib/berita.ts, lib/artikel.ts, dan seterusnya). Bila data itu baru diminta saat
 * halamannya dibuka, pengunjung sempat melihat kerangka kosong. Karena itu semua
 * pemuat dijalankan serentak sejak awal: ketika layar pembuka ditutup, penyimpanan
 * sudah terisi sehingga halaman mana pun langsung tampil lengkap.
 *
 * Layar pembuka tidak boleh terkatung-katung: bila layanan lambat, penantian
 * dipotong pada `batasMs` (bawaan 2,6 detik) dan pemuatan yang belum selesai
 * dibiarkan meneruskan sendiri di belakang layar.
 */

export type KeadaanMuat = {
  selesai: number;
  total: number;
  beres: boolean;
  gagal: string[];
};

type Bagian = { nama: string; muat: () => Promise<unknown> };

/** Daftar data publik yang dipakai halaman-halaman situs. */
export const BAGIAN: Bagian[] = [
  { nama: "Identitas", muat: segarkanProfil },
  { nama: "Beranda", muat: segarkanBeranda },
  { nama: "Berita", muat: segarkanBerita },
  { nama: "Artikel", muat: segarkanArtikel },
  { nama: "Agenda", muat: segarkanAgenda },
  { nama: "Pengumuman", muat: segarkanPengumuman },
  { nama: "Galeri", muat: segarkanGaleri },
  { nama: "Kajian", muat: segarkanKajian },
  { nama: "SPMB", muat: segarkanSpmb },
  { nama: "Jenjang pendidikan", muat: segarkanJenjang },
  { nama: "Kontak", muat: segarkanKontak },
  { nama: "Program donasi", muat: () => muatProgramDonasi() },
  { nama: "Iklan", muat: () => segarkanIklan() },
];

let keadaan: KeadaanMuat = { selesai: 0, total: BAGIAN.length, beres: false, gagal: [] };
const pendengar = new Set<(k: KeadaanMuat) => void>();

function kabari(perubahan: Partial<KeadaanMuat>) {
  keadaan = { ...keadaan, ...perubahan };
  for (const dengar of pendengar) dengar(keadaan);
}

let janji: Promise<void> | null = null;

/** Jalankan seluruh pemuat sekali saja; pemanggilan berikutnya memakai janji yang sama. */
export function mulaiMuatAwal(batasMs = 2600): Promise<void> {
  if (janji) return janji;

  const kerja = BAGIAN.map((bagian) =>
    Promise.resolve()
      .then(() => bagian.muat())
      .then(() => ({ nama: bagian.nama, gagal: false }))
      .catch(() => ({ nama: bagian.nama, gagal: true })),
  );

  /* Hitungan maju setiap bagian selesai, supaya layar pembuka bisa menunjukkan kemajuan. */
  for (const satu of kerja) {
    void satu.then((hasil) => {
      kabari({
        selesai: Math.min(BAGIAN.length, keadaan.selesai + 1),
        gagal: hasil.gagal ? [...keadaan.gagal, hasil.nama] : keadaan.gagal,
      });
    });
  }

  const semua = Promise.all(kerja).then(() => {
    kabari({ selesai: BAGIAN.length, beres: true });
  });

  const batas = new Promise<void>((selesai) => {
    setTimeout(selesai, Math.max(0, batasMs));
  }).then(() => kabari({ beres: true }));

  janji = Promise.race([semua, batas]).then(() => {
    kabari({ beres: true });
  });

  return janji;
}

/** Keadaan pemuatan saat ini (dipakai layar pembuka dan pengujian). */
export function keadaanMuat(): KeadaanMuat {
  return keadaan;
}

/** Kemajuan pemuatan awal untuk layar pembuka. */
export function useMuatAwal(): KeadaanMuat {
  const [data, setData] = useState<KeadaanMuat>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    setData(keadaan);
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/** Untuk pengujian: kembalikan penghitung ke keadaan awal. */
export function _aturUlangMuatAwal() {
  janji = null;
  keadaan = { selesai: 0, total: BAGIAN.length, beres: false, gagal: [] };
}
