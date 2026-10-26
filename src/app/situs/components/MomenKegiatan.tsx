import { useState } from "react";
import { momenGaleri } from "../lib/content";
import type { FotoTampil } from "./PenampilFoto";
import { Icon } from "./Icons";
import JudulSeksi from "./JudulSeksi";

/** Alamat gambar yang benar-benar bisa dipakai (bukan kosong / "null"). */
function alamatSah(gambar?: string | null) {
  const teks = String(gambar ?? "").trim();
  if (teks === "" || teks === "null" || teks === "undefined" || teks === "data:,") return false;
  return true;
}

/**
 * Foto momen kegiatan yang tampil di beranda, diambil dari galeri (album foto
 * kegiatan yang diisi lewat panel admin) — bukan dari berita. Urutannya sudah
 * dari yang terbaru, mengikuti urutan /api/galeri.
 */
export function momenFoto(): FotoTampil[] {
  return momenGaleri(6)
    .filter((f) => alamatSah(f.gambar))
    .map((f) => ({
      id: f.id,
      gambar: f.gambar,
      judul: f.judul,
      album: f.album,
      tanggal: f.tanggal,
    }));
}

/**
 * Satu gambar di dalam bingkai kartu.
 *
 * Bingkainya dikunci (92px, selebar kartu, sudut membulat, latar netral), lalu
 * fotonya diletakkan absolut menutupi seluruh bingkai dengan object-cover.
 * Dengan cara ini:
 *   - foto mendatar, tegak, atau persegi sama-sama menutupi bingkai penuh;
 *   - selama foto masih diunduh, bingkai tetap berwarna netral (bukan putih
 *     kosong yang terlihat seperti gambar tidak menutupi bingkainya);
 *   - bila alamat fotonya rusak atau berkasnya sudah tidak ada, yang tampil
 *     ikon gambar kecil di latar netral — bukan kotak kosong atau ikon gambar
 *     rusak dari peramban.
 */
function GambarMomen({ src, alt }: { src: string; alt: string }) {
  const [gagal, setGagal] = useState(false);

  return (
    <span className="relative block h-[92px] w-full overflow-hidden bg-mist">
      {gagal ? (
        <span className="absolute inset-0 grid place-items-center text-ink-400" aria-hidden="true">
          <Icon name="image" className="h-5 w-5" />
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setGagal(true)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
    </span>
  );
}

/**
 * Dokumentasi kegiatan dalam kartu foto yang bisa digeser. Mengetuk satu kartu
 * langsung menampilkan fotonya; tombol "Lihat semua" membuka halaman galeri.
 */
export default function MomenKegiatan({
  onBukaFoto,
  onSemua,
}: {
  onBukaFoto: (indeks: number) => void;
  onSemua: () => void;
}) {
  const daftar = momenFoto();

  if (daftar.length === 0) return null;

  return (
    <section aria-label="Momen kegiatan">
      <JudulSeksi title="Momen Kegiatan" subtitle="Dokumentasi terbaru" onAction={onSemua} />

      <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {daftar.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onBukaFoto(i)}
            aria-label={`Lihat foto: ${m.judul}`}
            data-testid={`momen-${m.id}`}
            className="w-[164px] shrink-0 overflow-hidden rounded-[14px] border border-line bg-white text-left transition active:scale-[0.98]"
          >
            <GambarMomen src={m.gambar} alt={m.judul} />
            {/* Keterangan dikunci dua baris (nama album) + dua baris (judul), dengan
                tinggi tetap. Tanpa ini judul yang panjang memakai tiga baris dan
                membuat kartu lain ikut melar — menyisakan ruang kosong putih di
                dalam bingkainya. Gaya ditulis langsung supaya tetap berlaku walau
                kelas line-clamp tidak ikut terbangun di CSS situs. */}
            <span className="block p-2.5">
              <span
                className="block text-[7.5px] font-extrabold tracking-[0.14em] text-gold-600 uppercase"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  minHeight: 22,
                }}
              >
                {m.album}
              </span>
              <span
                className="mt-1 block text-[10.5px] leading-snug font-bold text-ink-900"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  minHeight: 29,
                }}
              >
                {m.judul}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
