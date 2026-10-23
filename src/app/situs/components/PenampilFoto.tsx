import { useEffect } from "react";
import { Icon } from "./Icons";
import { tanggalBulanSingkat, tanggalRelatif } from "../lib/format";

export type FotoTampil = {
  id: string;
  gambar: string;
  judul: string;
  album?: string;
  /** Tanggal ISO (YYYY-MM-DD). */
  tanggal?: string;
};

/**
 * Penampil foto layar penuh. Semua foto tampil pada bingkai berukuran sama
 * (4:3) sehingga tidak ada gambar yang lebih besar atau lebih kecil.
 */
export default function PenampilFoto({
  daftar,
  indeks,
  onTutup,
  onGeser,
}: {
  daftar: FotoTampil[];
  indeks: number | null;
  onTutup: () => void;
  onGeser: (arah: number) => void;
}) {
  const terbuka = indeks !== null && daftar.length > 0;

  useEffect(() => {
    if (!terbuka) return;
    const saatTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
      if (e.key === "ArrowRight") onGeser(1);
      if (e.key === "ArrowLeft") onGeser(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", saatTombol);
    return () => {
      document.removeEventListener("keydown", saatTombol);
      document.body.style.overflow = overflow;
    };
  }, [terbuka, onTutup, onGeser]);

  if (indeks === null) return null;
  const foto = daftar[indeks];
  if (!foto) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-persis-950/96 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${foto.judul}`}
      data-testid="penampil-foto"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3.5">
        <p className="min-w-0 flex-1 truncate text-[10px] font-bold tracking-[0.12em] text-white/70 uppercase">
          {foto.album || "Galeri"}
        </p>
        <button
          type="button"
          onClick={onTutup}
          aria-label="Tutup foto"
          data-testid="penampil-tutup"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white transition active:scale-95"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-3">
        {daftar.length > 1 ? (
          <button
            type="button"
            onClick={() => onGeser(-1)}
            aria-label="Foto sebelumnya"
            data-testid="penampil-sebelum"
            className="absolute left-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-persis-950/60 text-white ring-1 ring-white/25 backdrop-blur-sm transition active:scale-95"
          >
            <Icon name="chevron-right" className="h-4 w-4 rotate-180" />
          </button>
        ) : null}

        <div
          className="aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-[14px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
          data-testid="bingkai-foto"
        >
          {/* Foto mengisi penuh bingkai 4:3 supaya tidak ada sisi kosong/hitam. */}
          <img src={foto.gambar} alt={foto.judul} className="h-full w-full object-cover" />
        </div>

        {daftar.length > 1 ? (
          <button
            type="button"
            onClick={() => onGeser(1)}
            aria-label="Foto berikutnya"
            data-testid="penampil-berikut"
            className="absolute right-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-persis-950/60 text-white ring-1 ring-white/25 backdrop-blur-sm transition active:scale-95"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className="shrink-0 px-5 pt-2 text-center"
        style={{ paddingBottom: "calc(1.1rem + env(safe-area-inset-bottom))" }}
      >
        <p className="font-header text-[13.5px] leading-snug font-extrabold text-white">{foto.judul}</p>
        {foto.tanggal ? (
          <p className="mt-1 text-[10px] text-white/65" data-testid="penampil-keterangan">
            {tanggalBulanSingkat(foto.tanggal)} · {tanggalRelatif(foto.tanggal)}
          </p>
        ) : null}
        {daftar.length > 1 ? (
          <p className="mt-1.5 text-[9.5px] font-semibold text-white/45">
            {indeks + 1} dari {daftar.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}
