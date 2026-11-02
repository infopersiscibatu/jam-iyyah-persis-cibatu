/**
 * Data "Download Aplikasi": daftar aplikasi Android milik lembaga, tangkapan
 * layarnya, dan rating pengunjung. Dipakai halaman pengunjung dan panel admin.
 */

import { useEffect, useState } from "react";
import { ambilToken, hapusToken } from "./sesi";

export type ScreenshotAplikasi = { id: string; url: string };

export type AplikasiItem = {
  id: string;
  nama: string;
  versi: string;
  pengembang: string;
  deskripsi: string;
  fitur: string[];
  /** Alamat ikon aplikasi (boleh kosong). */
  ikon: string;
  /** Alamat berkas APK. */
  berkasUrl: string;
  berkasNama: string;
  /** Ukuran berkas dalam byte. */
  berkasUkuran: number;
  aktif: boolean;
  screenshot: ScreenshotAplikasi[];
  /** Rata-rata bintang 1–5 (0 bila belum ada). */
  rata: number;
  jumlahRating: number;
};

export type RatingAplikasi = {
  id: string;
  nilai: number;
  nama: string;
  ulasan: string;
  tanggal: string | null;
};

/* ------------------------------- pembacaan ------------------------------- */

type JawabanDaftar = { ok?: boolean; aplikasi?: AplikasiItem[]; pesan?: string };

async function ambilJson<T>(jalur: string, opsi: RequestInit = {}): Promise<T> {
  const jawab = await fetch(jalur, {
    headers: { Accept: "application/json", ...(opsi.headers ?? {}) },
    ...opsi,
  });
  const isi = (await jawab.json().catch(() => ({}))) as { pesan?: string };
  if (!jawab.ok) throw new Error(isi?.pesan || `Layanan menjawab ${jawab.status}`);
  return isi as T;
}

let keadaan: AplikasiItem[] = [];
const pendengar = new Set<(v: AplikasiItem[]) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanAplikasi(): Promise<AplikasiItem[]> {
  return ambilJson<JawabanDaftar>("/api/aplikasi")
    .then((j) => {
      keadaan = j.aplikasi ?? [];
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

/** Daftar aplikasi yang aktif, langsung memperbarui semua halaman yang memakainya. */
export function useAplikasi(): AplikasiItem[] {
  const [data, setData] = useState<AplikasiItem[]>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanAplikasi();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

export function ambilAplikasiSatu(id: string): Promise<{ aplikasi: AplikasiItem; rating: RatingAplikasi[] }> {
  return ambilJson(`/api/aplikasi/${encodeURIComponent(id)}`);
}

export function kirimRating(
  id: string,
  nilai: { nilai: number; nama?: string; ulasan?: string },
): Promise<{ rata: number; jumlahRating: number; rating: RatingAplikasi[] }> {
  return ambilJson(`/api/aplikasi/${encodeURIComponent(id)}/rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nilai),
  });
}

/* ------------------------------ panel admin ------------------------------ */

async function mintaAdmin<T>(jalur: string, opsi: RequestInit = {}): Promise<T> {
  const token = ambilToken();
  const jawab = await fetch(jalur, {
    ...opsi,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { "x-sesi-admin": token } : {}),
      ...(opsi.headers ?? {}),
    },
  });
  if (jawab.status === 401) {
    hapusToken();
    throw new Error("Sesi sudah berakhir. Silakan masuk kembali dengan PIN.");
  }
  const isi = (await jawab.json().catch(() => ({}))) as { pesan?: string; aplikasi?: AplikasiItem[] };
  if (!jawab.ok) throw new Error(isi?.pesan || `Layanan menjawab ${jawab.status}`);
  if (Array.isArray(isi.aplikasi)) {
    keadaan = isi.aplikasi.filter((a) => a.aktif);
    kabari();
  }
  return isi as T;
}

export const ambilAplikasiAdmin = () => mintaAdmin<JawabanDaftar>("/api/admin/aplikasi");

export const tambahAplikasi = (nilai: Record<string, unknown>) =>
  mintaAdmin<JawabanDaftar>("/api/admin/aplikasi", { method: "POST", body: JSON.stringify(nilai) });

export const ubahAplikasi = (id: string, nilai: Record<string, unknown>) =>
  mintaAdmin<JawabanDaftar>(`/api/admin/aplikasi/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(nilai),
  });

export const hapusAplikasi = (id: string) =>
  mintaAdmin<JawabanDaftar>(`/api/admin/aplikasi/${encodeURIComponent(id)}`, { method: "DELETE" });

export const tambahScreenshotAplikasi = (id: string, gambarUrl: string) =>
  mintaAdmin<JawabanDaftar>(`/api/admin/aplikasi/${encodeURIComponent(id)}/screenshot`, {
    method: "POST",
    body: JSON.stringify({ gambar_url: gambarUrl }),
  });

export const hapusScreenshotAplikasi = (id: string, ssId: string) =>
  mintaAdmin<JawabanDaftar>(
    `/api/admin/aplikasi/${encodeURIComponent(id)}/screenshot/${encodeURIComponent(ssId)}`,
    { method: "DELETE" },
  );

/** Berkas APK dibaca apa adanya (tanpa dikompresi) lalu dikirim dengan progres. */
export function unggahApk(
  berkas: File,
  onProgres?: (persen: number) => void,
): Promise<{ url: string; nama: string; ukuran: number }> {
  return new Promise((selesai, gagal) => {
    const batas = 100 * 1024 * 1024;
    if (berkas.size > batas) {
      gagal(new Error("Berkas lebih dari 100 MB. Perkecil dulu berkasnya."));
      return;
    }
    const pembaca = new FileReader();
    pembaca.onerror = () => gagal(new Error("Berkas tidak bisa dibaca."));
    pembaca.onload = () => {
      const data = String(pembaca.result || "");
      const kirim = new XMLHttpRequest();
      kirim.open("POST", "/api/unggah-apk");
      kirim.setRequestHeader("Content-Type", "application/json");
      kirim.setRequestHeader("Accept", "application/json");
      const token = ambilToken();
      if (token) kirim.setRequestHeader("x-sesi-admin", token);
      kirim.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgres) onProgres(Math.round((e.loaded / e.total) * 100));
      };
      kirim.onerror = () => gagal(new Error("Unggahan terputus. Coba lagi."));
      kirim.onload = () => {
        let isi: { ok?: boolean; pesan?: string; media?: { url: string; nama_asli?: string; ukuran?: number } } = {};
        try {
          isi = JSON.parse(kirim.responseText || "{}");
        } catch {
          gagal(new Error("Jawaban layanan tidak dikenali."));
          return;
        }
        if (kirim.status < 200 || kirim.status >= 300 || !isi.media) {
          gagal(new Error(isi.pesan || `Unggahan gagal (${kirim.status}).`));
          return;
        }
        onProgres?.(100);
        selesai({
          url: isi.media.url,
          nama: isi.media.nama_asli ?? berkas.name,
          ukuran: Number(isi.media.ukuran ?? berkas.size),
        });
      };
      kirim.send(JSON.stringify({ nama: berkas.name, tipe: berkas.type || "application/vnd.android.package-archive", data }));
    };
    pembaca.readAsDataURL(berkas);
  });
}

/** Ukuran berkas dalam bentuk yang enak dibaca: "12,4 MB". */
export function ukuranTerbaca(byte: number): string {
  if (!byte || byte <= 0) return "";
  const mb = byte / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace(".", ",")} MB`;
  const kb = byte / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}
