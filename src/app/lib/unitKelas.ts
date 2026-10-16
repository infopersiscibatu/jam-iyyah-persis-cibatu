import { mintaUnit } from "./unitSpmb";

/** Data kelas (rombel) satu unit pendidikan — dipakai panel Admin Sekolah dan Tata Usaha. */

export type KelasUnit = {
  nama: string;
  /** Nama wali kelas, bila diisi. */
  wali: string;
  /** Urutan kelas: dipakai untuk kenaikan kelas (kelas ke-1 naik ke kelas ke-2). */
  urutan: number;
  /** Jumlah peserta didik aktif di kelas ini. */
  jumlah: number;
  /** Kelas yang sudah dipakai pada data peserta didik tetapi belum masuk daftar. */
  belumTerdaftar?: boolean;
};

export type RingkasanKelas = {
  /** Jumlah kelas terdaftar. */
  total: number;
  /** Peserta didik aktif yang sudah punya kelas. */
  berKelas: number;
  /** Peserta didik aktif yang belum punya kelas. */
  belum: number;
  /** Seluruh peserta didik aktif. */
  peserta: number;
};

export type JawabanKelas = { ok: boolean; kelas: KelasUnit[]; ringkasan: RingkasanKelas };

export type SiswaKelas = {
  id: string;
  nama: string;
  program: string;
  programNama: string;
  kelas: string;
  waliNama: string;
  waliTelepon: string;
  status: string;
};

export type LangkahNaikKelas = { dari: string; ke: string; jumlah: number };

export type JawabanNaikKelas = JawabanKelas & {
  langkah: LangkahNaikKelas[];
  dipindah: number;
  diluluskan: number;
  pesan: string;
};

export type BarisRekapKelas = {
  /** Nama kelas untuk ditampilkan ("Belum berkelas" bila kosong). */
  kelas: string;
  /** Nama kelas sesungguhnya (kosong berarti belum berkelas). */
  kunci: string;
  jumlah: number;
  peserta: number;
  total: number;
  lunas: number;
  jumlahLunas: number;
  tunggakan: number;
  jumlahTunggakan: number;
};

export type JawabanRekapKelas = {
  ok: boolean;
  periode: string | null;
  kelasSaring: string;
  /** Bulan yang pernah ditagih (YYYY-MM), terbaru lebih dahulu. */
  periodeAda: string[];
  baris: BarisRekapKelas[];
  ringkasan: { jumlah: number; total: number; lunas: number; tunggakan: number; jumlahTunggakan: number };
};

export const daftarKelas = () => mintaUnit<JawabanKelas>("/api/unit/kelas");

export const tambahKelas = (nama: string, wali = "") =>
  mintaUnit<JawabanKelas>("/api/unit/kelas", { method: "POST", body: JSON.stringify({ nama, wali }) });

export const ubahKelas = (nama: string, isian: { nama?: string; wali?: string }) =>
  mintaUnit<JawabanKelas & { dipindah: number; pesan: string }>(`/api/unit/kelas/${encodeURIComponent(nama)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusKelas = (nama: string, pindahKe = "") =>
  mintaUnit<JawabanKelas & { dipindah: number; pesan: string }>(`/api/unit/kelas/${encodeURIComponent(nama)}`, {
    method: "DELETE",
    body: JSON.stringify({ pindahKe }),
  });

export const urutkanKelas = (daftar: string[]) =>
  mintaUnit<JawabanKelas>("/api/unit/kelas/urutan", { method: "PUT", body: JSON.stringify({ daftar }) });

export const siswaDiKelas = (kelas: string, opsi: { cari?: string; status?: string } = {}) => {
  const q = new URLSearchParams({ kelas, status: opsi.status ?? "aktif" });
  if (opsi.cari?.trim()) q.set("cari", opsi.cari.trim());
  return mintaUnit<{ ok: boolean; kelas: string; siswa: SiswaKelas[]; jumlah: number }>(
    `/api/unit/kelas/siswa?${q.toString()}`,
  );
};

export const pindahkanSiswa = (id: string, kelas: string) =>
  mintaUnit<{ ok: boolean; siswa: { id: string; nama: string; kelas: string }; ringkasan: RingkasanKelas }>(
    `/api/unit/kelas/siswa/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify({ kelas }) },
  );

export const pindahSemuaKelas = (dari: string, ke: string) =>
  mintaUnit<JawabanKelas & { dipindah: number; dari: string; ke: string }>("/api/unit/kelas/pindah", {
    method: "POST",
    body: JSON.stringify({ dari, ke }),
  });

/** Kenaikan kelas borongan; kelas terakhir diluluskan menjadi alumni. */
export const naikKelas = (luluskanTerakhir = true) =>
  mintaUnit<JawabanNaikKelas>("/api/unit/kelas/naik", {
    method: "POST",
    body: JSON.stringify({ luluskanTerakhir }),
  });

/** Luluskan seluruh peserta didik satu kelas. */
export const luluskanKelas = (kelas: string) =>
  mintaUnit<JawabanKelas & { diluluskan: number; nama: string[]; pesan: string }>("/api/unit/kelas/luluskan", {
    method: "POST",
    body: JSON.stringify({ kelas }),
  });

/** Rekap tagihan per kelas — inti penyaringan laporan di panel Tata Usaha. */
export const rekapTagihanKelas = (opsi: { periode?: string; kelas?: string } = {}) => {
  const q = new URLSearchParams();
  if (opsi.periode) q.set("periode", opsi.periode);
  if (opsi.kelas) q.set("kelas", opsi.kelas);
  return mintaUnit<JawabanRekapKelas>(`/api/unit/kelas/tagihan${q.toString() ? `?${q.toString()}` : ""}`);
};
