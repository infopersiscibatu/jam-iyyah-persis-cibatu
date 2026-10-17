import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { angkaRingkas } from "../lib/format";
import { bacaJumlahSuka, sudahSuka, tandaiSuka, ubahSuka, type JenisSuka } from "../lib/suka";

/**
 * Tombol suka melayang untuk halaman detail berita dan artikel.
 *
 * Bentuknya tombol bulat, dipasang sebagai isi `atas` pada <TombolBagikan> sehingga
 * duduk tepat di atas tombol bagikan yang melayang di kanan bawah. Sekali ketuk
 * menambah suka, ketuk lagi membatalkannya — pilihan itu diingat perangkat ini supaya
 * tombol tetap terlihat sudah ditekan saat pembaca kembali ke halaman yang sama.
 * Jumlah penyuka tampil sebagai lencana kecil di sudut tombol.
 */
export default function TombolSuka({
  jenis,
  slug,
  judul,
}: {
  jenis: JenisSuka;
  slug: string;
  judul: string;
}) {
  const [suka, setSuka] = useState(false);
  const [jumlah, setJumlah] = useState(0);
  const [sibuk, setSibuk] = useState(false);
  const [denyut, setDenyut] = useState(false);
  const [pesan, setPesan] = useState("");
  const hidup = useRef(true);

  useEffect(() => {
    hidup.current = true;
    setSuka(sudahSuka(jenis, slug));
    bacaJumlahSuka(jenis, slug)
      .then((n) => {
        if (hidup.current) setJumlah(n);
      })
      .catch(() => {
        /* angka lama dibiarkan; tombol tetap bisa ditekan */
      });
    return () => {
      hidup.current = false;
    };
  }, [jenis, slug]);

  const ketuk = useCallback(async () => {
    if (sibuk) return;
    const tujuan = !suka;
    setSibuk(true);
    setSuka(tujuan);
    setJumlah((n) => Math.max(0, n + (tujuan ? 1 : -1)));
    if (tujuan) {
      setDenyut(true);
      setTimeout(() => setDenyut(false), 240);
    }
    try {
      const baru = await ubahSuka(jenis, slug, tujuan);
      setJumlah(baru);
      tandaiSuka(jenis, slug, tujuan);
      setPesan(tujuan ? "Terima kasih sudah menyukai." : "Suka dibatalkan.");
    } catch (e) {
      /* Gagal tersimpan: kembalikan seperti semula agar angka di layar tidak menipu. */
      setSuka(!tujuan);
      setJumlah((n) => Math.max(0, n + (tujuan ? -1 : 1)));
      setPesan(e instanceof Error ? e.message : "Suka belum tersimpan. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }, [jenis, slug, suka, sibuk]);

  return (
    <div data-testid={`suka-${jenis}`} className="relative">
      <button
        type="button"
        data-testid="tombol-suka"
        aria-pressed={suka}
        aria-label={suka ? `Batalkan suka pada ${judul}` : `Sukai ${judul}`}
        title={suka ? "Batalkan suka" : "Sukai"}
        disabled={sibuk}
        onClick={() => void ketuk()}
        className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition active:scale-95 disabled:opacity-70 ${
          suka
            ? "bg-persis-900 text-white"
            : "border border-border bg-card text-persis-900"
        }`}
      >
        <Heart
          aria-hidden="true"
          className={`h-5 w-5 transition-transform duration-200 ${suka ? "fill-current text-gold-300" : ""} ${
            denyut ? "scale-125" : "scale-100"
          }`}
        />
      </button>
      {jumlah > 0 ? (
        <span
          data-testid="jumlah-suka"
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-500 px-1 text-[9.5px] font-extrabold text-persis-950 shadow-sm"
        >
          {angkaRingkas(jumlah)}
        </span>
      ) : null}
      <span role="status" aria-live="polite" data-testid="pesan-suka" className="sr-only">
        {pesan}
      </span>
    </div>
  );
}
