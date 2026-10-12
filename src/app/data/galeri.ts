import { hariKe, tanggalBulanSingkat } from "../lib/format";

/* Album dan foto galeri — sama seperti situs rujukan. */

export const albumGaleri = [];

type FotoMentah = { id: string; judul: string; album: string; hari: number; gambar: string };

const fotoMentah: FotoMentah[] = [];

export type Foto = { id: string; judul: string; album: string; gambar: string; tanggal: string; hari: number };

/** Foto terbaru lebih dahulu. */
export const galeri: Foto[] = [...fotoMentah]
  .sort((a, b) => b.hari - a.hari)
  .map((f) => ({ id: f.id, judul: f.judul, album: f.album, gambar: f.gambar, tanggal: tanggalBulanSingkat(hariKe(f.hari)), hari: f.hari }));

export const fotoAlbum = (album: string) => (album === "Semua" ? galeri : galeri.filter((f) => f.album === album));
