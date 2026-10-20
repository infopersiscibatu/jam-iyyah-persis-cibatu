import { useState } from "react";
import { Icon } from "./Icons";

export type ItemDaftar = {
  id: string;
  slug: string;
  kategori: string;
  judul: string;
  gambar: string;
  tanggal: string;
  meta: string;
  metaIkon: "eye" | "clock";
};

const AWAL = 6;
const TAMBAH = 4;

/** Kartu ringkas sesuai rujukan: foto kiri, keterangan kanan. */
function KartuRingkas({ b, onBuka, satuan }: { b: ItemDaftar; onBuka: (s: string) => void; satuan: string }) {
  return (
    <button
      type="button"
      onClick={() => onBuka(b.slug)}
      aria-label={`Baca ${satuan}: ${b.judul}`}
      className="flex w-full items-stretch gap-3 rounded-[14px] border border-line bg-surface p-2.5 text-left transition active:scale-[0.99]"
    >
      <img src={b.gambar} alt={b.judul} loading="lazy" className="h-[70px] w-[94px] shrink-0 rounded-[10px] object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block text-[8px] font-extrabold tracking-[0.12em] text-gold-600 uppercase">{b.kategori}</span>
        <span className="mt-1 line-clamp-2 block text-[11.5px] leading-snug font-bold text-ink-900">{b.judul}</span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[9px] text-ink-400">
          <span>{b.tanggal}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Icon name={b.metaIkon} className="h-3 w-3" />
            {b.meta}
          </span>
        </span>
      </span>
    </button>
  );
}

/** Halaman daftar Berita/Artikel bergaya rujukan ZIP. */
export default function DaftarKonten({
  judul,
  subjudul,
  satuan,
  items,
  kategori: semuaKategori,
  kosong,
  onBuka,
  testId,
}: {
  judul: string;
  subjudul: string;
  satuan: string;
  items: ItemDaftar[];
  kategori: string[];
  kosong: string;
  onBuka: (slug: string) => void;
  testId: string;
}) {
  const [kategori, setKategori] = useState("Semua");
  const [tampil, setTampil] = useState(AWAL);
  const daftar = kategori === "Semua" ? items : items.filter((b) => b.kategori === kategori);
  const utama = daftar[0];
  const sisanya = daftar.slice(1, tampil);

  return (
    <main data-testid={testId} className="mx-auto w-full max-w-[620px] px-5 pt-3">
      <div className="space-y-4 pb-1">
        <header className="text-center">
          <h1 className="font-header text-[21px] leading-tight font-extrabold tracking-[-0.02em] text-ink-900">{judul}</h1>
          <p className="mt-1 text-[10.5px] text-ink-400">{subjudul}</p>
        </header>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {["Semua", ...semuaKategori].map((k) => {
            const aktif = k === kategori;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKategori(k);
                  setTampil(AWAL);
                }}
                aria-pressed={aktif}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10.5px] font-bold transition ${
                  aktif ? "bg-persis-900 text-primary-foreground" : "border border-line bg-surface text-ink-600 active:scale-95"
                }`}
              >
                {k}
              </button>
            );
          })}
        </div>

        {utama ? (
          <button
            type="button"
            onClick={() => onBuka(utama.slug)}
            aria-label={`Baca ${satuan} utama: ${utama.judul}`}
            className="relative block h-[190px] w-full overflow-hidden rounded-[16px] text-left shadow-[0_18px_34px_-24px_hsl(var(--primary)/0.55)]"
          >
            <img src={utama.gambar} alt={utama.judul} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-persis-950/90 via-persis-950/40 to-transparent" />
            <span className="absolute top-3 left-3 rounded-full bg-gold-300 px-2.5 py-1 text-[8.5px] font-extrabold tracking-wide text-persis-950 uppercase">
              {utama.kategori}
            </span>
            <span className="absolute inset-x-3 bottom-3 block">
              <span className="font-header line-clamp-2 block text-[14px] leading-snug font-extrabold text-primary-foreground">{utama.judul}</span>
              <span className="mt-1.5 flex items-center gap-1.5 text-[9px] font-semibold text-primary-foreground/75">
                <span>{utama.tanggal}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Icon name={utama.metaIkon} className="h-3 w-3" />
                  {utama.meta}
                </span>
              </span>
            </span>
          </button>
        ) : (
          <p className="rounded-[14px] border border-line bg-surface p-4 text-center text-[11px] text-ink-600">{kosong}</p>
        )}

        <div className="space-y-2.5">
          {sisanya.map((b) => (
            <KartuRingkas key={b.id} b={b} onBuka={onBuka} satuan={satuan} />
          ))}
        </div>

        {daftar.length > tampil ? (
          <button
            type="button"
            onClick={() => setTampil((n) => n + TAMBAH)}
            className="w-full rounded-full border border-line bg-surface py-2.5 text-[11px] font-bold text-persis-900 transition active:scale-[0.98]"
          >
            Tampilkan {satuan} lainnya
          </button>
        ) : null}

        {daftar.length > 0 ? (
          <p className="text-center text-[9.5px] text-ink-400">
            Menampilkan {Math.min(daftar.length, tampil)} dari {items.length} {satuan}
          </p>
        ) : null}
      </div>
    </main>
  );
}
