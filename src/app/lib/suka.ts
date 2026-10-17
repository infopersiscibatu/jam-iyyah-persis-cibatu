/**
 * Tombol suka pada halaman detail berita dan artikel.
 *
 * Angka suka disimpan di server (tabel pengaturan, satu kunci per konten), sedangkan
 * "sudah saya sukai" disimpan di perangkat ini saja — supaya tombolnya tetap terlihat
 * sudah ditekan saat halaman dibuka lagi, tanpa perlu akun pembaca. Menekan sekali lagi
 * membatalkan suka, jadi angka di server ikut turun.
 */

export type JenisSuka = "berita" | "artikel";

/** Daftar "jenis:slug" yang sudah disukai dari perangkat ini. */
const KUNCI_SIMPAN = "persis-suka";
const BATAS_SIMPAN = 400;

function bacaDaftar(): string[] {
  try {
    const isi = localStorage.getItem(KUNCI_SIMPAN);
    if (!isi) return [];
    const data = JSON.parse(isi);
    return Array.isArray(data) ? data.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function tulisDaftar(daftar: string[]) {
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(daftar.slice(-BATAS_SIMPAN)));
  } catch {
    /* penyimpanan peramban tidak tersedia: pilihan hanya berlaku selama halaman terbuka */
  }
}

const kunci = (jenis: JenisSuka, slug: string) => `${jenis}:${slug}`;

/** Sudah disukai dari perangkat ini? */
export function sudahSuka(jenis: JenisSuka, slug: string): boolean {
  return bacaDaftar().includes(kunci(jenis, slug));
}

/** Catat atau hapus catatan "sudah disukai" untuk perangkat ini. */
export function tandaiSuka(jenis: JenisSuka, slug: string, suka: boolean) {
  const daftar = bacaDaftar().filter((k) => k !== kunci(jenis, slug));
  if (suka) daftar.push(kunci(jenis, slug));
  tulisDaftar(daftar);
}

const alamatSuka = (jenis: JenisSuka, slug: string) => `/api/${jenis}/${encodeURIComponent(slug)}/suka`;

/** Baca jumlah suka terbaru dari server. */
export async function bacaJumlahSuka(jenis: JenisSuka, slug: string): Promise<number> {
  const jawab = await fetch(alamatSuka(jenis, slug), { headers: { accept: "application/json" } });
  if (!jawab.ok) throw new Error("Jumlah suka belum bisa dibaca.");
  const data = (await jawab.json()) as { jumlah?: number };
  const angka = Number(data.jumlah ?? 0);
  return Number.isFinite(angka) && angka > 0 ? Math.floor(angka) : 0;
}

/** Tambah satu suka, atau batalkan suka. Mengembalikan jumlah suka terbaru. */
export async function ubahSuka(jenis: JenisSuka, slug: string, suka: boolean): Promise<number> {
  const jawab = await fetch(alamatSuka(jenis, slug), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ arah: suka ? 1 : -1 }),
  });
  if (!jawab.ok) {
    let pesan = "Suka belum tersimpan. Coba lagi.";
    try {
      const data = (await jawab.json()) as { pesan?: string };
      if (data?.pesan) pesan = data.pesan;
    } catch {
      /* jawaban bukan JSON */
    }
    throw new Error(pesan);
  }
  const data = (await jawab.json()) as { jumlah?: number };
  const angka = Number(data.jumlah ?? 0);
  return Number.isFinite(angka) && angka > 0 ? Math.floor(angka) : 0;
}
