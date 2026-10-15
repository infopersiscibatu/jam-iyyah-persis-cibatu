import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { angkaRingkas, rupiah, rupiahSingkat } from "../../lib/format";
import { useIstilah } from "../../lib/istilah";
import { useProfil } from "../../lib/profil";
import { useSesiUnit } from "../../lib/sesiUnit";
import {
  daftarLaporanTU,
  laporanKategoriTU,
  type JawabanLaporan,
  type PilihanLaporan,
  type StatusSelLaporan,
} from "../../lib/unitTataUsaha";

/**
 * Menu Laporan Admin Tata Usaha.
 *
 * Petugas memilih dahulu laporan mana yang mau dilihat — satu jenis tagihan, misalnya
 * SPP Bulanan, UKT Semester, atau Almamater — baru tabel laporannya ditampilkan.
 * Kolom bulan, total lunas, dan sisa tunggakan bisa digeser mendatar bersama-sama,
 * sedangkan kolom nama tetap di tempat supaya namanya tidak pernah hilang dari
 * pandangan.
 *
 * Sel tabel ditandai ✓ bila sudah dibayar, X bila belum dibayar, dan – bila bulannya
 * belum ditagihkan. Nominal tiap sel terlihat saat kursor diarahkan ke selnya (atau
 * ditekan lama di HP), sedangkan angkanya tampil pada kolom Total lunas dan Sisa
 * tunggakan. Barisnya diurutkan menurut nama A–Z.
 *
 * Isi tabel yang sedang tampil bisa diunduh sebagai PDF atau Excel; tampilan kedua
 * berkas itu mengikuti tabel di layar.
 */

/** Tanda sel: ✓ sudah dibayar, X belum dibayar, – belum ditagihkan. */
const HURUF_SEL: Record<StatusSelLaporan, string> = {
  lunas: "✓",
  menunggu: "✓",
  belum: "X",
  kosong: "–",
};

const KELAS_SEL: Record<StatusSelLaporan, string> = {
  lunas: "bg-mint-100 font-bold text-persis-900",
  /* Sudah dibayar tetapi buktinya belum diperiksa bendahara: tetap ceklis, warnanya berbeda. */
  menunggu: "bg-pastelgold font-bold text-gold-700",
  belum: "bg-pastelrose font-bold text-rose-700",
  kosong: "text-ink-400",
};

const LABEL_SEL: Record<StatusSelLaporan, string> = {
  lunas: "sudah dibayar",
  menunggu: "sudah dibayar, menunggu verifikasi",
  belum: "belum dibayar",
  kosong: "belum ditagihkan",
};

const LABEL_PESERTA: Record<string, string> = {
  aktif: "Aktif",
  calon: "Calon",
  lulus: "Lulus",
  pindah: "Pindah",
  nonaktif: "Tidak aktif",
};

const SARING = [
  { id: "aktif" as const, label: "Aktif" },
  { id: "semua" as const, label: "Semua nama" },
];

const TEBAL_NAMA = "shadow-[6px_0_6px_-6px_rgba(6,36,25,0.22)]";

export default function LaporanTagihan() {
  const istilah = useIstilah();
  /* Nama unit, logo, dan wilayah dipakai di kepala berkas PDF dan Excel. */
  const { sesi } = useSesiUnit();
  const { identitas } = useProfil();

  /* Daftar laporan yang bisa dipilih. */
  const [pilihan, setPilihan] = useState<PilihanLaporan[]>([]);
  const [memuatPilihan, setMemuatPilihan] = useState(true);
  const [galatPilihan, setGalatPilihan] = useState<string | null>(null);

  /* Laporan yang sedang dibuka. */
  const [dipilih, setDipilih] = useState<PilihanLaporan | null>(null);
  const [laporan, setLaporan] = useState<JawabanLaporan | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [tahun, setTahun] = useState<number | null>(null);
  const [saring, setSaring] = useState<"aktif" | "semua">("aktif");
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [sibuk, setSibuk] = useState<"excel" | "pdf" | null>(null);
  const [galatEkspor, setGalatEkspor] = useState<string | null>(null);

  const muatPilihan = useCallback(async () => {
    setMemuatPilihan(true);
    try {
      const jawab = await daftarLaporanTU();
      setPilihan(jawab.laporan);
      setGalatPilihan(null);
    } catch (e) {
      setGalatPilihan(e instanceof Error ? e.message : "Daftar laporan belum bisa dimuat.");
    } finally {
      setMemuatPilihan(false);
    }
  }, []);

  useEffect(() => {
    void muatPilihan();
  }, [muatPilihan]);

  const muatLaporan = useCallback(async () => {
    if (!dipilih) return;
    setMemuat(true);
    try {
      const jawab = await laporanKategoriTU(dipilih.id, { tahun: tahun ?? undefined, cari: kataKunci, saring });
      setLaporan(jawab);
      setGalat(null);
      /* Tahun yang dipakai layanan dicatat, supaya tahun pada pemilih ikut menyesuaikan. */
      setTahun((lama) => (lama === jawab.tahun ? lama : jawab.tahun));
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Laporan belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, [dipilih, tahun, kataKunci, saring]);

  useEffect(() => {
    void muatLaporan();
  }, [muatLaporan]);

  /* Pencarian ditahan sesaat supaya tidak meminta data setiap ketukan. */
  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  const buka = (p: PilihanLaporan) => {
    setDipilih(p);
    setLaporan(null);
    setTahun(null);
    setSaring("aktif");
    setCari("");
    setKataKunci("");
    setGalat(null);
  };

  const tutup = () => {
    setDipilih(null);
    setLaporan(null);
    setGalat(null);
    setGalatEkspor(null);
  };

  /* ------------------------- unduh isi tabel yang tampil ------------------------- */

  const ekspor = async (jenis: "excel" | "pdf") => {
    if (!laporan || laporan.baris.length === 0 || sibuk) return;
    setSibuk(jenis);
    setGalatEkspor(null);
    try {
      /* Pustaka ekspornya baru diambil saat tombolnya benar-benar ditekan. */
      const { unduhLaporanExcel, unduhLaporanPdf } = await import("../../lib/eksporLaporan");
      const opsi = {
        judul: dipilih?.nama ?? laporan.kategori.nama,
        unit: sesi?.unit?.nama ?? "PC PERSIS Cibatu",
        keterangan: kataKunci ? `disaring “${kataKunci}”` : undefined,
        /* Kop berkas: logo dan nama badan dari identitas situs. */
        logo: identitas.logo,
        badan: "PC PERSIS Cibatu",
        wilayah: identitas.wilayahLengkap,
      };
      if (jenis === "excel") await unduhLaporanExcel(laporan, opsi);
      else await unduhLaporanPdf(laporan, opsi);
    } catch (e) {
      setGalatEkspor(e instanceof Error ? e.message : "Berkasnya belum bisa dibuat. Coba lagi sebentar.");
    } finally {
      setSibuk(null);
    }
  };

  /* ------------------------- memilih laporan lebih dahulu ------------------------- */

  if (!dipilih) {
    return (
      <section data-testid="tu-laporan" className="mt-4">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <KepalaKartu
            judul="Laporan tagihan"
            keterangan={`Pilih dahulu laporan mana yang mau dilihat. Tiap laporan berisi satu jenis tagihan — misalnya ${istilah.iuran} Bulanan, UKT Semester, atau Almamater — lengkap dengan kolom bulan, total lunas, dan sisa tunggakan tiap ${istilah.sebutanKecil}.`}
            angka={pilihan.length}
            labelAngka="laporan"
            testidAngka="tu-laporan-jumlah"
          />

          {memuatPilihan && pilihan.length === 0 ? (
            <p className="mt-3 text-[11px] text-ink-400">Memuat daftar laporan…</p>
          ) : galatPilihan ? (
            <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galatPilihan}</p>
          ) : pilihan.length === 0 ? (
            <p data-testid="tu-laporan-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
              Belum ada laporan yang bisa dibuka pada {istilah.unit} ini. Buat dahulu kategori tagihannya di menu
              Kategori — misalnya {istilah.iuran} Bulanan atau Almamater — lalu tagihannya di menu Tagihan{" "}
              {istilah.iuran}.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pilihan.map((p) => (
                <li key={p.id} data-testid={`tu-laporan-pilih-${p.id}`}>
                  <button
                    type="button"
                    onClick={() => buka(p)}
                    className="flex w-full items-stretch gap-1.5 rounded-xl border border-black/[0.08] bg-white text-left transition hover:bg-cream-50/70"
                  >
                    <span className="min-w-0 flex-1 px-3.5 py-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11.5px] leading-snug font-semibold text-ink-900">{p.nama}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            p.tipe === "bulanan" ? "bg-pastelgold text-gold-700" : "bg-cream-100 text-ink-600"
                          }`}
                        >
                          {p.tipe === "bulanan" ? "Bulanan" : "Sekali bayar"}
                        </span>
                        {p.aktif ? null : (
                          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[9px] font-bold text-ink-600">
                            Tidak aktif
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[10.5px] font-semibold text-persis-900">
                        {p.nominal > 0
                          ? `${rupiah(p.nominal)}${p.tipe === "bulanan" ? " per bulan" : " sekali bayar"}`
                          : "nominal belum ditentukan"}
                      </span>
                      {p.keterangan ? (
                        <span className="mt-0.5 block text-justify text-[10px] leading-snug text-ink-400">
                          {p.keterangan}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[9.5px] text-ink-400">
                        {p.jumlah > 0
                          ? `${p.murid} ${istilah.sebutanKecil} · ${p.jumlah} tagihan · ${rupiah(p.nilai)}`
                          : `belum ada tagihan pada ${istilah.sebutanKecil}`}
                      </span>
                      {p.belum > 0 ? (
                        <span className="mt-0.5 block text-[9.5px] font-semibold text-rose-700">
                          belum lunas {rupiah(p.belum)}
                        </span>
                      ) : null}
                    </span>
                    <span className="grid w-9 shrink-0 place-items-center rounded-r-xl border-l border-black/[0.07] text-persis-900">
                      <Icon name="chevron-right" className="h-[15px] w-[15px]" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  /* --------------------------------- tabel laporan -------------------------------- */

  const kolom = laporan?.kolom ?? [];
  const baris = laporan?.baris ?? [];
  /* Kategori bulanan memakai kolom bulan; sekali bayar memakai kolom tahun. */
  const satuanKolom = laporan && !laporan.bulanan ? "tahun" : "bulan";
  const jumlahSel = new Map((laporan?.kolomJumlah ?? []).map((j) => [j.kunci, j]));
  const ringkasan = laporan?.ringkasan;

  return (
    <section data-testid="tu-laporan" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="tu-laporan-kembali"
            onClick={tutup}
            className="inline-flex items-center gap-1 rounded-full border border-black/[0.1] px-2.5 py-1.5 text-[10px] font-semibold text-persis-900"
          >
            <Icon name="chevron-right" className="h-[12px] w-[12px] rotate-180" />
            Ganti laporan
          </button>

          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="tu-laporan-unduh-pdf"
              onClick={() => void ekspor("pdf")}
              disabled={!laporan || laporan.baris.length === 0 || sibuk !== null}
              className="rounded-full bg-persis-900 px-3 py-1.5 text-[10px] font-bold text-white transition disabled:opacity-45"
            >
              {sibuk === "pdf" ? "Menyiapkan PDF…" : "Unduh PDF"}
            </button>
            <button
              type="button"
              data-testid="tu-laporan-unduh-excel"
              onClick={() => void ekspor("excel")}
              disabled={!laporan || laporan.baris.length === 0 || sibuk !== null}
              className="rounded-full border border-persis-900/25 px-3 py-1.5 text-[10px] font-bold text-persis-900 transition disabled:opacity-45"
            >
              {sibuk === "excel" ? "Menyiapkan Excel…" : "Unduh Excel"}
            </button>
          </span>
        </div>

        {galatEkspor ? <p className="mt-1.5 text-[10px] text-rose-700">{galatEkspor}</p> : null}

        <h2 className="mt-2.5 font-header text-[14px] leading-tight font-extrabold text-ink-900">{dipilih.nama}</h2>
        <p className="mt-1 text-[10px] text-ink-400">
          {dipilih.tipe === "bulanan" ? `Tagihan bulanan${laporan?.bulanan ? ` · tahun ${laporan.tahun}` : ""}` : "Sekali bayar"}
          {dipilih.nominal > 0 ? ` · ${rupiah(dipilih.nominal)}${dipilih.tipe === "bulanan" ? " per bulan" : ""}` : ""}
          {dipilih.tipe === "bulanan" ? "" : ` · tahun ${laporan?.tahun ?? ""}`}
        </p>

        {/* Pemilih tahun: hanya perlu bila tagihannya sudah lebih dari satu tahun. */}
        {laporan?.bulanan && laporan.tahunPilihan.length > 1 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Tahun</span>
            {laporan.tahunPilihan.map((th) => (
              <button
                key={th}
                type="button"
                data-testid={`tu-laporan-tahun-${th}`}
                onClick={() => setTahun(th)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  laporan.tahun === th ? "bg-persis-900 text-white" : "border border-black/[0.1] text-persis-900"
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-2.5 space-y-2">
          <input
            type="search"
            data-testid="tu-laporan-cari"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={`Cari nama ${istilah.sebutanKecil} atau kelas…`}
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {SARING.map((s) => (
              <button
                key={s.id}
                type="button"
                data-testid={`tu-laporan-saring-${s.id}`}
                onClick={() => setSaring(s.id)}
                className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                  saring === s.id ? "bg-persis-900 text-white" : "border border-black/[0.1] text-persis-900"
                }`}
              >
                {s.label}
              </button>
            ))}
            {laporan ? (
              <span className="ml-auto text-[10px] text-ink-400">
                {laporan.ringkasan.peserta} {laporan.sebutan} · {laporan.ringkasan.menunggak} menunggak
              </span>
            ) : null}
          </div>
        </div>

        {/* Angka ringkas laporan. */}
        {ringkasan ? (
          <dl className="mt-3 grid grid-cols-3 gap-2">
            <div data-testid="tu-laporan-ringkas-ditagih" className="rounded-xl border border-black/[0.08] bg-white p-2.5">
              <dt className="text-[8.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Ditagihkan</dt>
              <dd className="mt-1 text-[12px] leading-none font-extrabold text-ink-900">{rupiahSingkat(ringkasan.ditagih)}</dd>
              <dd className="mt-1 text-[8.5px] text-ink-400">{ringkasan.peserta} {laporan?.sebutan ?? istilah.sebutanKecil}</dd>
            </div>
            <div data-testid="tu-laporan-ringkas-lunas" className="rounded-xl border border-persis-900/25 bg-persis-900 p-2.5 text-white">
              <dt className="text-[8.5px] font-bold tracking-[0.06em] text-gold-300 uppercase">Total lunas</dt>
              <dd className="mt-1 text-[12px] leading-none font-extrabold">{rupiahSingkat(ringkasan.lunas)}</dd>
              <dd className="mt-1 text-[8.5px] text-white/70">{ringkasan.sudahLunas} sudah lunas penuh</dd>
            </div>
            <div data-testid="tu-laporan-ringkas-tunggakan" className="rounded-xl border border-black/[0.08] bg-pastelrose p-2.5">
              <dt className="text-[8.5px] font-bold tracking-[0.06em] text-rose-700 uppercase">Sisa tunggakan</dt>
              <dd className="mt-1 text-[12px] leading-none font-extrabold text-rose-700">{rupiahSingkat(ringkasan.tunggakan)}</dd>
              <dd className="mt-1 text-[8.5px] text-ink-600">{ringkasan.menunggak} masih menunggak</dd>
            </div>
          </dl>
        ) : null}

        {memuat && baris.length === 0 ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat laporan…</p>
        ) : galat ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : baris.length === 0 ? (
          <p data-testid="tu-laporan-tabel-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            {kataKunci
              ? `Tidak ada ${istilah.sebutanKecil} yang cocok dengan pencarian pada laporan ini.`
              : `Belum ada ${istilah.sebutanKecil} yang bisa dimasukkan ke laporan ini. Pastikan datanya sudah diisi di menu Sekolah.`}
          </p>
        ) : (
          <>
            <div
              data-testid="tu-laporan-tabel"
              className="mt-3 max-h-[68svh] overflow-auto overscroll-x-contain rounded-xl border border-black/[0.07]"
            >
              <table className="w-max min-w-full border-separate border-spacing-0 text-[10.5px]">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`sticky top-0 left-0 z-30 w-[104px] min-w-[104px] border-b border-black/[0.07] bg-cream-50 px-2.5 py-2 text-left text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase ${TEBAL_NAMA}`}
                    >
                      Nama
                    </th>
                    {kolom.map((k) => (
                      <th
                        key={k.kunci}
                        scope="col"
                        title={k.keterangan}
                        className="sticky top-0 z-20 w-[38px] min-w-[38px] border-b border-black/[0.07] bg-cream-50 px-1 py-2 text-center text-[9px] font-bold tracking-[0.04em] text-ink-400 uppercase"
                      >
                        {k.label}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="sticky top-0 z-20 w-[84px] min-w-[84px] border-b border-l border-black/[0.07] bg-cream-50 px-1.5 py-2 text-right text-[9px] font-bold tracking-[0.04em] text-ink-400 uppercase"
                    >
                      Total lunas
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 z-20 w-[84px] min-w-[84px] border-b border-black/[0.07] bg-cream-50 px-1.5 py-2 text-right text-[9px] font-bold tracking-[0.04em] text-ink-400 uppercase"
                    >
                      Sisa tunggakan
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {baris.map((b) => (
                    <tr key={b.id} data-testid={`tu-laporan-baris-${b.id}`}>
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 border-b border-black/[0.05] bg-white px-2.5 py-2 text-left align-top font-normal ${TEBAL_NAMA}`}
                      >
                        <span className="block text-[11px] leading-snug font-semibold break-words text-ink-900">
                          {b.nama}
                        </span>
                        <span className="mt-0.5 block text-[9px] leading-snug text-ink-400">
                          {[b.kelas, b.programNama].filter(Boolean).join(" · ") || "—"}
                        </span>
                        {b.status && b.status !== "aktif" ? (
                          <span className="mt-1 inline-block rounded-full bg-cream-100 px-1.5 py-0.5 text-[8.5px] font-bold text-ink-600">
                            {LABEL_PESERTA[b.status] ?? b.status}
                          </span>
                        ) : null}
                      </th>

                      {kolom.map((k) => {
                        const c = b.sel[k.kunci];
                        const status: StatusSelLaporan = c ? c.status : "kosong";
                        return (
                          <td key={k.kunci} className="border-b border-black/[0.05] bg-white px-1 py-1.5 text-center">
                            <span
                              title={`${b.nama} · ${k.keterangan}: ${LABEL_SEL[status]}${
                                c && c.nominal > 0 ? ` ${rupiah(c.nominal)}` : ""
                              }`}
                              className={`mx-auto grid h-6 min-w-6 place-items-center rounded-md px-1 text-[11px] ${KELAS_SEL[status]}`}
                            >
                              {HURUF_SEL[status]}
                            </span>
                          </td>
                        );
                      })}

                      <td
                        className="border-b border-l border-black/[0.05] bg-white px-1.5 py-2 text-right align-middle text-[10px] font-semibold text-persis-900"
                      >
                        {b.lunas > 0 ? rupiahSingkat(b.lunas) : "—"}
                        <span className="mt-0.5 hidden text-[8.5px] font-normal text-ink-400 sm:block">
                          {b.jumlahLunas} {satuanKolom} lunas
                        </span>
                      </td>
                      <td
                        className={`border-b border-black/[0.05] bg-white px-1.5 py-2 text-right align-middle text-[10px] font-semibold ${
                          b.tunggakan > 0 ? "text-rose-700" : "text-ink-400"
                        }`}
                      >
                        {b.tunggakan > 0 ? rupiahSingkat(b.tunggakan) : "—"}
                        <span className="mt-0.5 hidden text-[8.5px] font-normal text-ink-400 sm:block">
                          {b.jumlahTunggakan > 0
                            ? `${b.jumlahTunggakan} ${satuanKolom} belum bayar`
                            : "tidak ada tunggakan"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <th
                      scope="row"
                      className={`sticky bottom-0 left-0 z-30 border-t border-black/[0.08] bg-cream-100 px-2.5 py-2 text-left text-[9px] font-bold tracking-[0.04em] text-ink-600 uppercase ${TEBAL_NAMA}`}
                    >
                      Jumlah lunas
                    </th>
                    {kolom.map((k) => {
                      const j = jumlahSel.get(k.kunci);
                      return (
                        <td
                          key={k.kunci}
                          title={`${k.keterangan}: lunas ${rupiah(j?.lunas ?? 0)} dari ${rupiah(j?.nominal ?? 0)}`}
                          className="sticky bottom-0 z-20 border-t border-black/[0.08] bg-cream-100 px-1 py-2 text-center text-[8.5px] font-bold text-persis-900"
                        >
                          {j && j.lunas > 0 ? angkaRingkas(j.lunas) : "–"}
                        </td>
                      );
                    })}
                    <td
                      className="sticky bottom-0 z-20 border-t border-l border-black/[0.08] bg-cream-100 px-1.5 py-2 text-right text-[10px] font-extrabold text-persis-900"
                    >
                      {ringkasan ? rupiahSingkat(ringkasan.lunas) : "—"}
                    </td>
                    <td
                      className={`sticky bottom-0 z-20 border-t border-black/[0.08] bg-cream-100 px-1.5 py-2 text-right text-[10px] font-extrabold ${
                        ringkasan && ringkasan.tunggakan > 0 ? "text-rose-700" : "text-ink-400"
                      }`}
                    >
                      {ringkasan && ringkasan.tunggakan > 0 ? rupiahSingkat(ringkasan.tunggakan) : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-ink-400">
              <span>
                <b className="text-persis-900">✓</b> sudah dibayar
              </span>
              <span>
                <b className="text-gold-700">✓</b> sudah dibayar, menunggu verifikasi
              </span>
              <span>
                <b className="text-rose-700">X</b> belum dibayar
              </span>
              <span>– belum ditagihkan</span>
            </p>
            <p className="mt-1 text-[9.5px] text-ink-400">
              Geser tabelnya ke samping untuk melihat bulan lain, total lunas, dan sisa tunggakan sekaligus. Yang
              tetap di tempat hanya kolom nama. Angka total mengikuti tahun (kolom) yang sedang ditampilkan.
            </p>

            {laporan?.penuh ? (
              <p className="mt-2 text-justify text-[10px] leading-relaxed text-ink-600">
                Laporan ini memuat lebih dari 500 nama; yang tampil hanya 500 nama pertama. Pakai pencarian untuk
                mempersempitnya.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
