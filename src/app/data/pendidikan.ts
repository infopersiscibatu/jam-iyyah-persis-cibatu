import { gambar } from "./content";

/* Data jenjang pendidikan, unit, dan program — sama seperti situs rujukan. */

/**
 * Kosa kata yang menyesuaikan penyebutan dengan jenjang pendidikan.
 * Sekolah dan madrasah memakai istilah sekolah, perguruan tinggi memakai istilah kampus
 * (mahasiswa, kampus, UKT, mata kuliah) supaya seluruh kalimat ikut menyesuaikan.
 */
export type Istilah = {
  unit: string;
  unitKumpulan: string;
  unitLain: string;
  peserta: string;
  pengajar: string;
  rombel: string;
  kegiatan: string;
  jurusan: string;
  materi: string;
  statUnit: string;
  statPeserta: string;
  kode: string;
  identitas: string;
  status: string;
  pimpinanUnit: string;
  tahunAkademik: string;
  sebutan: string;
  sebutanKecil: string;
  pengajarTunggal: string;
  pengajarTunggalKecil: string;
  wali: string;
  waliKecil: string;
  iuran: string;
  nomorInduk: string;
  penerimaan: string;
  calon: string;
  calonKecil: string;
  materiKecil: string;
  portal: string;
};

export const istilahSekolah: Istilah = { unit: "sekolah", unitKumpulan: "Daftar Sekolah", unitLain: "Sekolah Lain", peserta: "Peserta didik", pengajar: "Guru & staf", rombel: "Rombongan belajar", kegiatan: "Ekstrakurikuler", jurusan: "Jurusan", materi: "Mata pelajaran khas", statUnit: "Sekolah", statPeserta: "Siswa & Santri", kode: "NPSN", identitas: "Identitas Sekolah", status: "Swasta – PERSIS", pimpinanUnit: "Kepala Sekolah", tahunAkademik: "Tahun Ajaran", sebutan: "Siswa", sebutanKecil: "siswa", pengajarTunggal: "Guru", pengajarTunggalKecil: "guru", wali: "Wali santri", waliKecil: "wali santri", iuran: "SPP", nomorInduk: "NIS", penerimaan: "SPMB", calon: "Calon siswa", calonKecil: "calon siswa", materiKecil: "mata pelajaran", portal: "Portal wali santri" };

export const istilahMadrasah: Istilah = { unit: "madrasah", unitKumpulan: "Daftar Madrasah", unitLain: "Madrasah Lain", peserta: "Santri", pengajar: "Ustadz & staf", rombel: "Kelas diniyyah", kegiatan: "Kegiatan Diniyyah", jurusan: "Program", materi: "Mata pelajaran", statUnit: "Madrasah", statPeserta: "Santri", kode: "Nomor Izin", identitas: "Identitas Madrasah", status: "Non-formal – PERSIS", pimpinanUnit: "Kepala Madrasah", tahunAkademik: "Tahun Ajaran", sebutan: "Santri", sebutanKecil: "santri", pengajarTunggal: "Ustadz", pengajarTunggalKecil: "ustadz", wali: "Wali santri", waliKecil: "wali santri", iuran: "SPP", nomorInduk: "NIS", penerimaan: "SPMB", calon: "Calon santri", calonKecil: "calon santri", materiKecil: "mata pelajaran", portal: "Portal wali santri" };

export const Kampus: Istilah = { unit: "kampus", unitKumpulan: "Daftar Kampus", unitLain: "Kampus Lain", peserta: "Mahasiswa", pengajar: "Dosen & staf", rombel: "Kelas kuliah", kegiatan: "Unit Kegiatan Mahasiswa", jurusan: "Program Studi", materi: "Mata kuliah", statUnit: "Kampus", statPeserta: "Mahasiswa", kode: "Kode PT", identitas: "Identitas Kampus", status: "Perguruan Tinggi – PERSIS", pimpinanUnit: "Rektor", tahunAkademik: "Tahun Akademik", sebutan: "Mahasiswa", sebutanKecil: "mahasiswa", pengajarTunggal: "Dosen", pengajarTunggalKecil: "dosen", wali: "Wali mahasiswa", waliKecil: "wali mahasiswa", iuran: "UKT", nomorInduk: "NIM", penerimaan: "PMB", calon: "Calon mahasiswa", calonKecil: "calon mahasiswa", materiKecil: "mata kuliah", portal: "Portal wali mahasiswa" };

export const jenjang: any[] = [];

export const unit: any[] = [];

export const jurusan: any[] = [];

export const halamanJenjang = {
  judul: "Jenjang Pendidikan",
  pengantar: "PC PERSIS Cibatu menaungi lima jenjang pendidikan formal, dari Raudhatul Athfal sampai perguruan tinggi, dengan kurikulum yang memadukan ilmu agama dan ilmu umum. Selain itu ada Madrasah Diniyyah Takmiliyyah (MDT) sebagai pendidikan diniyyah sore hari yang tidak dihitung dalam jumlah jenjang formal.",
};

export const pengantarJenjang = halamanJenjang.pengantar;

export const jenjangFormal = () => jenjang.filter((j) => (j as { hitungJenjang?: boolean }).hitungJenjang !== false);
export const cariJenjang = (slug: string) => jenjang.find((j) => j.slug === slug);
export const unitJenjang = (slug: string) => unit.filter((u) => u.jenjang === slug);
export const cariUnit = (slug: string) => unit.find((u) => u.slug === slug);
export const jurusanJenjang = (slug: string) => jurusan.filter((j) => j.jenjang === slug);
export const totalUnit = () => unit.length;
