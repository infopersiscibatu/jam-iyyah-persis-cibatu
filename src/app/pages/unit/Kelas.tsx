import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { useIstilah } from "../../lib/istilah";
import { daftarSiswa } from "../../lib/unitSekolah";
import Lembar from "./Lembar";
import {
  daftarKelas,
  hapusKelas,
  luluskanKelas,
  naikKelas,
  pindahSemuaKelas,
  pindahkanSiswa,
  rekapTagihanKelas,
  siswaDiKelas,
  tambahKelas,
  ubahKelas,
  urutkanKelas,
  type BarisRekapKelas,
  type KelasUnit,
  type LangkahNaikKelas,
  type RingkasanKelas,
  type SiswaKelas,
} from "../../lib/unitKelas";

/**
 * Manajemen kelas (rombel) satu unit pendidikan.
 *
 * Dipakai panel Admin Sekolah untuk: menyusun daftar kelas, memilah peserta didik per
 * kelas, memindahkan satu atau sekaligus banyak peserta didik, menaikkan kelas sekali
 * setahun, dan meluluskan kelas terakhir — sehingga jumlah siswa di situs berkurang dan
 * mereka masuk daftar alumni. Panel Admin Tata Usaha memakai bagian rekap di bawah untuk
 * menyaring laporan tagihan per kelas.
 *
 * Kelas peserta didik disimpan pada data peserta didik (kolom `kelas`), jadi panel Nilai,
 * Tahfidz, statistik, dan tagihan memakai kelas yang sama.
 */

const rupiah = (nilai: number) => `Rp${Math.round(Number(nilai) || 0).toLocaleString("id-ID")}`;

/** "2026-10" → "Oktober 2026" */
const namaBulan = (periode: string) => {
  const [tahun, bulan] = String(periode).split("-").map((n) => Number.parseInt(n, 10));
  if (!tahun || !bulan) return periode;
  const bulanan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${bulanan[bulan - 1] ?? bulan} ${tahun}`;
};

const TOMBOL_KECIL =
  "inline-flex items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[10.5px] font-bold text-ink-700 transition active:scale-[0.98]";
const KOLOM =
  "w-full rounded-xl border border-black/[0.12] bg-white px-3 py-2.5 text-[12px] text-ink-900 outline-none focus:border-persis-700";

export default function Kelas() {
  const istilah = useIstilah();
  const [kelas, setKelas] = useState<KelasUnit[]>([]);
  const [ringkasan, setRingkasan] = useState<RingkasanKelas | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  const [form, setForm] = useState<{ mode: "tambah" | "ubah"; asal: string; nama: string; wali: string } | null>(null);
  const [hapus, setHapus] = useState<{ nama: string; jumlah: number; pindahKe: string } | null>(null);
  const [siswaBuka, setSiswaBuka] = useState<string | null>(null);
  const [siswa, setSiswa] = useState<SiswaKelas[]>([]);
  const [cariSiswa, setCariSiswa] = useState("");
  const [cariSemua, setCariSemua] = useState("");
  const [hasilCari, setHasilCari] = useState<SiswaKelas[]>([]);
  const [memuatSiswa, setMemuatSiswa] = useState(false);
  const [naikBuka, setNaikBuka] = useState(false);
  const [luluskanTerakhir, setLuluskanTerakhir] = useState(true);
  const [sedangKerja, setSedangKerja] = useState(false);
  const [hasilNaik, setHasilNaik] = useState<{ langkah: LangkahNaikKelas[]; pesan: string } | null>(null);

  const [rekap, setRekap] = useState<BarisRekapKelas[]>([]);
  const [rekapRingkas, setRekapRingkas] = useState<{ total: number; lunas: number; tunggakan: number; jumlah: number } | null>(null);
  const [periode, setPeriode] = useState("");
  const [periodeAda, setPeriodeAda] = useState<string[]>([]);
  const [kelasSaring, setKelasSaring] = useState("");

  const kelasTerurut = useMemo(() => [...kelas].sort((a, b) => a.urutan - b.urutan), [kelas]);

  const terapkan = (jawab: { kelas: KelasUnit[]; ringkasan: RingkasanKelas }) => {
    setKelas(jawab.kelas);
    setRingkasan(jawab.ringkasan);
  };

  const muatKelas = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarKelas();
      terapkan(jawab);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar kelas belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  const muatRekap = useCallback(async (opsi: { periode?: string; kelas?: string }) => {
    try {
      const jawab = await rekapTagihanKelas(opsi);
      setRekap(jawab.baris);
      setRekapRingkas(jawab.ringkasan);
      setPeriodeAda(jawab.periodeAda);
    } catch {
      setRekap([]);
      setRekapRingkas(null);
    }
  }, []);

  useEffect(() => {
    void muatKelas();
    void muatRekap({});
  }, [muatKelas, muatRekap]);

  /* Peserta didik satu kelas yang sedang dibuka. */
  const muatSiswa = useCallback(async (namaKelas: string, cari = "") => {
    setMemuatSiswa(true);
    try {
      const jawab = await siswaDiKelas(namaKelas, { cari });
      setSiswa(jawab.siswa);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : `Daftar ${istilah.sebutanKecil} belum bisa dimuat.`);
    } finally {
      setMemuatSiswa(false);
    }
  }, [istilah.sebutanKecil]);

  useEffect(() => {
    if (siswaBuka === null) return;
    const jeda = setTimeout(() => void muatSiswa(siswaBuka, cariSiswa), 300);
    return () => clearTimeout(jeda);
  }, [siswaBuka, cariSiswa, muatSiswa]);

  /* Pencarian seluruh peserta didik untuk menambahkan ke kelas yang dibuka. */
  useEffect(() => {
    if (siswaBuka === null || !cariSemua.trim()) {
      setHasilCari([]);
      return;
    }
    const jeda = setTimeout(async () => {
      try {
        const jawab = await daftarSiswa({ status: "aktif", cari: cariSemua, batas: 20 });
        setHasilCari(jawab.siswa as unknown as SiswaKelas[]);
      } catch {
        setHasilCari([]);
      }
    }, 300);
    return () => clearTimeout(jeda);
  }, [cariSemua, siswaBuka]);

  const jalankan = async (kerja: () => Promise<void>) => {
    setSedangKerja(true);
    setGalat(null);
    try {
      await kerja();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Perubahan belum berhasil disimpan.");
    } finally {
      setSedangKerja(false);
    }
  };

  const simpanForm = () =>
    jalankan(async () => {
      if (!form) return;
      const nama = form.nama.trim();
      if (!nama) throw new Error("Nama kelas wajib diisi.");
      if (form.mode === "tambah") {
        const jawab = await tambahKelas(nama, form.wali.trim());
        terapkan(jawab);
        setPesan(`Kelas ${nama} ditambahkan.`);
      } else {
        const jawab = await ubahKelas(form.asal, { nama, wali: form.wali.trim() });
        terapkan(jawab);
        setPesan(jawab.pesan || `Kelas ${form.asal} diperbarui.`);
      }
      setForm(null);
      await muatRekap({ periode, kelas: kelasSaring });
    });

  const konfirmasiHapus = () =>
    jalankan(async () => {
      if (!hapus) return;
      const jawab = await hapusKelas(hapus.nama, hapus.pindahKe);
      terapkan(jawab);
      setPesan(jawab.pesan || `Kelas ${hapus.nama} dihapus.`);
      setHapus(null);
      await muatRekap({ periode, kelas: kelasSaring });
    });

  const geser = (nama: string, arah: -1 | 1) =>
    jalankan(async () => {
      const urut = kelasTerurut.map((k) => k.nama);
      const posisi = urut.indexOf(nama);
      const tujuan = posisi + arah;
      if (posisi < 0 || tujuan < 0 || tujuan >= urut.length) return;
      [urut[posisi], urut[tujuan]] = [urut[tujuan], urut[posisi]];
      const jawab = await urutkanKelas(urut);
      terapkan(jawab);
    });

  const jalankanNaik = () =>
    jalankan(async () => {
      const jawab = await naikKelas(luluskanTerakhir);
      terapkan(jawab);
      setHasilNaik({ langkah: jawab.langkah, pesan: jawab.pesan });
      setPesan(jawab.pesan);
      await muatRekap({ periode, kelas: kelasSaring });
    });

  const jalankanLuluskan = (nama: string) =>
    jalankan(async () => {
      const jawab = await luluskanKelas(nama);
      terapkan(jawab);
      setPesan(jawab.pesan);
      if (siswaBuka === nama) await muatSiswa(nama, cariSiswa);
      await muatRekap({ periode, kelas: kelasSaring });
    });

  const pindahSatu = (id: string, ke: string) =>
    jalankan(async () => {
      const jawab = await pindahkanSiswa(id, ke);
      if (ringkasan) setRingkasan(jawab.ringkasan);
      if (siswaBuka !== null) await muatSiswa(siswaBuka, cariSiswa);
      await muatKelas();
      await muatRekap({ periode, kelas: kelasSaring });
      setPesan(`${jawab.siswa.nama} dipindahkan ke ${ke || "belum berkelas"}.`);
    });

  const pindahSemua = (dari: string, ke: string) =>
    jalankan(async () => {
      const jawab = await pindahSemuaKelas(dari, ke);
      terapkan(jawab);
      setPesan(`${jawab.dipindah} ${istilah.sebutanKecil} dipindahkan dari ${dari || "belum berkelas"} ke ${ke || "belum berkelas"}.`);
      setSiswaBuka(null);
      await muatRekap({ periode, kelas: kelasSaring });
    });

  const opsiTujuan = useMemo(
    () => [{ nama: "", label: "— Belum berkelas —" }, ...kelasTerurut.map((k) => ({ nama: k.nama, label: k.nama }))],
    [kelasTerurut],
  );

  const urutanNaik = useMemo(() => {
    const langkah: { dari: string; ke: string }[] = [];
    for (let i = 0; i < kelasTerurut.length; i += 1) {
      const asal = kelasTerurut[i].nama;
      const tujuan = kelasTerurut[i + 1] ? kelasTerurut[i + 1].nama : "Alumni";
      langkah.push({ dari: asal, ke: tujuan });
    }
    return langkah.reverse();
  }, [kelasTerurut]);

  return (
    <section data-testid="sekolah-kelas" className="mt-4 space-y-3.5">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul={`Kelas & Rombel ${istilah.sebutanKecil}`}
          keterangan={`Susun kelas, lalu pilah ${istilah.sebutanKecil} ke kelasnya masing-masing. Kelas yang sama dipakai panel Nilai, Tahfidz, statistik, dan tagihan. Urutan kelas di bawah menentukan arah kenaikan kelas.`}
          angka={ringkasan?.total ?? 0}
          labelAngka="kelas"
          testidAngka="kelas-jumlah"
          tombol={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="kelas-tambah"
                onClick={() => setForm({ mode: "tambah", asal: "", nama: "", wali: "" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-persis-800 px-3.5 py-2 text-[10.5px] font-bold text-white transition active:scale-[0.98]"
              >
                <Icon name="plus" className="h-[14px] w-[14px]" /> Kelas baru
              </button>
              <button
                type="button"
                data-testid="kelas-naik"
                onClick={() => {
                  setHasilNaik(null);
                  setNaikBuka(true);
                }}
                className={TOMBOL_KECIL}
              >
                <Icon name="graduation-cap" className="h-[14px] w-[14px]" /> Kenaikan kelas
              </button>
            </div>
          }
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "Punya kelas", nilai: ringkasan?.berKelas ?? 0, testid: "kelas-punya" },
            { label: "Belum berkelas", nilai: ringkasan?.belum ?? 0, testid: "kelas-belum" },
            { label: `Total ${istilah.sebutanKecil}`, nilai: ringkasan?.peserta ?? 0, testid: "kelas-total" },
          ].map((k) => (
            <div key={k.testid} className="rounded-xl border border-black/[0.08] bg-cream-50 px-2 py-1.5 text-center">
              <p data-testid={k.testid} className="font-header text-[15px] leading-none font-extrabold text-persis-900">
                {k.nilai}
              </p>
              <p className="mt-0.5 text-[8.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">{k.label}</p>
            </div>
          ))}
        </div>

        {ringkasan && ringkasan.belum > 0 ? (
          <button
            type="button"
            data-testid="kelas-buka-belum"
            onClick={() => {
              setCariSiswa("");
              setCariSemua("");
              setSiswaBuka("");
            }}
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-gold-500/40 bg-pastelgold/40 px-3 py-2 text-left"
          >
            <span className="text-[10.5px] font-semibold text-ink-700">
              {ringkasan.belum} {istilah.sebutanKecil} belum punya kelas — ketuk untuk memilah
            </span>
            <Icon name="chevron-right" className="h-[15px] w-[15px] text-ink-500" />
          </button>
        ) : null}
      </div>

      {galat ? (
        <p data-testid="kelas-galat" className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-[10.5px] font-semibold text-rose-700">
          {galat}
        </p>
      ) : null}
      {pesan ? (
        <p data-testid="kelas-pesan" className="rounded-xl border border-mint-deep bg-mint/40 px-3 py-2 text-[10.5px] font-semibold text-persis-800">
          {pesan}
        </p>
      ) : null}

      {/* ------------------------------- daftar kelas ------------------------------- */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <h3 className="font-header text-[13px] leading-tight font-extrabold text-ink-900">Daftar kelas</h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-ink-400">
          Urutan dari atas ke bawah adalah arah kenaikan kelas. Gunakan tanda panah untuk menggeser urutan.
        </p>

        {memuat ? (
          <p className="mt-3 text-[10.5px] text-ink-400">Memuat daftar kelas…</p>
        ) : kelasTerurut.length === 0 ? (
          <p className="mt-3 text-[10.5px] text-ink-400">
            Belum ada kelas. Ketuk “Kelas baru” untuk menambahkan, misalnya 1A, 2A, dan seterusnya.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {kelasTerurut.map((k, i) => (
              <li
                key={k.nama}
                data-testid={`kelas-baris-${k.nama}`}
                className="rounded-xl border border-black/[0.08] bg-cream-50/70 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-header text-[12.5px] leading-tight font-extrabold text-persis-900">{k.nama}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400">
                      {k.jumlah} {istilah.sebutanKecil}
                      {k.wali ? ` · wali: ${k.wali}` : " · wali kelas belum diisi"}
                      {k.belumTerdaftar ? " · belum masuk daftar" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Naikkan urutan kelas ${k.nama}`}
                      disabled={i === 0 || sedangKerja}
                      onClick={() => void geser(k.nama, -1)}
                      className="grid h-8 w-8 place-items-center rounded-full border border-black/[0.1] bg-white text-ink-600 disabled:opacity-30"
                    >
                      <Icon name="arrow-right" className="h-[13px] w-[13px] -rotate-90" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Turunkan urutan kelas ${k.nama}`}
                      disabled={i === kelasTerurut.length - 1 || sedangKerja}
                      onClick={() => void geser(k.nama, 1)}
                      className="grid h-8 w-8 place-items-center rounded-full border border-black/[0.1] bg-white text-ink-600 disabled:opacity-30"
                    >
                      <Icon name="arrow-right" className="h-[13px] w-[13px] rotate-90" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    data-testid={`kelas-lihat-${k.nama}`}
                    onClick={() => {
                      setCariSiswa("");
                      setCariSemua("");
                      setSiswaBuka(k.nama);
                    }}
                    className={TOMBOL_KECIL}
                  >
                    <Icon name="users" className="h-[13px] w-[13px]" /> Lihat {istilah.sebutanKecil}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ mode: "ubah", asal: k.nama, nama: k.nama, wali: k.wali })}
                    className={TOMBOL_KECIL}
                  >
                    <Icon name="pencil" className="h-[13px] w-[13px]" /> Ubah
                  </button>
                  <button
                    type="button"
                    disabled={sedangKerja}
                    onClick={() => void jalankanLuluskan(k.nama)}
                    className={TOMBOL_KECIL}
                  >
                    <Icon name="graduation-cap" className="h-[13px] w-[13px]" /> Luluskan
                  </button>
                  <button
                    type="button"
                    disabled={sedangKerja}
                    onClick={() => setHapus({ nama: k.nama, jumlah: k.jumlah, pindahKe: "" })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10.5px] font-bold text-rose-700 transition active:scale-[0.98]"
                  >
                    <Icon name="trash" className="h-[13px] w-[13px]" /> Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --------------------------- rekap tagihan per kelas --------------------------- */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <h3 className="font-header text-[13px] leading-tight font-extrabold text-ink-900">Tagihan per kelas</h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-ink-400">
          Rekap tagihan dikelompokkan menurut kelas {istilah.sebutanKecil} saat ini — inti penyaringan laporan tagihan
          bagi bagian tata usaha. Nilai tagihan mengikuti semua jenis tagihan pada bulan yang dipilih.
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPeriode("");
              setKelasSaring("");
              void muatRekap({});
            }}
            className={`${TOMBOL_KECIL} ${!periode && !kelasSaring ? "border-persis-800 bg-persis-800 text-white" : ""}`}
          >
            Semua
          </button>
          {periodeAda.slice(0, 6).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriode(p);
                void muatRekap({ periode: p, kelas: kelasSaring });
              }}
              className={`${TOMBOL_KECIL} ${periode === p ? "border-persis-800 bg-persis-800 text-white" : ""}`}
            >
              {namaBulan(p)}
            </button>
          ))}
        </div>

        <label className="mt-2.5 block">
          <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Kelas</span>
          <select
            data-testid="rekap-kelas"
            value={kelasSaring}
            onChange={(e) => {
              setKelasSaring(e.target.value);
              void muatRekap({ periode, kelas: e.target.value });
            }}
            className={`${KOLOM} mt-1`}
          >
            <option value="">Semua kelas</option>
            {opsiTujuan
              .filter((o) => o.nama)
              .map((o) => (
                <option key={o.nama} value={o.nama}>
                  {o.nama}
                </option>
              ))}
            <option value="__belum__">Belum berkelas</option>
          </select>
        </label>

        {rekapRingkas ? (
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-black/[0.08] bg-cream-50 px-2 py-1.5 text-center">
              <p className="font-header text-[12.5px] leading-none font-extrabold text-persis-900">{rekapRingkas.jumlah}</p>
              <p className="mt-0.5 text-[8.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Tagihan</p>
            </div>
            <div className="rounded-xl border border-black/[0.08] bg-cream-50 px-2 py-1.5 text-center">
              <p className="font-header text-[12.5px] leading-none font-extrabold text-persis-900">
                {rupiah(rekapRingkas.lunas)}
              </p>
              <p className="mt-0.5 text-[8.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Lunas</p>
            </div>
            <div className="rounded-xl border border-black/[0.08] bg-cream-50 px-2 py-1.5 text-center">
              <p className="font-header text-[12.5px] leading-none font-extrabold text-rose-700">
                {rupiah(rekapRingkas.tunggakan)}
              </p>
              <p className="mt-0.5 text-[8.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Tunggakan</p>
            </div>
          </div>
        ) : null}

        <div className="mt-2.5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">
                <th className="border-b border-black/[0.08] py-1.5">Kelas</th>
                <th className="border-b border-black/[0.08] py-1.5 text-right">Peserta</th>
                <th className="border-b border-black/[0.08] py-1.5 text-right">Tagihan</th>
                <th className="border-b border-black/[0.08] py-1.5 text-right">Lunas</th>
                <th className="border-b border-black/[0.08] py-1.5 text-right">Tunggakan</th>
              </tr>
            </thead>
            <tbody>
              {rekap.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-[10.5px] text-ink-400" data-testid="rekap-kosong">
                    Belum ada tagihan pada pilihan ini.
                  </td>
                </tr>
              ) : (
                rekap.map((b) => (
                  <tr key={b.kunci || "belum"} data-testid={`rekap-${b.kunci || "belum"}`} className="text-[11px] text-ink-700">
                    <td className="border-b border-black/[0.05] py-1.5 font-semibold text-ink-900">{b.kelas}</td>
                    <td className="border-b border-black/[0.05] py-1.5 text-right">{b.peserta}</td>
                    <td className="border-b border-black/[0.05] py-1.5 text-right">{b.jumlah}</td>
                    <td className="border-b border-black/[0.05] py-1.5 text-right">{rupiah(b.lunas)}</td>
                    <td className="border-b border-black/[0.05] py-1.5 text-right text-rose-700">
                      {b.tunggakan > 0 ? rupiah(b.tunggakan) : "—"}
                      {b.jumlahTunggakan > 0 ? (
                        <span className="ml-1 text-[9px] text-ink-400">({b.jumlahTunggakan})</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------ borang kelas ------------------------------ */}
      {form ? (
        <Lembar
          testid="kelas-form"
          judul={form.mode === "tambah" ? "Kelas baru" : `Ubah kelas ${form.asal}`}
          keterangan={
            form.mode === "tambah"
              ? "Nama kelas dipakai di seluruh panel. Contoh: 1A, 2A, atau Kelas 1."
              : "Mengubah nama kelas sekaligus memindahkan seluruh peserta didik yang ada di dalamnya."
          }
          onTutup={() => setForm(null)}
          aksi={
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="kelas-form-simpan"
                disabled={sedangKerja}
                onClick={() => void simpanForm()}
                className="flex-1 rounded-full bg-persis-800 px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-60"
              >
                {sedangKerja ? "Menyimpan…" : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-full border border-black/[0.12] px-4 py-2.5 text-[11px] font-bold text-ink-700"
              >
                Batal
              </button>
            </div>
          }
        >
          <label className="block">
            <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Nama kelas</span>
            <input
              data-testid="kelas-form-nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: 1A"
              className={`${KOLOM} mt-1`}
            />
          </label>
          <label className="mt-3 block">
            <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">Wali kelas (boleh dikosongkan)</span>
            <input
              data-testid="kelas-form-wali"
              value={form.wali}
              onChange={(e) => setForm({ ...form, wali: e.target.value })}
              placeholder="Nama wali kelas"
              className={`${KOLOM} mt-1`}
            />
          </label>
        </Lembar>
      ) : null}

      {/* --------------------------- hapus kelas --------------------------- */}
      {hapus ? (
        <Lembar
          testid="kelas-hapus"
          judul={`Hapus kelas ${hapus.nama}`}
          keterangan={
            hapus.jumlah > 0
              ? `Kelas ini masih berisi ${hapus.jumlah} peserta didik aktif. Pilih kelas tujuan pemindahannya lebih dahulu.`
              : "Kelas ini kosong, jadi bisa dihapus langsung."
          }
          onTutup={() => setHapus(null)}
          aksi={
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="kelas-hapus-ya"
                disabled={sedangKerja || (hapus.jumlah > 0 && !hapus.pindahKe)}
                onClick={() => void konfirmasiHapus()}
                className="flex-1 rounded-full bg-rose-700 px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                {sedangKerja ? "Menghapus…" : "Ya, hapus kelas"}
              </button>
              <button
                type="button"
                onClick={() => setHapus(null)}
                className="rounded-full border border-black/[0.12] px-4 py-2.5 text-[11px] font-bold text-ink-700"
              >
                Batal
              </button>
            </div>
          }
        >
          {hapus.jumlah > 0 ? (
            <label className="block">
              <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">
                Pindahkan isinya ke
              </span>
              <select
                data-testid="kelas-hapus-tujuan"
                value={hapus.pindahKe}
                onChange={(e) => setHapus({ ...hapus, pindahKe: e.target.value })}
                className={`${KOLOM} mt-1`}
              >
                <option value="">— pilih kelas tujuan —</option>
                {opsiTujuan
                  .filter((o) => o.nama && o.nama !== hapus.nama)
                  .map((o) => (
                    <option key={o.nama} value={o.nama}>
                      {o.nama}
                    </option>
                  ))}
                <option value="__belum__">Belum berkelas</option>
              </select>
            </label>
          ) : null}
        </Lembar>
      ) : null}

      {/* --------------------------- peserta didik satu kelas --------------------------- */}
      {siswaBuka !== null ? (
        <Lembar
          testid="kelas-siswa"
          judul={siswaBuka ? `Kelas ${siswaBuka}` : "Belum berkelas"}
          keterangan={`Pindahkan ${istilah.sebutanKecil} dengan memilih kelas tujuan, atau cari nama untuk menambahkannya ke kelas ini.`}
          onTutup={() => {
            setSiswaBuka(null);
            setCariSemua("");
            setHasilCari([]);
          }}
          aksi={
            kelasTerurut.length > 1 && siswaBuka ? (
              <label className="block">
                <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">
                  Pindahkan semua ke
                </span>
                <select
                  data-testid="kelas-pindah-semua"
                  value=""
                  disabled={sedangKerja}
                  onChange={(e) => {
                    const ke = e.target.value;
                    if (!ke) return;
                    if (!window.confirm(`Pindahkan semua ${istilah.sebutanKecil} kelas ${siswaBuka} ke ${ke}?`)) return;
                    void pindahSemua(siswaBuka, ke);
                  }}
                  className={`${KOLOM} mt-1`}
                >
                  <option value="">— pilih kelas tujuan —</option>
                  {opsiTujuan
                    .filter((o) => o.nama !== siswaBuka)
                    .map((o) => (
                      <option key={o.nama} value={o.nama}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </label>
            ) : null
          }
        >
          <input
            data-testid="kelas-siswa-cari"
            value={cariSiswa}
            onChange={(e) => setCariSiswa(e.target.value)}
            placeholder={`Cari nama ${istilah.sebutanKecil} di kelas ini`}
            className={KOLOM}
          />

          {memuatSiswa ? (
            <p className="mt-3 text-[10.5px] text-ink-400">Memuat…</p>
          ) : siswa.length === 0 ? (
            <p className="mt-3 text-[10.5px] text-ink-400" data-testid="kelas-siswa-kosong">
              {siswaBuka ? "Belum ada peserta didik di kelas ini." : "Semua peserta didik sudah punya kelas."}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {siswa.map((s) => (
                <li
                  key={s.id}
                  data-testid={`kelas-siswa-${s.id}`}
                  className="rounded-xl border border-black/[0.08] bg-cream-50/70 p-2.5"
                >
                  <p className="font-header text-[12px] leading-tight font-extrabold text-persis-900">{s.nama}</p>
                  <p className="mt-0.5 text-[10px] text-ink-400">
                    {s.programNama || s.program || "—"}
                    {s.waliNama ? ` · wali: ${s.waliNama}` : ""}
                  </p>
                  <select
                    aria-label={`Pindahkan ${s.nama} ke kelas`}
                    value={s.kelas}
                    disabled={sedangKerja}
                    onChange={(e) => {
                      const ke = e.target.value === "__belum__" ? "" : e.target.value;
                      void pindahSatu(s.id, ke);
                    }}
                    className={`${KOLOM} mt-2`}
                  >
                    {opsiTujuan.map((o) => (
                      <option key={o.nama || "belum"} value={o.nama || "__belum__"}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-black/[0.08] pt-3">
            <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">
              Tambah {istilah.sebutanKecil} ke kelas ini
            </span>
            <input
              data-testid="kelas-tambah-siswa-cari"
              value={cariSemua}
              onChange={(e) => setCariSemua(e.target.value)}
              placeholder={`Cari nama ${istilah.sebutanKecil} pada daftar sekolah`}
              className={`${KOLOM} mt-1`}
            />
            {hasilCari.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {hasilCari.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-cream-50 px-2.5 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-ink-900">{s.nama}</span>
                      <span className="block text-[9.5px] text-ink-400">{s.kelas ? `Sekarang: ${s.kelas}` : "Belum berkelas"}</span>
                    </span>
                    <button
                      type="button"
                      disabled={sedangKerja}
                      onClick={() => void pindahSatu(s.id, siswaBuka)}
                      className="shrink-0 rounded-full bg-persis-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
                    >
                      Tambahkan
                    </button>
                  </li>
                ))}
              </ul>
            ) : cariSemua.trim() ? (
              <p className="mt-2 text-[10px] text-ink-400">Nama tidak ditemukan pada daftar aktif.</p>
            ) : null}
          </div>
        </Lembar>
      ) : null}

      {/* ----------------------------- kenaikan kelas ----------------------------- */}
      {naikBuka ? (
        <Lembar
          testid="kelas-naik-lembar"
          judul="Kenaikan kelas"
          keterangan="Seluruh peserta didik naik satu tingkat mengikuti urutan kelas di atas. Kelas terakhir diluluskan menjadi alumni, sehingga jumlah siswa di situs berkurang dan mereka masuk daftar alumni."
          onTutup={() => {
            setNaikBuka(false);
            setHasilNaik(null);
          }}
          aksi={
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="kelas-naik-jalankan"
                disabled={sedangKerja || kelasTerurut.length === 0 || Boolean(hasilNaik)}
                onClick={() => void jalankanNaik()}
                className="flex-1 rounded-full bg-persis-800 px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                {sedangKerja ? "Memproses…" : "Jalankan kenaikan kelas"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNaikBuka(false);
                  setHasilNaik(null);
                }}
                className="rounded-full border border-black/[0.12] px-4 py-2.5 text-[11px] font-bold text-ink-700"
              >
                Tutup
              </button>
            </div>
          }
        >
          {kelasTerurut.length === 0 ? (
            <p className="text-[10.5px] text-ink-400">Belum ada kelas yang bisa dinaikkan.</p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {(hasilNaik ? hasilNaik.langkah : urutanNaik).map((l) => (
                  <li key={l.dari} className="flex items-center justify-between gap-2 rounded-xl bg-cream-50 px-2.5 py-2">
                    <span className="text-[11px] font-semibold text-ink-900">{l.dari}</span>
                    <Icon name="arrow-right" className="h-[13px] w-[13px] text-ink-400" />
                    <span className="text-[11px] font-semibold text-persis-800">{l.ke}</span>
                    <span className="text-[10px] text-ink-400">
                      {"jumlah" in l ? `${l.jumlah} dipindah` : `${kelasTerurut.find((k) => k.nama === l.dari)?.jumlah ?? 0} peserta`}
                    </span>
                  </li>
                ))}
              </ul>
              <label className="mt-3 flex items-center gap-2 rounded-xl border border-black/[0.08] bg-cream-50 px-3 py-2">
                <input
                  type="checkbox"
                  data-testid="kelas-naik-luluskan"
                  checked={luluskanTerakhir}
                  disabled={Boolean(hasilNaik)}
                  onChange={(e) => setLuluskanTerakhir(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-[10.5px] text-ink-700">Kelas terakhir diluluskan (jadi alumni)</span>
              </label>
              {hasilNaik ? (
                <p className="mt-3 rounded-xl border border-mint-deep bg-mint/40 px-3 py-2 text-[10.5px] font-semibold text-persis-800">
                  {hasilNaik.pesan}
                </p>
              ) : (
                <p className="mt-3 text-[10px] leading-relaxed text-ink-400">
                  Periksa urutan kelas sebelum menjalankan. Kenaikan kelas dikerjakan dari kelas paling atas, sehingga
                  tidak ada dua angkatan yang bercampur.
                </p>
              )}
            </>
          )}
        </Lembar>
      ) : null}
    </section>
  );
}
