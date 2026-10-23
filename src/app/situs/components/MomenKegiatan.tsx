import { momenGaleri } from "../lib/content";
import type { FotoTampil } from "./PenampilFoto";
import JudulSeksi from "./JudulSeksi";

/**
 * Foto momen kegiatan yang tampil di beranda, diambil dari galeri (album foto
 * kegiatan yang diisi lewat panel admin) — bukan dari berita. Urutannya sudah
 * dari yang terbaru, mengikuti urutan /api/galeri.
 */
export function momenFoto(): FotoTampil[] {
  return momenGaleri(6).map((f) => ({
    id: f.id,
    gambar: f.gambar,
    judul: f.judul,
    album: f.album,
    tanggal: f.tanggal,
  }));
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
            <img src={m.gambar} alt={m.judul} loading="lazy" className="h-[92px] w-full object-cover" />
            <span className="block p-2.5">
              <span className="block text-[7.5px] font-extrabold tracking-[0.14em] text-gold-600 uppercase">
                {m.album}
              </span>
              <span className="mt-1 line-clamp-2 block text-[10.5px] leading-snug font-bold text-ink-900">
                {m.judul}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
