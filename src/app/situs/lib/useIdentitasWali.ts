import { useEffect, useState } from "react";
import { ambilTagihanWali, tokenWali } from "../../lib/waliPortal";

/**
 * Nama peserta didik bila wali santri sudah memasukkan PIN-nya.
 * Kosong berarti belum masuk, dan kepala halaman kembali menulis "Jama'ah Persis Cibatu".
 *
 * Berkas ini berdiri sendiri: cukup memakai `tokenWali` dan `ambilTagihanWali` dari
 * src/app/lib/waliPortal.ts, tanpa menambah fungsi baru di berkas tersebut.
 *
 * Nama disimpan BERSAMA token sesinya. Ini yang membuat label sapaan selalu
 * mengikuti sesi yang sedang berjalan:
 *   - keluar (PIN)      → token hilang  → simpanan dibuang → label kembali "Jama'ah Persis Cibatu";
 *   - masuk wali lain   → token berbeda → simpanan lama dibuang → nama diambil ulang dari server.
 * Sebelumnya nama disimpan sendiri tanpa terikat sesi, sehingga nama wali lama
 * terus menempel walau sudah keluar atau berganti akun.
 */

type SimpananNama = { nama: string; token: string };

const KUNCI = "persis-cibatu-wali-identitas-v2";
/** Kunci versi lama: nama tanpa token, sumber label yang tertinggal. Dibuang saat dibaca. */
const KUNCI_LAMA = "persis-cibatu-wali-identitas-v1";

function hapusSimpanan(kunci: string) {
  try {
    window.localStorage.removeItem(kunci);
  } catch {
    /* penyimpanan peramban tidak tersedia */
  }
}

function simpanNama(nama: string, token: string) {
  try {
    if (nama && token) {
      const isi: SimpananNama = { nama, token };
      window.localStorage.setItem(KUNCI, JSON.stringify(isi));
    } else {
      hapusSimpanan(KUNCI);
    }
  } catch {
    /* penyimpanan peramban tidak tersedia */
  }
  try {
    window.dispatchEvent(new Event("wali-identitas"));
  } catch {
    /* bukan peramban dengan Event — abaikan */
  }
}

/**
 * Nama yang sah untuk sesi yang sedang berjalan.
 * Belum masuk, sudah keluar, atau token berbeda (wali lain) → kosong.
 */
function bacaNama(): string {
  const token = tokenWali();
  hapusSimpanan(KUNCI_LAMA);
  if (!token) {
    hapusSimpanan(KUNCI);
    return "";
  }

  try {
    const mentah = window.localStorage.getItem(KUNCI);
    if (!mentah) return "";
    const isi = JSON.parse(mentah) as Partial<SimpananNama>;
    if (typeof isi.nama !== "string" || isi.token !== token) {
      hapusSimpanan(KUNCI);
      return "";
    }
    return isi.nama.trim();
  } catch {
    hapusSimpanan(KUNCI);
    return "";
  }
}

export function useIdentitasWali(): string {
  const [nama, setNama] = useState<string>(() => bacaNama());
  const [token, setToken] = useState<string>(() => tokenWali());

  /* Ikuti perubahan sesi: keluar/masuk dari halaman portal wali, tab lain, atau
     sesi yang berakhir sendiri di server. */
  useEffect(() => {
    const segarkan = () => {
      const tokenSekarang = tokenWali();
      setToken((lama) => (lama === tokenSekarang ? lama : tokenSekarang));
      setNama((lama) => {
        const baru = bacaNama();
        return baru === lama ? lama : baru;
      });
    };

    segarkan();
    window.addEventListener("wali-sesi", segarkan);
    window.addEventListener("wali-identitas", segarkan);
    window.addEventListener("storage", segarkan);
    window.addEventListener("focus", segarkan);
    document.addEventListener("visibilitychange", segarkan);
    /* Jaring pengaman: portal wali bisa mengubah sesi tanpa memberi sinyal,
       jadi sesi diperiksa ulang tiap detik (hanya membaca penyimpanan peramban). */
    const jam = window.setInterval(segarkan, 1000);

    return () => {
      window.removeEventListener("wali-sesi", segarkan);
      window.removeEventListener("wali-identitas", segarkan);
      window.removeEventListener("storage", segarkan);
      window.removeEventListener("focus", segarkan);
      document.removeEventListener("visibilitychange", segarkan);
      window.clearInterval(jam);
    };
  }, []);

  /* Sesi ada tetapi namanya belum tersimpan (baru masuk): ambil sekali dari server. */
  useEffect(() => {
    if (!token || nama) return;
    let hidup = true;
    void ambilTagihanWali()
      .then((data) => {
        if (!hidup || tokenWali() !== token) return;
        const namaSantri = data.santri?.nama?.trim() ?? "";
        if (namaSantri) simpanNama(namaSantri, token);
      })
      .catch(() => {
        /* sesi kedaluwarsa / jaringan: label dibiarkan kosong, bukan nama wali lama */
        if (hidup && !tokenWali()) simpanNama("", "");
      });
    return () => {
      hidup = false;
    };
  }, [token, nama]);

  return nama;
}
