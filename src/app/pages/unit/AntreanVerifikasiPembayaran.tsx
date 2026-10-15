import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { Kolom, TombolSimpan } from "../../components/admin/Form";
import { rupiah } from "../../lib/format";
import { beritahu } from "../../lib/notifikasiAdmin";
import {
  daftarPembayaran,
  tolakPembayaran,
  verifikasiPembayaran,
  type PembayaranUnit,
} from "../../lib/unitTataUsaha";
import { useIstilah } from "../../lib/istilah";

type PembayaranAntrean = PembayaranUnit & {
  santriNama: string;
  santriKelas: string;
};

const tanggalPendek = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export default function AntreanVerifikasiPembayaran({
  versi = 0,
  onBerubah,
}: {
  versi?: number;
  onBerubah?: () => void;
}) {
  const istilah = useIstilah();
  const [antrean, setAntrean] = useState<PembayaranAntrean[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [sibuk, setSibuk] = useState("");
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarPembayaran("menunggu");
      const daftar: PembayaranAntrean[] = [];
      for (const s of jawab.santri) {
        for (const p of s.pembayaran) {
          if (p.status === "menunggu") {
            daftar.push({
              ...p,
              santriNama: s.nama,
              santriKelas: s.kelas,
            });
          }
        }
      }
      setAntrean(daftar);
    } catch {
      // Ditangani ramah tanpa membuat halaman rusak
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat, versi]);

  const verifikasi = async (p: PembayaranAntrean) => {
    setSibuk(p.id);
    try {
      const jawab = await verifikasiPembayaran(p.id);
      beritahu("sukses", jawab.pesan || `Pembayaran ${p.santriNama} berhasil diverifikasi.`);
      await muat();
      onBerubah?.();
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Pembayaran gagal diverifikasi.");
    } finally {
      setSibuk("");
    }
  };

  const kirimTolak = async (p: PembayaranAntrean) => {
    setSibuk(p.id);
    try {
      const jawab = await tolakPembayaran(p.id, catatan);
      beritahu("sukses", jawab.pesan || `Pembayaran ${p.santriNama} ditolak.`);
      setTolakId(null);
      setCatatan("");
      await muat();
      onBerubah?.();
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Pembayaran gagal ditolak.");
    } finally {
      setSibuk("");
    }
  };

  return (
    <section data-testid="tu-antrean-verifikasi" className="mt-3.5">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul="Antrean Verifikasi Pembayaran"
          keterangan={`Pembayaran dari ${istilah.waliKecil} yang menunggu pemeriksaan bendahara. Verifikasi langsung melunaskan tagihan terkait.`}
          angka={antrean.length}
          labelAngka="menunggu"
          testidAngka="tu-antrean-jumlah"
        />

        {memuat && antrean.length === 0 ? (
          <p className="mt-3 text-[11px] text-ink-400">Memeriksa antrean pembayaran…</p>
        ) : antrean.length === 0 ? (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-persis-900/10 bg-persis-50/50 px-3 py-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-persis-900 text-white">
              <Icon name="check" className="h-3 w-3" />
            </span>
            <p className="text-[11px] font-medium text-persis-900">
              Semua pembayaran telah diverifikasi. Tidak ada pembayaran yang menunggu.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {antrean.map((p) => (
              <li
                key={p.id}
                data-testid={`tu-antrean-item-${p.id}`}
                className="rounded-xl border border-gold-300/40 bg-gold-50/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-ink-900">{p.santriNama}</p>
                    <p className="mt-0.5 truncate text-[10px] text-ink-500">
                      {p.santriKelas ? `${p.santriKelas} · ` : ""}
                      {p.label || p.perLabel || p.jenis || "Tagihan"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12.5px] font-extrabold text-persis-900">{rupiah(p.jumlah)}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-bold text-gold-800">
                      Menunggu
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-500">
                  <span>Metode: {p.metode || "Transfer"}</span>
                  <span>Tanggal: {tanggalPendek(p.dibayarPada ?? p.dibuat)}</span>
                  {p.buktiUrl ? (
                    <a
                      href={p.buktiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-persis-900 underline"
                    >
                      Lihat Bukti Transfer ›
                    </a>
                  ) : null}
                </div>

                {p.catatan ? (
                  <p className="mt-1.5 rounded-lg bg-white/80 p-2 text-[10px] text-ink-600">
                    <span className="font-semibold text-ink-800">Catatan wali:</span> {p.catatan}
                  </p>
                ) : null}

                {tolakId !== p.id ? (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sibuk === p.id}
                      onClick={() => void verifikasi(p)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-persis-900 py-2 text-[11px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <Icon name="check" className="h-3.5 w-3.5" />
                      Verifikasi &amp; Lunaskan
                    </button>
                    <button
                      type="button"
                      disabled={sibuk === p.id}
                      onClick={() => {
                        setTolakId(p.id);
                        setCatatan("");
                      }}
                      className="rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-[11px] font-bold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                ) : (
                  <div className="mt-2.5 rounded-xl border border-rose-200 bg-white p-2.5">
                    <Kolom
                      label="Alasan penolakan"
                      nilai={catatan}
                      onUbah={setCatatan}
                      placeholder="Misal: Bukti transfer tidak jelas atau nominal kurang"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <TombolSimpan
                        label="Kirim Penolakan"
                        sibuk={sibuk === p.id}
                        onClick={() => void kirimTolak(p)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTolakId(null);
                          setCatatan("");
                        }}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-[10.5px] font-semibold text-ink-600"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
                }
