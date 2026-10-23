import { useEffect, useState } from "react";
import { ambilTagihanWali, tokenWali } from "../../lib/waliPortal";

/**
 * Nama peserta didik bila wali santri sudah memasukkan PIN-nya.
 * Kosong berarti belum masuk, dan kepala halaman kembali menulis "Jama'ah Persis Cibatu".
 *
 * Berkas ini berdiri sendiri: cukup memakai `tokenWali` dan `ambilTagihanWali` dari
 * src/app/lib/waliPortal.ts, tanpa menambah fungsi baru di berkas tersebut.
 */

const KUNCI_IDENTITAS = "persis-cibatu-wali-identitas-v1";

function bacaNama(): string {
  try {
    return window.localStorage.getItem(KUNCI_IDENTITAS) ?? "";
  } catch {
    return "";
  }
}

function simpanNama(nama: string) {
  try {
    if (nama) window.localStorage.setItem(KUNCI_IDENTITAS, nama);
    else window.localStorage.removeItem(KUNCI_IDENTITAS);
  } catch {
    /* penyimpanan peramban tidak tersedia */
  }
  try {
    window.dispatchEvent(new Event("wali-identitas"));
  } catch {
    /* bukan peramban dengan Event — abaikan */
  }
}

export function useIdentitasWali(): string {
  const [nama, setNama] = useState<string>(() => bacaNama());

  useEffect(() => {
    const baca = () => setNama(bacaNama());
    baca();
    window.addEventListener("wali-identitas", baca);
    window.addEventListener("storage", baca);
    return () => {
      window.removeEventListener("wali-identitas", baca);
      window.removeEventListener("storage", baca);
    };
  }, []);

  /* Sesi lama (masuk sebelum nama disimpan): ambil sekali dari server supaya label ikut benar. */
  useEffect(() => {
    if (nama || !tokenWali()) return;
    let hidup = true;
    void ambilTagihanWali()
      .then((data) => {
        if (!hidup) return;
        const namaSantri = data.santri?.nama?.trim() ?? "";
        if (namaSantri) simpanNama(namaSantri);
        else if (!tokenWali()) simpanNama("");
      })
      .catch(() => {
        /* sesi kedaluwarsa: bersihkan label */
        if (hidup && !tokenWali()) simpanNama("");
      });
    return () => {
      hidup = false;
    };
  }, [nama]);

  return nama;
}
