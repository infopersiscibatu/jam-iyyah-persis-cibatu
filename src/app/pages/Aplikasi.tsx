import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "../components/Icons";
import { BlokIsi } from "../components/IsiKaya";
import { tanggalPanjang } from "../lib/format";
import {
  ambilAplikasiSatu,
  kirimRating,
  segarkanAplikasi,
  sudahRatingLokal,
  tandaiRatingLokal,
  ukuranTerbaca,
  useAplikasi,
  type AplikasiItem,
  type RatingAplikasi,
  type ScreenshotAplikasi,
} from "../lib/aplikasi";

/**
 * Halaman pengunjung "Download Aplikasi" — daftar aplikasi Android lembaga
 * dengan tampilan seperti Play Store: ikon, nama, pengembang, bintang, ukuran,
 * halaman rinci berisi tangkapan layar, fitur, dan unduhan.
 *
 * Tiga kemudahan untuk jama'ah:
 *  - satu perangkat hanya bisa memberi satu rating; begitu terkirim, borang
 *    rating disembunyikan dan diganti ucapan terima kasih;
 *  - tombol melayang di sisi kanan untuk membesarkan/mengecilkan seluruh tulisan
 *    halaman (pilihannya diingat peramban);
 *  - tangkapan layar bisa diketuk untuk dilihat lebih jelas, satu per satu.
 */

/** Tingkat ukuran tulisan halaman: 90% sampai 150%. */
const TINGKAT_UKURAN = [0.9, 1, 1.15, 1.3, 1.5];
const KUNCI_UKURAN = "persis-ukuran-teks-aplikasi";

function tingkatAwal(): number {
  try {
    const simpan = localStorage.getItem(KUNCI_UKURAN);
    /* Tanpa simpanan sebelumnya, halaman tampil pada ukuran normal (100%). */
    if (simpan === null) return 1;
    const angka = Number(simpan);
    return Number.isInteger(angka) && angka >= 0 && angka < TINGKAT_UKURAN.length ? angka : 1;
  } catch {
    return 1;
  }
}

function Bintang({ nilai, ukuran = "h-3.5 w-3.5" }: { nilai: number; ukuran?: string }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`Rating ${nilai} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" aria-hidden="true" className={ukuran}>
          <path
            d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"
            fill={nilai >= n - 0.25 ? "#f4b740" : "#dfe4e0"}
          />
        </svg>
      ))}
    </span>
  );
}

function IkonAplikasi({ app, besar = false }: { app: AplikasiItem; besar?: boolean }) {
  const kelas = besar
    ? "h-[64px] w-[64px] rounded-[16px] text-[24px]"
    : "h-12 w-12 rounded-[13px] text-[17px]";
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden bg-persis-900/8 font-extrabold text-persis-900 ${kelas}`}
    >
      {app.ikon ? (
        <img src={app.ikon} alt="" className="h-full w-full object-cover" />
      ) : (
        (app.nama || "A").trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}

function Unduh({ app, penuh = false }: { app: AplikasiItem; penuh?: boolean }) {
  const siap = Boolean(app.berkasUrl);
  if (!siap) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-black/[0.06] px-4 py-2 text-[11px] font-semibold text-ink-400 ${
          penuh ? "w-full" : ""
        }`}
      >
        Belum tersedia
      </span>
    );
  }
  return (
    <a
      href={app.berkasUrl}
      download={app.berkasNama || undefined}
      target="_blank"
      rel="noreferrer"
      data-testid={`unduh-${app.id}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-persis-900 px-4 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] ${
        penuh ? "w-full" : ""
      }`}
    >
      <Icon name="chevron" className="h-3.5 w-3.5 rotate-90" />
      Unduh
      {app.berkasUkuran > 0 ? (
        <span className="font-normal text-white/70">· {ukuranTerbaca(app.berkasUkuran)}</span>
      ) : null}
    </a>
  );
}

/* ------------------------------ ukuran tulisan ------------------------------ */

/** Tombol melayang di sisi kanan: membesarkan dan mengecilkan tulisan halaman. */
function PengaturUkuran({ tingkat, onUbah }: { tingkat: number; onUbah: (n: number) => void }) {
  const terbesar = tingkat >= TINGKAT_UKURAN.length - 1;
  const terkecil = tingkat <= 0;
  return (
    <div
      data-testid="pengatur-ukuran"
      className="fixed top-1/2 right-0 z-[70] -translate-y-1/2 print:hidden"
    >
      <div className="flex flex-col items-center gap-1 rounded-l-2xl border border-r-0 border-black/[0.10] bg-white/95 px-1.5 py-2 shadow-[0_10px_28px_-16px_rgba(7,51,39,0.55)] backdrop-blur">
        <button
          type="button"
          aria-label="Besarkan tulisan"
          data-testid="ukuran-teks-besar"
          onClick={() => onUbah(Math.min(tingkat + 1, TINGKAT_UKURAN.length - 1))}
          disabled={terbesar}
          className="grid h-8 w-9 place-items-center rounded-lg bg-persis-900 text-[12.5px] font-extrabold text-white transition active:scale-95 disabled:opacity-40"
        >
          A+
        </button>
        <span
          data-testid="ukuran-teks-nilai"
          className="text-[8.5px] font-bold tabular-nums text-ink-400"
          aria-live="polite"
        >
          {Math.round(TINGKAT_UKURAN[tingkat] * 100)}%
        </span>
        <button
          type="button"
          aria-label="Kecilkan tulisan"
          data-testid="ukuran-teks-kecil"
          onClick={() => onUbah(Math.max(tingkat - 1, 0))}
          disabled={terkecil}
          className="grid h-8 w-9 place-items-center rounded-lg border border-black/[0.10] text-[12.5px] font-extrabold text-persis-900 transition active:scale-95 disabled:opacity-40"
        >
          A−
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- lihat tangkapan ----------------------------- */

/** Tangkapan layar diperbesar: bisa digeser ke gambar berikutnya, ditutup dengan Escape. */
function LihatGambar({
  daftar,
  awal,
  nama,
  onTutup,
}: {
  daftar: ScreenshotAplikasi[];
  awal: number;
  nama: string;
  onTutup: () => void;
}) {
  const [kini, setKini] = useState(awal);

  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
      if (e.key === "ArrowRight") setKini((n) => Math.min(n + 1, daftar.length - 1));
      if (e.key === "ArrowLeft") setKini((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", tekan);
    /* Halaman di belakang tidak ikut bergeser selama gambar dibuka. */
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tekan);
      document.body.style.overflow = asal;
    };
  }, [daftar.length, onTutup]);

  const gambar = daftar[kini];
  if (!gambar) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tangkapan layar ${nama}`}
      data-testid="lihat-gambar"
      className="fixed inset-0 z-[120] flex flex-col bg-ink-900/92 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-white">
        <p className="text-[10.5px] font-semibold text-white/80">
          {kini + 1} / {daftar.length}
        </p>
        <button
          type="button"
          aria-label="Tutup gambar"
          data-testid="tutup-gambar"
          onClick={onTutup}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.14] text-white transition active:scale-95"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        aria-label="Tutup gambar"
        onClick={onTutup}
        className="flex min-h-0 flex-1 items-center justify-center px-2"
      >
        <img
          src={gambar.url}
          alt={`Tangkapan layar ${kini + 1} ${nama}`}
          className="max-h-full max-w-full rounded-xl object-contain"
        />
      </button>

      {daftar.length > 1 ? (
        <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-5">
          <button
            type="button"
            aria-label="Gambar sebelumnya"
            data-testid="gambar-sebelum"
            onClick={() => setKini((n) => Math.max(n - 1, 0))}
            disabled={kini <= 0}
            className="rounded-full bg-white/[0.14] px-3.5 py-2 text-[10.5px] font-semibold text-white transition active:scale-95 disabled:opacity-35"
          >
            ‹ Sebelumnya
          </button>
          <button
            type="button"
            aria-label="Gambar berikutnya"
            data-testid="gambar-sesudah"
            onClick={() => setKini((n) => Math.min(n + 1, daftar.length - 1))}
            disabled={kini >= daftar.length - 1}
            className="rounded-full bg-white/[0.14] px-3.5 py-2 text-[10.5px] font-semibold text-white transition active:scale-95 disabled:opacity-35"
          >
            Berikutnya ›
          </button>
        </div>
      ) : (
        <div className="pb-5" />
      )}
    </div>
  );
}

/* ------------------------------ satu aplikasi ------------------------------ */

/**
 * Halaman pengunjung "Download Aplikasi" langsung menampilkan halaman unduh
 * aplikasinya, tanpa daftar lebih dulu. Bila ada beberapa aplikasi aktif, yang
 * ditampilkan adalah yang pertama (urutan di panel admin); tautan `#/aplikasi/<id>`
 * tetap bisa dipakai untuk membuka aplikasi tertentu.
 */
export function HalamanAplikasi({ sasaran }: { sasaran?: string | null }) {
  const daftar = useAplikasi();
  const [selesai, setSelesai] = useState(false);

  /* Penanda bahwa pengambilan data pertama sudah rampung, supaya "belum ada aplikasi"
     tidak sempat berkedip sebelum daftarnya datang. */
  useEffect(() => {
    let hidup = true;
    void segarkanAplikasi().finally(() => {
      if (hidup) setSelesai(true);
    });
    return () => {
      hidup = false;
    };
  }, []);

  const app = (sasaran ? daftar.find((a) => a.id === sasaran) : daftar[0]) ?? undefined;
  const id = sasaran ?? app?.id ?? null;

  if (!id) {
    return (
      <div data-testid="halaman-aplikasi" className="px-4 pt-3">
        {selesai ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/[0.14] bg-white p-6 text-center">
            <Icon name="newspaper" className="mx-auto h-7 w-7 text-ink-400" />
            <p className="mt-2 text-[12px] font-semibold text-ink-900">Belum ada aplikasi</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-ink-500">
              Aplikasi yang diunggah pengurus lewat panel admin akan tampil di sini.
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-black/[0.14] bg-white p-5 text-[11px] text-ink-500">
            Memuat aplikasi…
          </p>
        )}
      </div>
    );
  }

  return <RinciAplikasi id={id} awal={app} />;
}

/* --------------------------------- rinci --------------------------------- */

function RinciAplikasi({ id, awal }: { id: string; awal?: AplikasiItem }) {
  const [app, setApp] = useState<AplikasiItem | undefined>(awal);
  const [rating, setRating] = useState<RatingAplikasi[]>([]);
  const [bintang, setBintang] = useState(0);
  const [nama, setNama] = useState("");
  const [ulasan, setUlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);
  /* Satu perangkat hanya sekali memberi rating pada tiap aplikasi. */
  const [sudah, setSudah] = useState(() => sudahRatingLokal(id));
  const [tingkat, setTingkat] = useState(tingkatAwal);
  const [dilihat, setDilihat] = useState<number | null>(null);

  const ubahTingkat = (n: number) => {
    setTingkat(n);
    try {
      localStorage.setItem(KUNCI_UKURAN, String(n));
    } catch {
      /* Peramban yang menolak penyimpanan tetap bisa memakai tombolnya. */
    }
  };

  useEffect(() => {
    let hidup = true;
    void ambilAplikasiSatu(id)
      .then((j) => {
        if (!hidup) return;
        setApp(j.aplikasi);
        setRating(j.rating);
        if (j.sudahRating || sudahRatingLokal(id)) setSudah(true);
      })
      .catch(() => undefined);
    return () => {
      hidup = false;
    };
  }, [id]);

  const kirim = async () => {
    if (bintang < 1) {
      setPesan({ tipe: "galat", teks: "Pilih dulu berapa bintang." });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      const j = await kirimRating(id, { nilai: bintang, nama: nama.trim(), ulasan: ulasan.trim() });
      setRating(j.rating);
      setApp((a) => (a ? { ...a, rata: j.rata, jumlahRating: j.jumlahRating } : a));
      setBintang(0);
      setUlasan("");
      /* Borang langsung disembunyikan: satu perangkat hanya boleh menilai sekali. */
      setSudah(true);
      tandaiRatingLokal(id);
      setPesan({ tipe: "sukses", teks: "Terima kasih, rating Anda sudah tersimpan." });
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      if (status === 409) {
        setSudah(true);
        tandaiRatingLokal(id);
        setPesan({
          tipe: "sukses",
          teks: e instanceof Error ? e.message : "Perangkat ini sudah pernah memberi rating.",
        });
      } else {
        setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Rating gagal dikirim." });
      }
    } finally {
      setSibuk(false);
    }
  };

  if (!app) {
    return (
      <div className="px-4 pt-3">
        <p className="mt-4 rounded-2xl border border-dashed border-black/[0.14] bg-white p-5 text-[11px] text-ink-500">
          Memuat aplikasi…
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Seluruh isi halaman ikut menyesuaikan tombol A+ / A− di sisi kanan. */}
      <div
        data-testid="rinci-aplikasi"
        data-tingkat-ukuran={tingkat}
        className="pt-3"
        style={{ zoom: TINGKAT_UKURAN[tingkat] } as CSSProperties}
      >
        {/* Kepala seperti halaman aplikasi di Play Store */}
        <div className="flex items-start gap-3.5 px-4">
          <IkonAplikasi app={app} besar />
          <div className="min-w-0 flex-1">
            <h1 className="font-header text-[16px] leading-tight font-extrabold text-ink-900">
              {app.nama}
            </h1>
            <p className="mt-0.5 text-[11px] text-ink-500">
              {app.pengembang || "PC PERSIS Cibatu"}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Bintang nilai={app.rata} />
                <span className="text-[10px] font-bold text-ink-700">{app.rata || "—"}</span>
              </span>
              <span className="text-[10px] text-ink-400">{app.jumlahRating} rating</span>
              {app.versi ? <span className="text-[10px] text-ink-400">· v{app.versi}</span> : null}
              {app.berkasUkuran > 0 ? (
                <span className="text-[10px] text-ink-400">
                  · {ukuranTerbaca(app.berkasUkuran)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3.5 px-4">
          <Unduh app={app} penuh />
        </div>

        {/* Tangkapan layar — diketuk untuk dilihat lebih jelas */}
        {app.screenshot.length > 0 ? (
          <>
            <div className="no-scrollbar mt-3.5 flex gap-2 overflow-x-auto px-4 pb-1">
              {app.screenshot.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`screenshot-${s.id}`}
                  aria-label={`Perbesar tangkapan layar ${i + 1}`}
                  onClick={() => setDilihat(i)}
                  className="shrink-0 overflow-hidden rounded-xl border border-black/[0.08] transition active:scale-[0.98]"
                >
                  <img
                    src={s.url}
                    alt={`Tangkapan layar ${app.nama}`}
                    loading="lazy"
                    className="h-[190px] object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="mt-1.5 px-4 text-[9px] text-ink-400">
              Ketuk gambar untuk melihat lebih jelas.
            </p>
          </>
        ) : null}

        {/* Deskripsi + fitur */}
        <section className="mt-4 px-4">
          <h2 className="font-header text-[12.5px] font-extrabold text-ink-900">
            Tentang aplikasi ini
          </h2>
          {app.deskripsi && app.deskripsi.trim() ? (
            <BlokIsi
              teks={app.deskripsi}
              className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600"
            />
          ) : (
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-600">Belum ada keterangan.</p>
          )}

          {app.fitur.length > 0 ? (
            <>
              <h2 className="mt-3.5 font-header text-[12.5px] font-extrabold text-ink-900">
                Fitur
              </h2>
              <ul className="mt-1.5 space-y-1">
                {app.fitur.map((f, i) => (
                  <li
                    key={`${f}-${i}`}
                    className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-600"
                  >
                    <Icon name="check" className="mt-[2px] h-3.5 w-3.5 shrink-0 text-persis-800" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        {/* Info singkat */}
        <section className="mt-4 px-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-black/[0.08] bg-white p-3">
            <div>
              <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">
                Versi
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">{app.versi || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">
                Ukuran
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">
                {ukuranTerbaca(app.berkasUkuran) || "—"}
              </p>
            </div>
            <div data-testid="tanggal-update" className="col-span-2">
              <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">
                Tanggal Update
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">
                {app.diperbarui ? tanggalPanjang(app.diperbarui) : "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">
                Pengembang
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">
                {app.pengembang || "PC PERSIS Cibatu"}
              </p>
            </div>
          </div>
        </section>

        {/* Rating */}
        <section className="mt-4 px-4 pb-3">
          {sudah ? (
            <div
              data-testid="rating-sudah"
              className="rounded-2xl border border-mint-100 bg-mint-100/50 p-3.5"
            >
              <p className="text-[11.5px] font-bold text-persis-900">
                Terima kasih, rating Anda sudah tersimpan.
              </p>
              <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600">
                Satu perangkat hanya bisa memberi satu rating untuk tiap aplikasi, jadi borang
                penilaian tidak ditampilkan lagi. Rating Anda tetap terlihat pada daftar ulasan di
                bawah.
              </p>
              {pesan ? (
                <p
                  data-testid={`pesan-rating-${pesan.tipe}`}
                  className="mt-2 text-[10px] leading-relaxed text-ink-500"
                >
                  {pesan.teks}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <h2 className="font-header text-[12.5px] font-extrabold text-ink-900">Beri rating</h2>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-500">
                Ketuk bintangnya, lalu kirim. Nama boleh dikosongkan. Satu perangkat hanya bisa
                memberi satu rating.
              </p>

              <div className="mt-2 rounded-2xl border border-black/[0.08] bg-white p-3.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Beri ${n} bintang`}
                      data-testid={`bintang-${n}`}
                      onClick={() => setBintang(n)}
                      className="p-0.5 transition active:scale-95"
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7">
                        <path
                          d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"
                          fill={bintang >= n ? "#f4b740" : "#e4e8e5"}
                        />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-1 text-[11px] font-semibold text-ink-600">
                    {bintang > 0 ? `${bintang} bintang` : "Pilih bintang"}
                  </span>
                </div>

                <input
                  type="text"
                  data-testid="rating-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  maxLength={60}
                  placeholder="Nama (boleh dikosongkan)"
                  className="mt-2.5 w-full rounded-xl border border-black/[0.10] bg-white px-3 py-2 text-[11.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
                />
                <textarea
                  data-testid="rating-ulasan"
                  value={ulasan}
                  onChange={(e) => setUlasan(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Ulasan singkat tentang aplikasi ini…"
                  className="mt-2 w-full resize-none rounded-xl border border-black/[0.10] bg-white px-3 py-2 text-[11.5px] leading-relaxed text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
                />

                {pesan ? (
                  <p
                    data-testid={`pesan-rating-${pesan.tipe}`}
                    className={`mt-2 rounded-xl border px-3 py-2 text-[10.5px] leading-relaxed ${
                      pesan.tipe === "sukses"
                        ? "border-mint-100 bg-mint-100/60 text-persis-900"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {pesan.teks}
                  </p>
                ) : null}

                <button
                  type="button"
                  data-testid="kirim-rating"
                  onClick={() => void kirim()}
                  disabled={sibuk}
                  className="mt-2.5 w-full rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {sibuk ? "Mengirim…" : "Kirim rating"}
                </button>
              </div>
            </>
          )}

          {rating.length > 0 ? (
            <>
              <h2 className="mt-4 font-header text-[12.5px] font-extrabold text-ink-900">
                Ulasan jama'ah
              </h2>
              <ul className="mt-2 space-y-2">
                {rating.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-black/[0.08] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-bold text-ink-900">
                        {r.nama || "Jama'ah"}
                      </p>
                      <Bintang nilai={r.nilai} ukuran="h-3 w-3" />
                    </div>
                    {r.ulasan ? (
                      <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600 whitespace-pre-line">
                        {r.ulasan}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-black/[0.14] px-3.5 py-3 text-[10.5px] text-ink-500">
              Belum ada ulasan. Jadilah yang pertama memberi rating.
            </p>
          )}

          <p className="mt-4 pb-2 text-justify text-[9.5px] leading-relaxed text-ink-400">
            Aplikasi berformat APK untuk Android. Bila muncul peringatan saat memasang, izinkan
            pemasangan dari sumber ini pada pengaturan peramban atau berkas di HP Anda.
          </p>
        </section>
      </div>

      <PengaturUkuran tingkat={tingkat} onUbah={ubahTingkat} />

      {dilihat !== null && app.screenshot[dilihat] ? (
        <LihatGambar
          daftar={app.screenshot}
          awal={dilihat}
          nama={app.nama}
          onTutup={() => setDilihat(null)}
        />
      ) : null}
    </>
  );
}
