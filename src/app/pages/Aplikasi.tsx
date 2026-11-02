import { useEffect, useState } from "react";
import { Icon } from "../components/Icons";
import { BlokIsi } from "../components/IsiKaya";
import {
  ambilAplikasiSatu,
  kirimRating,
  segarkanAplikasi,
  ukuranTerbaca,
  useAplikasi,
  type AplikasiItem,
  type RatingAplikasi,
} from "../lib/aplikasi";

/**
 * Halaman pengunjung "Download Aplikasi" — daftar aplikasi Android lembaga
 * dengan tampilan seperti Play Store: ikon, nama, pengembang, bintang, ukuran,
 * halaman rinci berisi tangkapan layar, fitur, dan unduhan.
 */

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
  const kelas = besar ? "h-[64px] w-[64px] rounded-[16px] text-[24px]" : "h-12 w-12 rounded-[13px] text-[17px]";
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

  useEffect(() => {
    let hidup = true;
    void ambilAplikasiSatu(id)
      .then((j) => {
        if (!hidup) return;
        setApp(j.aplikasi);
        setRating(j.rating);
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
      setPesan({ tipe: "sukses", teks: "Terima kasih, rating Anda sudah tersimpan." });
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Rating gagal dikirim." });
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
    <div data-testid="rinci-aplikasi" className="pt-3">
      {/* Kepala seperti halaman aplikasi di Play Store */}
      <div className="flex items-start gap-3.5 px-4">
        <IkonAplikasi app={app} besar />
        <div className="min-w-0 flex-1">
          <h1 className="font-header text-[16px] leading-tight font-extrabold text-ink-900">{app.nama}</h1>
          <p className="mt-0.5 text-[11px] text-ink-500">{app.pengembang || "PC PERSIS Cibatu"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Bintang nilai={app.rata} />
              <span className="text-[10px] font-bold text-ink-700">{app.rata || "—"}</span>
            </span>
            <span className="text-[10px] text-ink-400">{app.jumlahRating} rating</span>
            {app.versi ? <span className="text-[10px] text-ink-400">· v{app.versi}</span> : null}
            {app.berkasUkuran > 0 ? (
              <span className="text-[10px] text-ink-400">· {ukuranTerbaca(app.berkasUkuran)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3.5 px-4">
        <Unduh app={app} penuh />
      </div>

      {/* Tangkapan layar */}
      {app.screenshot.length > 0 ? (
        <div className="no-scrollbar mt-3.5 flex gap-2 overflow-x-auto px-4 pb-1">
          {app.screenshot.map((s) => (
            <img
              key={s.id}
              src={s.url}
              alt={`Tangkapan layar ${app.nama}`}
              loading="lazy"
              className="h-[190px] shrink-0 rounded-xl border border-black/[0.08] object-cover"
            />
          ))}
        </div>
      ) : null}

      {/* Deskripsi + fitur */}
      <section className="mt-4 px-4">
        <h2 className="font-header text-[12.5px] font-extrabold text-ink-900">Tentang aplikasi ini</h2>
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
            <h2 className="mt-3.5 font-header text-[12.5px] font-extrabold text-ink-900">Fitur</h2>
            <ul className="mt-1.5 space-y-1">
              {app.fitur.map((f, i) => (
                <li key={`${f}-${i}`} className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-600">
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
            <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">Versi</p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">{app.versi || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">Ukuran</p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">
              {ukuranTerbaca(app.berkasUkuran) || "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] font-extrabold tracking-[0.12em] text-ink-400 uppercase">Pengembang</p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-ink-900">{app.pengembang || "PC PERSIS Cibatu"}</p>
          </div>
        </div>
      </section>

      {/* Rating */}
      <section className="mt-4 px-4 pb-3">
        <h2 className="font-header text-[12.5px] font-extrabold text-ink-900">Beri rating</h2>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-500">
          Ketuk bintangnya, lalu kirim. Nama boleh dikosongkan.
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

        {rating.length > 0 ? (
          <>
            <h2 className="mt-4 font-header text-[12.5px] font-extrabold text-ink-900">Ulasan jama'ah</h2>
            <ul className="mt-2 space-y-2">
              {rating.map((r) => (
                <li key={r.id} className="rounded-2xl border border-black/[0.08] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-bold text-ink-900">{r.nama || "Jama'ah"}</p>
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
          Aplikasi berformat APK untuk Android. Bila muncul peringatan saat memasang, izinkan pemasangan dari sumber
          ini pada pengaturan peramban atau berkas di HP Anda.
        </p>
      </section>
    </div>
  );
}
