import { angkaRingkas, hariKe } from "../lib/format";

/* ------------------------------------------------------------------ */
/* Identitas lembaga                                                   */
/* ------------------------------------------------------------------ */

export const identitas = {
  logo: "/logo-persis.png",
  pimpinan: "Pimpinan Cabang",
  nama: "Persatuan Islam (PERSIS)",
  namaLengkap: "Persatuan Islam (PERSIS) Cibatu",
  wilayah: "Cibatu – Garut",
  wilayahLengkap: "Cibatu · Garut · Jawa Barat",
  alamat: "Jl. Raya Cibatu No. 12, Kec. Cibatu, Kab. Garut, Jawa Barat 44185",
  telepon: "(0262) 555-1234",
  whatsapp: "0812-3456-7890",
  email: "sekretariat@persiscibatu.or.id",
  jam: "Senin – Jumat, 07.30 – 15.30 WIB",
};

/* ------------------------------------------------------------------ */
/* Gambar                                                              */
/* ------------------------------------------------------------------ */

export const gambar = {
  masjid: "https://images.unsplash.com/photo-1569929919600-59123640bc02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  kelas1: "https://images.pexels.com/photos/35548841/pexels-photo-35548841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  kelas2: "https://images.pexels.com/photos/35548840/pexels-photo-35548840.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  santriwati: "https://images.unsplash.com/photo-1589104760192-ccab0ce0d90f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  mengaji: "https://images.unsplash.com/photo-1629273229664-11fabc0becc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  berdiskusi: "https://images.unsplash.com/photo-1629273229214-d96be4552b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  kubahHijau: "https://images.unsplash.com/photo-1667456416191-43ba057635c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  menara: "https://images.unsplash.com/photo-1601191362988-ac6ebec629c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ujian: "https://images.pexels.com/photos/19520532/pexels-photo-19520532.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  masjidPutih: "https://images.pexels.com/photos/38973253/pexels-photo-38973253.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  masjidJabar: "https://images.pexels.com/photos/37945700/pexels-photo-37945700.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

/* ------------------------------------------------------------------ */
/* Beranda                                                             */
/* ------------------------------------------------------------------ */

export const slide: any[] = [];

export const statistik: any[] = [];

export const menu: any[] = [];

export const profil = {
  image: gambar.masjidJabar,
  imageAlt: "Masjid berkubah hijau di lingkungan PC PERSIS Cibatu, Jawa Barat",
  summary: [
    "Pimpinan Cabang Persatuan Islam (PERSIS) Cibatu adalah bagian dari jamiyah Persatuan Islam yang bergerak di bidang pendidikan, dakwah, dan sosial kemasyarakatan di wilayah Kecamatan Cibatu, Kabupaten Garut.",
    "Sejak awal berdirinya, PC PERSIS Cibatu mengelola lembaga pendidikan formal dan non-formal — mulai dari Raudhatul Athfal, Madrasah Ibtidaiyah, Madrasah Tsanawiyah, Madrasah Aliyah, hingga majelis taklim dan program tahfizh — dengan rujukan utama Al-Qur'an dan As-Sunnah.",
  ],
  motto: "Iman, Ilmu, dan Amal",
  periode: "Periode 2026 – 2030",
  visi: "Menjadi lembaga pendidikan Islam yang unggul dan terpercaya dalam melahirkan generasi beriman, berilmu, dan beramal sesuai tuntunan Al-Qur'an dan As-Sunnah.",
  misi: [
    "Menyelenggarakan pendidikan yang memadukan ilmu agama dan ilmu umum secara seimbang.",
    "Membina akhlak, ibadah, dan kemandirian peserta didik melalui keteladanan pendidik.",
    "Menggerakkan dakwah, kajian, dan kegiatan sosial bagi jamaah serta masyarakat sekitar.",
    "Mengembangkan tata kelola lembaga yang amanah, transparan, dan berorientasi mutu.",
  ],
};

export type Pengurus = { id: string; urutan?: number; nama: string; jabatan: string; bidang?: string | null; periode?: string | null; foto?: string | null; aktif?: boolean };
export const pengurus: Pengurus[] = [];

/* ------------------------------------------------------------------ */
/* Inisial nama                                                        */
/* ------------------------------------------------------------------ */

const GELAR = new Set([
  "ust",
  "ustadz",
  "ustadzah",
  "kh",
  "h",
  "hj",
  "haji",
  "hajjah",
  "drs",
  "dra",
  "dr",
  "prof",
  "ir",
  "lc",
  "ma",
  "mpd",
  "spd",
  "sag",
  "ssi",
  "se",
  "sh",
  "mh",
  "mm",
  "ba",
]);

export function inisial(nama: string | null | undefined): string {
  const bagian = (nama ?? "")
    .split(/[\s,]+/)
    .map((k) => k.replace(/\./g, "").toLowerCase())
    .filter((k) => k.length > 1 && !GELAR.has(k));
  return ((bagian[0]?.[0] ?? "P") + (bagian[1]?.[0] ?? "")).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Pengumuman                                                          */
/* ------------------------------------------------------------------ */

export type Pengumuman = {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  detail: string[];
  pinned?: boolean;
  views: number;
};

export const pengumuman: Pengumuman[] = [];

/* ------------------------------------------------------------------ */
/* Berita                                                              */
/* ------------------------------------------------------------------ */

export type Berita = {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  views: number;
  author: string;
  excerpt: string;
  body: string[];
};

export const berita: Berita[] = [];

/* ------------------------------------------------------------------ */
/* Agenda                                                              */
/* ------------------------------------------------------------------ */

export type Agenda = {
  id: string;
  title: string;
  date: string;
  time: string;
  place: string;
  tag: string;
  detail: string[];
};

export const agenda: Agenda[] = [];

/* ------------------------------------------------------------------ */
/* Kajian                                                              */
/* ------------------------------------------------------------------ */

export type Kajian = {
  id: string;
  title: string;
  ustadz: string;
  day: string;
  date: string;
  time: string;
  place: string;
  kitab: string;
  live?: boolean;
};

export const kajian: Kajian[] = [];

export type KajianRutin = {
  id: string;
  hari: string;
  waktu: string;
  judul: string;
  ustadz: string;
  tempat: string;
  peserta: string;
};

export const kajianRutin: KajianRutin[] = [];

/* ------------------------------------------------------------------ */
/* Artikel                                                             */
/* ------------------------------------------------------------------ */

export type Artikel = {
  id: string;
  slug: string;
  judul: string;
  kategori: string;
  penulis: string;
  tanggal: string;
  menitBaca: number;
  dibaca: number;
  gambar: string;
  ringkasan: string;
  isi: string[];
};

export const artikel: Artikel[] = [];

/* ------------------------------------------------------------------ */
/* Kontak                                                             */
/* ------------------------------------------------------------------ */

export const topikKontak: string[] = [];

export type KontakUnit = {
  id: string;
  nama: string;
  keterangan: string;
  telepon: string;
  whatsapp: string;
  jam: string;
};

export const kontakUnit: KontakUnit[] = [];

/* ------------------------------------------------------------------ */
/* Penurunan data                                                      */
/* ------------------------------------------------------------------ */

/** Berita terbaru lebih dahulu. */
export const beritaTerbaru = (n?: number) =>
  [...berita].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n ?? berita.length);

/** Artikel terbaru lebih dahulu. */
export const artikelTerbaru = (n?: number) =>
  [...artikel].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, n ?? artikel.length);

/** Artikel dengan pembaca terbanyak — untuk bagian "Paling Banyak Dibaca". */
export const artikelTerpopuler = (n = 5) => [...artikel].sort((a, b) => b.dibaca - a.dibaca).slice(0, n);

/** Cari satu artikel dari alamatnya. */
export const cariArtikel = (slug: string) => artikel.find((a) => a.slug === slug);

/** Artikel lain: kategori yang sama lebih dahulu, lalu yang terbaru. */
export const artikelLainnya = (slug: string, n = 1) => {
  const ini = cariArtikel(slug);
  const lain = artikelTerbaru().filter((a) => a.slug !== slug);
  const sekategori = ini ? lain.filter((a) => a.kategori === ini.kategori) : [];
  return [...sekategori, ...lain.filter((a) => !sekategori.includes(a))].slice(0, n);
};

/** Jumlah sisipan "Baca juga" di tengah isi artikel. */
export const jumlahBacaJuga = (a: Artikel) => Math.min(3, Math.max(1, Math.ceil(a.isi.length / 3)));

/** Daftar kategori berita, urut abjad. */
export const kategoriBerita = () => [...new Set(berita.map((b) => b.category))].sort();

/** Daftar kategori artikel, urut abjad. */
export const kategoriArtikel = () => [...new Set(artikel.map((a) => a.kategori))].sort();

/** Pengumuman Terbaru — urut postingan terbaru. */
export const pengumumanTerbaru = (n = 5) =>
  [...pengumuman].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);

/** Berita Trending — urut jumlah pembaca terbanyak. */
export const beritaTrending = (n = 5) => [...berita].sort((a, b) => b.views - a.views).slice(0, n);

/** Agenda — jadwal terdekat lebih dahulu. */
export const agendaTerdekat = (n = 5) => [...agenda].sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);

/** Satu berita berdasarkan alamatnya. */
export const cariBerita = (slug: string) => berita.find((b) => b.slug === slug);

/** Berita lain: urut terbaru, tanpa berita yang sedang dibuka. */
export const beritaLain = (slug: string, n = 3) =>
  beritaTerbaru().filter((b) => b.slug !== slug).slice(0, n);

/** Baca juga: kategori yang sama lebih dahulu, lalu berita terbaru lainnya. */
export const beritaTerkait = (slug: string, n = 1) => {
  const kini = cariBerita(slug);
  const lain = beritaTerbaru().filter((b) => b.slug !== slug);
  const sekategori = kini ? lain.filter((b) => b.category === kini.category) : [];
  const sisanya = lain.filter((b) => !sekategori.includes(b));
  return [...sekategori, ...sisanya].slice(0, n);
};

export type Notifikasi = {
  id: string;
  jenis: string;
  judul: string;
  ringkas: string;
  tanggal: string;
  halaman: string;
  /** Alamat postingan bila notifikasi menuju halaman detail. */
  slug?: string;
  /** Alamat lengkap yang dibuka saat notifikasi diketuk. */
  tautan?: string;
};

/** Notifikasi disusun dari postingan terbaru: berita, pengumuman, agenda, dan kajian. */
export const daftarNotifikasi = (n = 6): Notifikasi[] => {
  const dariBerita = [...berita]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((b) => ({
      id: `nf-${b.id}`,
      jenis: "Berita",
      judul: b.title,
      ringkas: b.excerpt,
      tanggal: b.date,
      halaman: "berita-detail",
      slug: b.slug,
      tautan: `/#/berita/${b.slug}`,
    }));
  const dariPengumuman = pengumumanTerbaru(5).map((p) => ({
    id: `nf-${p.id}`,
    jenis: "Pengumuman",
    judul: p.title,
    ringkas: p.summary,
    tanggal: p.date,
    halaman: "beranda",
    tautan: `/#/beranda/pengumuman/${p.id}`,
  }));
  const dariAgenda = agendaTerdekat(2).map((a) => ({
    id: `nf-${a.id}`,
    jenis: "Agenda",
    judul: a.title,
    ringkas: `${a.time} · ${a.place}`,
    tanggal: a.date,
    halaman: "beranda",
    tautan: `/#/beranda/agenda/${a.id}`,
  }));
  const dariKajian = kajian.slice(0, 2).map((k) => ({
    id: `nf-${k.id}`,
    jenis: "Kajian",
    judul: k.title,
    ringkas: `${k.ustadz} · ${k.time} · ${k.place}`,
    tanggal: k.date,
    halaman: "kajian",
    tautan: `/#/kajian/${k.id}`,
  }));
  return [...dariBerita, ...dariPengumuman, ...dariAgenda, ...dariKajian]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, n);
};

/**
 * Postingan terbaru untuk notifikasi push ke layar HP:
 * berita, artikel, dan pengumuman — diurutkan dari yang paling baru.
 */
export const daftarNotifikasiPostingan = (n = 8): Notifikasi[] => {
  const dariBerita = [...berita]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((b) => ({
      id: `np-${b.id}`,
      jenis: "Berita",
      judul: b.title,
      ringkas: b.excerpt,
      tanggal: b.date,
      halaman: "berita-detail",
      slug: b.slug,
      tautan: `/#/berita/${b.slug}`,
    }));
  const dariArtikel = [...artikel]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .map((a) => ({
      id: `np-${a.id}`,
      jenis: "Artikel",
      judul: a.judul,
      ringkas: a.ringkasan,
      tanggal: a.tanggal,
      halaman: "artikel-detail",
      slug: a.slug,
      tautan: `/#/artikel/${a.slug}`,
    }));
  const dariPengumuman = pengumumanTerbaru(6).map((p) => ({
    id: `np-${p.id}`,
    jenis: "Pengumuman",
    judul: p.title,
    ringkas: p.summary,
    tanggal: p.date,
    halaman: "beranda",
    tautan: `/#/beranda/pengumuman/${p.id}`,
  }));
  return [...dariBerita, ...dariArtikel, ...dariPengumuman]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, n);
};

export const judulDibaca = (views: number) => `${angkaRingkas(views)} dibaca`;
