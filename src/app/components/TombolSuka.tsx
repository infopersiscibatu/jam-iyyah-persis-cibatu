import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { angkaRingkas } from "../lib/format";
import { bacaJumlahSuka, sudahSuka, tandaiSuka, ubahSuka, type JenisSuka } from "../lib/suka";

/**
 * Tombol suka untuk halaman detail berita dan artikel.
 *
 * Ditempatkan tepat di atas tombol bagikan. Sekali ketuk menambah suka, ketuk lagi
 * membatalkannya — pilihan itu diingat perangkat ini supaya tombol tetap terlihat
 * sudah ditekan saat pembaca kembali ke halaman yang sama.
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

  useEffect(() => {
    if (!pesan) return;
    const t = setTimeout(() => setPesan(""), 2600);
    return () => clearTimeout(t);
  }, [pesan]);

  const ketuk = useCallback(async () => {
    if (sibuk) return;
    const tujuan = !suka;
    setSibuk(true);
    setSuka(tujuan);
    setJumlah((n) => Math.max(0, n + (tujuan ? 1 : -1)));
    if (tujuan) {
      setDenyut(true);
      setTimeout(() => setDenyut(false), 220);
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
    <div data-testid={`suka-${jenis}`} className="mb-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        data-testid="tombol-suka"
        aria-pressed={suka}
        aria-label={
          suka
            ? `Batalkan suka pada ${judul}`
            : `Sukai ${judul}${jumlah > 0 ? `, sudah disukai ${jumlah} orang` : ""}`
        }
        disabled={sibuk}
        onClick={() => void ketuk()}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11.5px] font-semibold transition active:scale-[0.98] disabled:opacity-70 ${
          suka
            ? "border-persis-900 bg-persis-900 text-white"
            : "border-persis-900/25 bg-white text-persis-900"
        }`}
      >
        <Heart
          aria-hidden="true"
          className={`h-[15px] w-[15px] transition-transform duration-200 ${suka ? "fill-current text-gold-300" : ""} ${
            denyut ? "scale-125" : "scale-100"
          }`}
        />
        {suka ? "Disukai" : "Suka"}
        {jumlah > 0 ? (
          <span
            data-testid="jumlah-suka"
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              suka ? "bg-white/15 text-gold-300" : "bg-persis-900/[0.07] text-persis-900"
            }`}
          >
            {angkaRingkas(jumlah)}
          </span>
        ) : null}
      </button>
      <span
        aria-live="polite"
        data-testid="pesan-suka"
        className={`text-[10px] font-medium text-ink-500 transition-opacity ${pesan ? "opacity-100" : "opacity-0"}`}
      >
        {pesan || "\u00a0"}
      </span>
    </div>
  );
}
