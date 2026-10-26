/**
 * Isi beranda beranda desain baru.
 *
 * Semua daftar di bawah ini KOSONG sejak awal dan hanya terisi dari database
 * lewat `muatDataSitus()` (src/app/situs/muatData.ts). Tidak ada data contoh:
 * bila sebuah bagian belum punya isi di database, bagian itu tidak ditampilkan
 * di beranda — bukan diisi karangan.
 */

/* ------------------------------------------------------------------ */
/* Identitas lembaga                                                   */
/* ------------------------------------------------------------------ */

export type Identitas = {
  logo: string;
  logoAlt: string;
  pimpinan: string;
  nama: string;
  namaLengkap: string;
  namaSingkat: string;
  sapaan: string;
  wilayah: string;
  wilayahLengkap: string;
  alamat: string;
  telepon: string;
  whatsapp: string;
  email: string;
  jam: string;
};

/** Hanya nama berkas logo yang diberi nilai awal; selebihnya menunggu database. */
export let identitas: Identitas = {
  logo: "/logo-persis.png",
  logoAlt: "Logo Persatuan Islam (PERSIS)",
  pimpinan: "",
  nama: "",
  namaLengkap: "",
  namaSingkat: "",
  sapaan: "Assalamu'alaikum",
  wilayah: "",
  wilayahLengkap: "",
  alamat: "",
  telepon: "",
  whatsapp: "",
  email: "",
  jam: "",
};

/* ------------------------------------------------------------------ */
/* Sorotan (carousel)                                                  */
/* ------------------------------------------------------------------ */

export type Carousel = {
  id: string;
  tag: string;
  judul: string;
  gambarUrl: string;
};

export let carousel: Carousel[] = [];

/* ------------------------------------------------------------------ */
/* Angka ringkas                                                       */
/* ------------------------------------------------------------------ */

export type StatistikKartu = {
  id: string;
  ikon: string;
  label: string;
  labelPendek: string;
  nilai: string;
  satuan?: string | null;
};

export let statistik: StatistikKartu[] = [];

/* ------------------------------------------------------------------ */
/* Menu                                                               */
/* ------------------------------------------------------------------ */

export type MenuGrid = { id: string; label: string; ikon: string; halaman: string; tone?: string | null };

export let gridMenu: MenuGrid[] = [];

export type MenuCepat = {
  id: string;
  label: string;
  sub: string;
  ikon: string;
  halaman: string;
  warna: string;
};

export let aksesCepat: MenuCepat[] = [];

export type NavBawah = { halaman: string; label: string; ikon: string };

export let navigasi: NavBawah[] = [];

export type TautanSosial = { id: string; nama: string; url: string; ikon: string };

export let sosial: TautanSosial[] = [];

/* ------------------------------------------------------------------ */
/* Berita                                                             */
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
  /** Paragraf naskah lengkap berita. */
  detail?: string[];
};

export let berita: Berita[] = [];

export const beritaTrending = (n = 5) => [...berita].sort((a, b) => b.views - a.views).slice(0, n);

/* ------------------------------------------------------------------ */
/* Galeri (dokumentasi kegiatan)                                      */
/* ------------------------------------------------------------------ */

/** Satu foto dari album galeri, dipakai bagian "Momen Kegiatan" di beranda. */
export type FotoGaleri = {
  id: string;
  judul: string;
  /** Alamat gambar foto. */
  gambar: string;
  /** Nama album/kategori foto (tampil kecil di atas judul). */
  album: string;
  /** Tanggal ISO (YYYY-MM-DD). */
  tanggal: string;
};

/** Foto galeri dari database, sudah urut dari yang terbaru (urutan API). */
export let galeri: FotoGaleri[] = [];

/** Foto galeri terbaru untuk "Momen Kegiatan" — bukan lagi dari berita. */
export const momenGaleri = (n = 6) => galeri.filter((f) => f.gambar).slice(0, n);

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

export let pengumuman: Pengumuman[] = [];

export const pengumumanTerbaru = (n = 5) =>
  [...pengumuman].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);

export const pengumumanUtama = () => pengumuman.find((p) => p.pinned) ?? pengumumanTerbaru(1)[0];

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
  views: number;
};

export let agenda: Agenda[] = [];

/** Tanggal hari ini menurut Waktu Indonesia Barat, bentuk YYYY-MM-DD. */
function hariIniWib(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Agenda yang belum lewat — hari ini dan sesudahnya — urut dari yang paling dekat.
 *
 * Agenda bertanggal lampau sengaja dibuang: bagian "Agenda Terdekat" dan
 * notifikasinya harus kosong kalau tidak ada acara mendatang, bukan menampilkan
 * acara kemarin. Patokannya tanggal WIB, bukan tanggal perangkat pengunjung.
 */
export const agendaTerdekat = (n = 5) => {
  const batas = hariIniWib();
  return agenda
    .filter((a) => typeof a.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(a.date))
    .filter((a) => a.date.slice(0, 10) >= batas)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, n);
};

/* ------------------------------------------------------------------ */
/* Notifikasi kepala beranda                                          */
/* ------------------------------------------------------------------ */

export type Notifikasi = {
  id: string;
  jenis: string;
  judul: string;
  ringkas: string;
  tanggal: string;
};

export let notifikasi: Notifikasi[] = [];

/** Daftar notifikasi disusun ulang setiap data dari database berubah. */
export function susunNotifikasi(): Notifikasi[] {
  return [
    ...beritaTrending(5).map((b) => ({
      id: `nf-${b.id}`,
      jenis: "Berita",
      judul: b.title,
      ringkas: b.excerpt,
      tanggal: b.date,
    })),
    ...pengumumanTerbaru(5).map((p) => ({
      id: `nf-${p.id}`,
      jenis: "Pengumuman",
      judul: p.title,
      ringkas: p.summary,
      tanggal: p.date,
    })),
    ...agendaTerdekat(3).map((a) => ({
      id: `nf-${a.id}`,
      jenis: "Agenda",
      judul: a.title,
      ringkas: `${a.time} · ${a.place}`,
      tanggal: a.date,
    })),
  ]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 6);
}

/* ------------------------------------------------------------------ */
/* Isi situs dari database                                             */
/* ------------------------------------------------------------------ */

/** Bagian yang dipakai beranda; semuanya datang dari database. */
export type DataSitus = {
  identitas?: Partial<Identitas>;
  carousel?: Carousel[];
  statistik?: StatistikKartu[];
  gridMenu?: MenuGrid[];
  aksesCepat?: MenuCepat[];
  navigasi?: NavBawah[];
  sosial?: TautanSosial[];
  berita?: Berita[];
  galeri?: FotoGaleri[];
  pengumuman?: Pengumuman[];
  agenda?: Agenda[];
};

/**
 * Pasang isi dari database. Bagian yang tidak dikirim dibiarkan kosong —
 * tidak diisi contoh — supaya yang tampil hanya isi sungguhan.
 */
export function terapkanDataSitus(data: DataSitus): void {
  if (data.identitas) identitas = { ...identitas, ...data.identitas };
  if (data.carousel?.length) carousel = data.carousel;
  if (data.statistik?.length) statistik = data.statistik;
  if (data.gridMenu?.length) gridMenu = data.gridMenu;
  if (data.aksesCepat?.length) aksesCepat = data.aksesCepat;
  if (data.navigasi?.length) navigasi = data.navigasi;
  if (data.sosial?.length) sosial = data.sosial;
  if (data.berita?.length) berita = data.berita;
  if (data.galeri?.length) galeri = data.galeri;
  if (data.pengumuman?.length) pengumuman = data.pengumuman;
  if (data.agenda?.length) agenda = data.agenda;
  notifikasi = susunNotifikasi();
}
