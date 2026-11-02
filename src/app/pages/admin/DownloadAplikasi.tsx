import { useEffect, useRef, useState } from "react";
import {
  AreaTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Sakelar,
  TombolIkon,
  TombolSimpan,
} from "../../components/admin/Form";
import PilihGambar from "../../components/admin/PilihGambar";
import { Icon } from "../../components/Icons";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { unggahBerkas } from "../../lib/admin";
import {
  ambilAplikasiAdmin,
  hapusAplikasi,
  hapusScreenshotAplikasi,
  segarkanAplikasi,
  tambahAplikasi,
  tambahScreenshotAplikasi,
  ubahAplikasi,
  ukuranTerbaca,
  unggahApk,
  type AplikasiItem,
} from "../../lib/aplikasi";

/**
 * Panel admin "Download Aplikasi": mengelola daftar aplikasi Android lembaga —
 * nama, versi, pengembang, deskripsi, fitur, tangkapan layar, dan berkas APK.
 */

type Isian = {
  nama: string;
  versi: string;
  pengembang: string;
  deskripsi: string;
  /** Satu baris satu fitur. */
  fitur: string;
  ikon_url: string;
  berkas_url: string;
  berkas_nama: string;
  berkas_ukuran: number;
  aktif: boolean;
};

const ISIAN_KOSONG: Isian = {
  nama: "",
  versi: "",
  pengembang: "",
  deskripsi: "",
  fitur: "",
  ikon_url: "",
  berkas_url: "",
  berkas_nama: "",
  berkas_ukuran: 0,
  aktif: true,
};

function isianDari(a: AplikasiItem): Isian {
  return {
    nama: a.nama,
    versi: a.versi,
    pengembang: a.pengembang,
    deskripsi: a.deskripsi,
    fitur: (a.fitur ?? []).join("\n"),
    ikon_url: a.ikon,
    berkas_url: a.berkasUrl,
    berkas_nama: a.berkasNama,
    berkas_ukuran: a.berkasUkuran,
    aktif: a.aktif,
  };
}

/** Bintang 1–5 untuk ringkasan rating di daftar admin. */
function Bintang({ nilai }: { nilai: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`Rating ${nilai} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3">
          <path
            d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"
            fill={nilai >= n - 0.25 ? "#f4b740" : "#e2e6e3"}
          />
        </svg>
      ))}
    </span>
  );
}

export function DaftarAplikasi() {
  const [daftar, setDaftar] = useState<AplikasiItem[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [sunting, setSunting] = useState<{ id: string | null; isian: Isian } | null>(null);
  const { sibuk, pesan, jalankan } = pakaiSimpan();

  const ambilUlang = async () => {
    try {
      const j = await ambilAplikasiAdmin();
      setDaftar(j.aplikasi ?? []);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar aplikasi tidak bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    void ambilUlang();
  }, []);

  /* ------------------------------- daftar ------------------------------- */

  if (!sunting) {
    return (
      <div data-testid="admin-aplikasi-daftar">
        <KepalaBorang
          judul="Download Aplikasi"
          keterangan="Aplikasi Android lembaga yang bisa diunduh jama'ah dari situs. Unggah berkas APK, isi keterangan, lalu aktifkan."
          aksi={
            <button
              type="button"
              data-testid="tambah-aplikasi"
              onClick={() => setSunting({ id: null, isian: { ...ISIAN_KOSONG } })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-persis-900 px-3.5 py-2 text-[11px] font-semibold text-white transition active:scale-[0.98]"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              Tambah
            </button>
          }
        />

        {galat ? <Pesan tipe="galat" teks={galat} /> : null}

        {memuat ? (
          <p className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4 text-[11.5px] text-ink-500">
            Memuat daftar aplikasi…
          </p>
        ) : daftar.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/[0.14] bg-white p-5 text-center">
            <Icon name="newspaper" className="mx-auto h-7 w-7 text-ink-400" />
            <p className="mt-2 text-[12px] font-semibold text-ink-900">Belum ada aplikasi</p>
            <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-500">
              Tekan “Tambah” untuk memasukkan aplikasi pertama: nama, berkas APK, keterangan, fitur, tangkapan layar,
              pengembang, dan versi.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {daftar.map((a) => (
              <li
                key={a.id}
                data-testid={`baris-aplikasi-${a.id}`}
                className="rounded-2xl border border-black/[0.08] bg-white p-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-persis-900/8 text-[15px] font-extrabold text-persis-900">
                    {a.ikon ? (
                      <img src={a.ikon} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (a.nama || "A").trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-extrabold text-ink-900">{a.nama}</p>
                    <p className="mt-0.5 truncate text-[10.5px] text-ink-500">
                      {[a.pengembang || "—", a.versi ? `versi ${a.versi}` : null].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Bintang nilai={a.rata} />
                      <span className="text-[10px] font-semibold text-ink-500">
                        {a.jumlahRating > 0 ? `${a.rata} · ${a.jumlahRating} rating` : "Belum ada rating"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <TombolIkon
                      nama="pencil"
                      label="Ubah aplikasi"
                      testid={`ubah-aplikasi-${a.id}`}
                      onClick={() => setSunting({ id: a.id, isian: isianDari(a) })}
                    />
                    <TombolIkon
                      nama="trash"
                      label="Hapus aplikasi"
                      bahaya
                      testid={`hapus-aplikasi-${a.id}`}
                      onClick={async () => {
                        const ya = await mintaKonfirmasi(
                          `Hapus aplikasi “${a.nama}” beserta tangkapan layar dan ratingnya?`,
                        );
                        if (!ya) return;
                        await jalankan(async () => {
                          await hapusAplikasi(a.id);
                          await ambilUlang();
                          await segarkanAplikasi();
                        }, "Aplikasi dihapus.");
                      }}
                    />
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9.5px] font-semibold">
                  <span
                    className={`rounded-full px-2 py-[3px] ${
                      a.aktif ? "bg-mint-100 text-persis-900" : "bg-cream-100 text-ink-500"
                    }`}
                  >
                    {a.aktif ? "Tampil di situs" : "Disembunyikan"}
                  </span>
                  <span className="rounded-full bg-cream-50 px-2 py-[3px] text-ink-500">
                    {a.screenshot.length} tangkapan layar
                  </span>
                  <span className="rounded-full bg-cream-50 px-2 py-[3px] text-ink-500">
                    {a.berkasUrl ? `APK ${ukuranTerbaca(a.berkasUkuran) || "siap"}` : "APK belum ada"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* -------------------------------- borang -------------------------------- */

  return (
    <BorangAplikasi
      id={sunting.id}
      awal={sunting.isian}
      sibuk={sibuk}
      pesan={pesan}
      onBatal={() => setSunting(null)}
      onSelesai={async () => {
        setSunting(null);
        await ambilUlang();
        await segarkanAplikasi();
      }}
    />
  );
}

function BorangAplikasi({
  id,
  awal,
  sibuk,
  pesan,
  onBatal,
  onSelesai,
}: {
  id: string | null;
  awal: Isian;
  sibuk: boolean;
  pesan: { tipe: "sukses" | "galat"; teks: string } | null;
  onBatal: () => void;
  onSelesai: () => Promise<void>;
}) {
  const [isian, setIsian] = useState<Isian>(awal);
  const [progres, setProgres] = useState<number | null>(null);
  const [galatBerkas, setGalatBerkas] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<{ id: string; url: string }[]>([]);
  const [sibukGambar, setSibukGambar] = useState(false);
  const apkRef = useRef<HTMLInputElement | null>(null);
  const ssRef = useRef<HTMLInputElement | null>(null);
  const { jalankan } = pakaiSimpan();

  /* Aplikasi yang sudah tersimpan: tangkapan layarnya diambil dari server. */
  useEffect(() => {
    if (!id) return;
    void ambilAplikasiAdmin()
      .then((j) => {
        const a = (j.aplikasi ?? []).find((x) => x.id === id);
        if (a) setScreenshot(a.screenshot);
      })
      .catch(() => undefined);
  }, [id]);

  const ubah = <K extends keyof Isian>(kunci: K, nilai: Isian[K]) =>
    setIsian((v) => ({ ...v, [kunci]: nilai }));

  const pilihApk = async (berkas: File | undefined) => {
    if (!berkas) return;
    setGalatBerkas(null);
    if (!/\.apk$/i.test(berkas.name) && berkas.type !== "application/vnd.android.package-archive") {
      setGalatBerkas("Pilih berkas berakhiran .apk.");
      return;
    }
    setProgres(0);
    try {
      const hasil = await unggahApk(berkas, setProgres);
      setIsian((v) => ({
        ...v,
        berkas_url: hasil.url,
        berkas_nama: hasil.nama,
        berkas_ukuran: hasil.ukuran,
      }));
      beritahu("sukses", "Berkas APK terunggah.");
    } catch (e) {
      setGalatBerkas(e instanceof Error ? e.message : "Berkas APK gagal diunggah.");
    } finally {
      setProgres(null);
      if (apkRef.current) apkRef.current.value = "";
    }
  };

  const pilihScreenshot = async (daftar: FileList | null) => {
    if (!daftar || daftar.length === 0) return;
    if (!id) {
      setGalatBerkas("Simpan aplikasinya dulu, lalu tambahkan tangkapan layar.");
      return;
    }
    setGalatBerkas(null);
    setSibukGambar(true);
    try {
      for (const berkas of Array.from(daftar).slice(0, 10)) {
        const media = await unggahBerkas(berkas, "aplikasi");
        const j = await tambahScreenshotAplikasi(id, media.url);
        const a = (j.aplikasi ?? []).find((x) => x.id === id);
        if (a) setScreenshot(a.screenshot);
      }
      beritahu("sukses", "Tangkapan layar ditambahkan.");
    } catch (e) {
      setGalatBerkas(e instanceof Error ? e.message : "Tangkapan layar gagal diunggah.");
    } finally {
      setSibukGambar(false);
      if (ssRef.current) ssRef.current.value = "";
    }
  };

  const simpan = () =>
    jalankan(async () => {
      const kiriman = {
        nama: isian.nama,
        versi: isian.versi,
        pengembang: isian.pengembang,
        deskripsi: isian.deskripsi,
        fitur: isian.fitur,
        ikon_url: isian.ikon_url,
        berkas_url: isian.berkas_url,
        berkas_nama: isian.berkas_nama,
        berkas_ukuran: isian.berkas_ukuran,
        aktif: isian.aktif,
      };
      if (id) await ubahAplikasi(id, kiriman);
      else await tambahAplikasi(kiriman);
      await onSelesai();
    }, id ? "Perubahan aplikasi tersimpan." : "Aplikasi ditambahkan.");

  return (
    <div data-testid="admin-aplikasi-borang">
      <KepalaBorang
        judul={id ? "Ubah Aplikasi" : "Aplikasi Baru"}
        keterangan="Isi keterangan aplikasi seperti yang akan dilihat jama'ah di halaman Download Aplikasi."
        aksi={
          <button
            type="button"
            data-testid="kembali-aplikasi"
            onClick={onBatal}
            className="shrink-0 rounded-full border border-black/[0.10] bg-white px-3 py-2 text-[11px] font-semibold text-ink-700"
          >
            Kembali
          </button>
        }
      />

      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="aplikasi-nama"
          label="Nama aplikasi"
          nilai={isian.nama}
          onUbah={(v) => ubah("nama", v)}
          placeholder="PERSIS Cibatu"
          maks={160}
        />
        <Kolom
          testid="aplikasi-versi"
          label="Versi aplikasi"
          nilai={isian.versi}
          onUbah={(v) => ubah("versi", v)}
          placeholder="1.0.0"
          maks={40}
        />
        <Kolom
          testid="aplikasi-pengembang"
          label="Pengembang"
          nilai={isian.pengembang}
          onUbah={(v) => ubah("pengembang", v)}
          placeholder="PC PERSIS Cibatu"
          maks={160}
          petunjuk="Tampil di bawah nama aplikasi, seperti nama pengembang di Play Store."
        />
        <AreaTeks
          testid="aplikasi-deskripsi"
          label="Deskripsi aplikasi"
          nilai={isian.deskripsi}
          onUbah={(v) => ubah("deskripsi", v)}
          baris={5}
          placeholder="Aplikasi resmi PC PERSIS Cibatu untuk jama'ah…"
        />
        <AreaTeks
          testid="aplikasi-fitur"
          label="Fitur-fitur aplikasi"
          nilai={isian.fitur}
          onUbah={(v) => ubah("fitur", v)}
          baris={5}
          petunjuk="Satu fitur satu baris. Contoh: Jadwal kajian · Info SPMB · Portal wali santri."
        />
        <PilihGambar
          testid="aplikasi-ikon"
          label="Ikon aplikasi"
          petunjuk="Kotak kecil di samping nama aplikasi. Sebaiknya gambar persegi (mis. 512 × 512)."
          nilai={isian.ikon_url}
          onUbah={(g) => ubah("ikon_url", g.url)}
          rasio="h-[92px]"
          bentuk="persegi"
          folder="aplikasi"
        />
        <Sakelar
          testid="aplikasi-aktif"
          label="Tampilkan di halaman Download Aplikasi"
          nilai={isian.aktif}
          onUbah={(v) => ubah("aktif", v)}
          petunjuk="Bila dimatikan, aplikasi tetap tersimpan di panel tetapi tidak tampil di situs."
        />
      </div>

      {/* ------------------------------ berkas APK ------------------------------ */}
      <div className="mt-3 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div>
          <h2 className="font-header text-[13px] font-bold text-ink-900">Berkas aplikasi (APK)</h2>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-500">
            Unggah berkas .apk (maksimal 100 MB), atau tempelkan tautan bila berkasnya disimpan di tempat lain.
          </p>
        </div>

        {galatBerkas ? <Pesan tipe="galat" teks={galatBerkas} /> : null}

        <div className="rounded-xl border border-black/[0.08] bg-cream-50/60 px-3.5 py-2.5">
          <p className="text-[11px] font-semibold text-ink-900">
            {isian.berkas_url ? isian.berkas_nama || "Berkas APK tersimpan" : "Belum ada berkas APK"}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-500">
            {isian.berkas_url
              ? [ukuranTerbaca(isian.berkas_ukuran), isian.berkas_url].filter(Boolean).join(" · ")
              : "Pengunjung belum bisa mengunduh sebelum berkas atau tautan diisi."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="pilih-apk"
            onClick={() => apkRef.current?.click()}
            disabled={progres !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-persis-900 px-3.5 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
          >
            <Icon name="chevron" className="h-3.5 w-3.5 rotate-90" />
            {progres === null ? "Unggah berkas APK" : `Mengunggah ${progres}%`}
          </button>
          {isian.berkas_url ? (
            <button
              type="button"
              data-testid="hapus-apk"
              onClick={() =>
                setIsian((v) => ({ ...v, berkas_url: "", berkas_nama: "", berkas_ukuran: 0 }))
              }
              className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11px] font-semibold text-rose-600"
            >
              Lepas berkas
            </button>
          ) : null}
          <input
            ref={apkRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            className="hidden"
            onChange={(e) => void pilihApk(e.target.files?.[0])}
          />
        </div>

        {progres !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
            <div className="h-full rounded-full bg-persis-900 transition-all" style={{ width: `${progres}%` }} />
          </div>
        ) : null}

        <Kolom
          testid="aplikasi-tautan-apk"
          label="Atau tautan berkas APK"
          nilai={isian.berkas_url}
          onUbah={(v) => ubah("berkas_url", v)}
          placeholder="https://…/aplikasi-persis.apk"
          petunjuk="Diisi otomatis bila Anda mengunggah berkas. Bisa juga ditempel manual."
        />
      </div>

      {/* --------------------------- tangkapan layar --------------------------- */}
      <div className="mt-3 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div>
          <h2 className="font-header text-[13px] font-bold text-ink-900">Tangkapan layar aplikasi</h2>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-500">
            Tampil berjajar seperti galeri Play Store. Boleh beberapa sekaligus.
          </p>
        </div>

        {screenshot.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/[0.14] px-3.5 py-3 text-[10.5px] text-ink-500">
            {id
              ? "Belum ada tangkapan layar."
              : "Simpan aplikasinya lebih dulu, lalu kembali ke sini untuk menambah tangkapan layar."}
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {screenshot.map((s) => (
              <li key={s.id} className="relative overflow-hidden rounded-xl bg-cream-50">
                <img src={s.url} alt="" className="h-[96px] w-full object-cover" />
                <button
                  type="button"
                  aria-label="Hapus tangkapan layar"
                  data-testid={`hapus-screenshot-${s.id}`}
                  onClick={async () => {
                    if (!id) return;
                    const j = await hapusScreenshotAplikasi(id, s.id);
                    const a = (j.aplikasi ?? []).find((x) => x.id === id);
                    if (a) setScreenshot(a.screenshot);
                    beritahu("sukses", "Tangkapan layar dihapus.");
                  }}
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white"
                >
                  <Icon name="x" className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <button
            type="button"
            data-testid="pilih-screenshot"
            disabled={!id || sibukGambar}
            onClick={() => ssRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.10] bg-white px-3.5 py-2 text-[11px] font-semibold text-persis-900 disabled:opacity-50"
          >
            <Icon name="image" className="h-3.5 w-3.5" />
            {sibukGambar ? "Mengunggah…" : "Tambah tangkapan layar"}
          </button>
          <input
            ref={ssRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void pilihScreenshot(e.target.files)}
          />
        </div>
      </div>

      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-aplikasi"
          sibuk={sibuk}
          nonaktif={!isian.nama.trim()}
          label={id ? "Simpan perubahan" : "Simpan aplikasi"}
          onClick={() => void simpan()}
        />
      </div>
    </div>
  );
}
