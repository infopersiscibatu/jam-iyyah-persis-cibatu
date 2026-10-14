import { jalurBagikan } from "./tautanBagikan";

export type KontenBagikan = {
  judul: string;
  penulis?: string;
  ringkasan?: string;
  gambar?: string;
  jalur: string;
};

export function urlPublik(jalur: string, asal: string): string {
  try {
    const url = new URL(jalur, asal);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

const bersih = (teks = "") => teks.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export function susunBagikan(konten: KontenBagikan, asal: string) {
  const url = urlPublik(jalurBagikan(konten.jalur), asal);
  const gambar = konten.gambar ? urlPublik(konten.gambar, asal) : "";
  const judul = bersih(konten.judul);
  const penulis = bersih(konten.penulis);
  const ringkasan = bersih(konten.ringkasan);
  let situs = "";
  try { situs = new URL(asal).host; } catch { /* abaikan */ }
  const teks = [situs, `*${judul}*`, penulis ? `✍️ ${penulis}` : "", ringkasan, url ? `Baca selengkapnya: ${url}` : ""].filter(Boolean).join("\n\n");
  return { url, gambar, judul, penulis, ringkasan, teks };
}