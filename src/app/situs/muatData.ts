import { terapkanDataSitus, type DataSitus } from "./lib/content";

/**
 * Mengisi beranda dari database.
 *
 * Isi diambil langsung dari API yang sudah dipakai situs ini
 * (/api/profil, /api/beranda, /api/berita, /api/galeri, /api/pengumuman, /api/agenda).
 * Sengaja tidak lewat pemuat aplikasi lama (src/app/lib/*) karena pemuat itu
 * memakai daftar contoh sebagai cadangan ketika database masih kosong —
 * di beranda ini tidak boleh ada isi karangan.
 *
 * Jadi: ada isinya di database → tampil. Belum ada → bagian itu tidak tampil.
 */

const KUNCI_SIMPAN = "persis-cibatu-beranda-v1";
const BATAS_SIMPAN = 2_000_000;

/* ------------------------------- Bentuk jawaban API ------------------------------- */

type JawabanProfil = {
  identitas?: Record<string, unknown> | null;
};

type JawabanBeranda = {
  statistik?: Record<string, unknown>[] | null;
  carousel?: Record<string, unknown>[] | null;
  gridMenu?: Record<string, unknown>[] | null;
  navigasi?: Record<string, unknown>[] | null;
  sosial?: Record<string, unknown>[] | null;
};

type BarisBerita = {
  id?: string;
  slug?: string;
  judul?: string;
  tanggal?: string | null;
  kategori?: string | null;
  penulis?: string | null;
  gambarUrl?: string | null;
  dibaca?: number | null;
  ringkasan?: string | null;
  isi?: unknown;
  terbit?: boolean;
};

type BarisPengumuman = {
  id?: string;
  judul?: string;
  tanggal?: string | null;
  kategori?: string | null;
  ringkasan?: string | null;
  isi?: unknown;
  disematkan?: boolean;
  dibaca?: number | null;
  terbit?: boolean;
};

/** Satu foto dari /api/galeri (tabel galeri_foto + nama albumnya). */
type BarisGaleri = {
  id?: string;
  albumId?: string | null;
  kategori?: string | null;
  judul?: string;
  gambarUrl?: string | null;
  tanggal?: string | null;
  aktif?: boolean | null;
};

type JawabanGaleri = {
  foto?: BarisGaleri[] | null;
  kategori?: { id?: string; nama?: string | null; aktif?: boolean | null }[] | null;
};

type BarisAgenda = {
  id?: string;
  judul?: string;
  tanggal?: string | null;
  waktu?: string | null;
  tempat?: string | null;
  tag?: string | null;
  isi?: unknown;
  dibaca?: number | null;
  terbit?: boolean;
};

/* ---------------------------------- Pembantu ---------------------------------- */

const huruf = (nilai: unknown) => (nilai === null || nilai === undefined ? "" : String(nilai));
const angka = (nilai: unknown) => Number(String(nilai ?? 0).replace(/[^\d.-]/g, "")) || 0;
const paragraf = (nilai: unknown) => (Array.isArray(nilai) ? nilai.map((p) => String(p)).filter((p) => p.trim()) : []);

/** Ambil satu jalur API; gagal atau tidak tersedia berarti kosong, bukan contoh. */
async function ambil<T>(jalur: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const jawab = await fetch(jalur, { headers: { Accept: "application/json" } });
    if (!jawab.ok) return null;
    return (await jawab.json()) as T;
  } catch {
    return null;
  }
}

/** Warna bawaan kartu akses cepat, dipakai bergilir. */
const WARNA_AKSES = ["#e09a3f", "#1b8f4f", "#4f7fe0", "#d9695f"];

/* -------------------------------- Simpanan sesi -------------------------------- */

/** Salinan kunjungan sebelumnya (per tab) supaya beranda langsung tampil penuh. */
export function terapkanDataTersimpan(): boolean {
  try {
    const teks = window.sessionStorage.getItem(KUNCI_SIMPAN);
    if (!teks) return false;
    terapkanDataSitus(JSON.parse(teks) as DataSitus);
    return true;
  } catch {
    return false;
  }
}

function simpanData(data: DataSitus) {
  try {
    const teks = JSON.stringify(data);
    if (teks.length > BATAS_SIMPAN) return;
    window.sessionStorage.setItem(KUNCI_SIMPAN, teks);
  } catch {
    /* penyimpanan peramban penuh atau tidak tersedia — abaikan */
  }
}

/* ----------------------------------- Pemuatan ----------------------------------- */

export async function muatDataSitus(): Promise<void> {
  const [profil, beranda, berita, galeri, pengumuman, agenda] = await Promise.all([
    ambil<JawabanProfil>("/api/profil"),
    ambil<JawabanBeranda>("/api/beranda"),
    ambil<{ berita?: BarisBerita[] | null }>("/api/berita"),
    ambil<JawabanGaleri>("/api/galeri"),
    ambil<{ pengumuman?: BarisPengumuman[] | null }>("/api/pengumuman"),
    ambil<{ agenda?: BarisAgenda[] | null }>("/api/agenda"),
  ]);

  const data: DataSitus = {};

  /* ---------------------------------- Identitas -------------------------------- */
  if (profil && profil.identitas && typeof profil.identitas === "object") {
    const asal = profil.identitas as Record<string, unknown>;
    const identitas: Record<string, string> = {};
    for (const kunci of [
      "pimpinan",
      "nama",
      "namaLengkap",
      "namaSingkat",
      "sapaan",
      "wilayah",
      "wilayahLengkap",
      "alamat",
      "telepon",
      "whatsapp",
      "email",
      "jam",
      "logo",
      "logoAlt",
    ]) {
      const nilai = huruf(asal[kunci]).trim();
      if (nilai) identitas[kunci] = nilai;
    }
    if (Object.keys(identitas).length) data.identitas = identitas;
  }

  /* ------------------------------- Isi beranda -------------------------------- */
  if (beranda) {
    const carousel = (beranda.carousel ?? [])
      .filter((c) => c && c.aktif !== false && huruf(c.judul))
      .sort((a, b) => angka(a.urutan) - angka(b.urutan))
      .map((c, i) => ({
        id: huruf(c.id) || `sl-${i + 1}`,
        tag: huruf(c.tag),
        judul: huruf(c.judul),
        gambarUrl: huruf(c.gambarUrl),
      }));
    if (carousel.length) data.carousel = carousel;

    const statistik = (beranda.statistik ?? [])
      .filter((s) => s && s.aktif !== false && huruf(s.label))
      .sort((a, b) => angka(a.urutan) - angka(b.urutan))
      .map((s, i) => ({
        id: huruf(s.id) || `st-${i + 1}`,
        ikon: huruf(s.ikon) || "users",
        label: huruf(s.label),
        labelPendek: huruf(s.labelPendek) || huruf(s.label),
        nilai: huruf(s.nilai) || "0",
        satuan: huruf(s.satuan),
      }));
    /* Angka yang masih nol (database baru) tidak ditampilkan. */
    if (statistik.length && statistik.some((s) => angka(s.nilai) > 0)) data.statistik = statistik;

    const menu = (beranda.gridMenu ?? [])
      .filter((g) => g && g.aktif !== false && huruf(g.label) && huruf(g.halaman))
      .sort((a, b) => angka(a.urutan) - angka(b.urutan))
      .map((g, i) => ({
        id: huruf(g.id) || `mn-${i + 1}`,
        label: huruf(g.label),
        ikon: huruf(g.ikon) || "circle",
        halaman: huruf(g.halaman),
        lencana: huruf(g.lencana),
        keterangan: huruf(g.keterangan),
        tone: huruf(g.tone),
      }));

    if (menu.length) {
      data.gridMenu = menu.map(({ id, label, ikon, halaman }) => ({ id, label, ikon, halaman }));
      /* Kartu akses cepat memakai isi menu yang sama, warnanya bergilir.
         Caption kartu diambil dari kolom keterangan (isian "Caption kartu" di panel admin);
         lencana hanya dipakai bila caption belum diisi. */
      data.aksesCepat = menu.map((g, i) => ({
        id: g.id,
        label: g.label,
        sub: g.keterangan || g.lencana,
        ikon: g.ikon,
        halaman: g.halaman,
        /* Warna dari panel admin dipakai bila bentuknya kode warna (#rrggbb). */
        warna: /^#[0-9a-f]{3,8}$/i.test(g.tone) ? g.tone : WARNA_AKSES[i % WARNA_AKSES.length],
      }));
    }

    const navigasi = (beranda.navigasi ?? [])
      .filter((n) => n && n.aktif !== false && huruf(n.halaman) && huruf(n.label))
      .map((n) => ({ halaman: huruf(n.halaman), label: huruf(n.label), ikon: huruf(n.ikon) || "circle" }));
    if (navigasi.length) data.navigasi = navigasi;

    const sosial = (beranda.sosial ?? [])
      .filter((s) => s && s.aktif !== false && huruf(s.url))
      .sort((a, b) => angka(a.urutan) - angka(b.urutan))
      .map((s, i) => ({
        id: huruf(s.id) || `so-${i + 1}`,
        nama: huruf(s.nama),
        url: huruf(s.url),
        ikon: huruf(s.ikon) || "link",
      }));
    if (sosial.length) data.sosial = sosial;
  }

  /* ---------------------------------- Berita ---------------------------------- */
  const barisBerita = (berita?.berita ?? []).filter((b) => b && b.terbit !== false && huruf(b.judul));
  if (barisBerita.length) {
    data.berita = barisBerita.map((b, i) => ({
      id: huruf(b.id) || `br-${i + 1}`,
      slug: huruf(b.slug) || huruf(b.id) || `berita-${i + 1}`,
      title: huruf(b.judul),
      date: huruf(b.tanggal),
      category: huruf(b.kategori) || "Umum",
      image: huruf(b.gambarUrl),
      views: angka(b.dibaca),
      author: huruf(b.penulis),
      excerpt: huruf(b.ringkasan),
      detail: paragraf(b.isi),
    }));
  }

  /* ---------------------------------- Galeri ---------------------------------- */
  /* Momen kegiatan di beranda diambil dari album galeri, bukan dari berita. */
  const namaAlbum = new Map(
    (galeri?.kategori ?? [])
      .filter((k) => k && huruf(k.id))
      .map((k) => [huruf(k.id), huruf(k.nama).trim()]),
  );
  const barisGaleri = (galeri?.foto ?? []).filter(
    (f) => f && f.aktif !== false && huruf(f.judul) && huruf(f.gambarUrl),
  );
  if (barisGaleri.length) {
    data.galeri = barisGaleri.slice(0, 12).map((f, i) => ({
      id: huruf(f.id) || `gl-${i + 1}`,
      judul: huruf(f.judul),
      gambar: huruf(f.gambarUrl),
      album: huruf(f.kategori).trim() || namaAlbum.get(huruf(f.albumId)) || "Kegiatan",
      tanggal: huruf(f.tanggal),
    }));
  }

  /* -------------------------------- Pengumuman -------------------------------- */
  const barisPengumuman = (pengumuman?.pengumuman ?? []).filter(
    (p) => p && p.terbit !== false && huruf(p.judul),
  );
  if (barisPengumuman.length) {
    data.pengumuman = barisPengumuman.map((p, i) => ({
      id: huruf(p.id) || `pg-${i + 1}`,
      title: huruf(p.judul),
      date: huruf(p.tanggal),
      category: huruf(p.kategori) || "Umum",
      summary: huruf(p.ringkasan),
      detail: paragraf(p.isi),
      pinned: p.disematkan === true,
      views: angka(p.dibaca),
    }));
  }

  /* ---------------------------------- Agenda ---------------------------------- */
  const barisAgenda = (agenda?.agenda ?? []).filter((a) => a && a.terbit !== false && huruf(a.judul));
  if (barisAgenda.length) {
    data.agenda = barisAgenda.map((a, i) => ({
      id: huruf(a.id) || `ag-${i + 1}`,
      title: huruf(a.judul),
      date: huruf(a.tanggal),
      time: huruf(a.waktu),
      place: huruf(a.tempat),
      tag: huruf(a.tag) || "Umum",
      detail: paragraf(a.isi),
      views: angka(a.dibaca),
    }));
  }

  terapkanDataSitus(data);
  simpanData(data);
}
