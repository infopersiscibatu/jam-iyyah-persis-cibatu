import { useEffect, useState } from "react";
import { identitas, type Notifikasi } from "../lib/content";
import { labelNotifikasi } from "../lib/format";
import { useIdentitasWali } from "../lib/useIdentitasWali";
import { Icon } from "./Icons";

const ikonJenis: Record<string, string> = {
  Berita: "newspaper",
  Pengumuman: "megaphone",
  Agenda: "calendar",
  Kajian: "book-open",
};

type Waktu = "pagi" | "siang" | "sore" | "malam";

const sapaanWaktu: Record<
  Waktu,
  { teks: string; ikon: string; latar: string; warna: string; animasi: string }
> = {
  pagi: {
    teks: "Selamat Pagi",
    ikon: "cloud-sun",
    latar: "bg-[#fdf3e2]",
    warna: "text-[#b8860b]",
    animasi: "ikon-pagi",
  },
  siang: {
    teks: "Selamat Siang",
    ikon: "sun",
    latar: "bg-[#fff0d8]",
    warna: "text-[#c9761a]",
    animasi: "ikon-siang",
  },
  sore: {
    teks: "Selamat Sore",
    ikon: "sunset",
    latar: "bg-[#fdeae0]",
    warna: "text-[#c2623a]",
    animasi: "ikon-sore",
  },
  malam: {
    teks: "Selamat Malam",
    ikon: "moon",
    latar: "bg-[#e9edfb]",
    warna: "text-[#4f5fa8]",
    animasi: "ikon-malam",
  },
};

function waktuSekarang(): Waktu {
  const jam = new Date().getHours();
  if (jam >= 4 && jam < 11) return "pagi";
  if (jam >= 11 && jam < 15) return "siang";
  if (jam >= 15 && jam < 18) return "sore";
  return "malam";
}

/**
 * Baris sapaan ringkas di atas beranda (bukan kepala besar) plus panel notifikasi
 * yang muncul dari bawah seperti aplikasi mobile.
 */
export default function BarMerek({
  onBeranda,
  onBukaPost,
  notifikasiBelumDibaca,
  jumlahBelumDibaca,
  onTandai,
  onMunculkanLagi,
}: {
  onBeranda: () => void;
  onBukaPost: (n: Notifikasi) => void;
  notifikasiBelumDibaca: Notifikasi[];
  jumlahBelumDibaca: number;
  onTandai: (ids: string[]) => void;
  onMunculkanLagi: () => void;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [waktu, setWaktu] = useState<Waktu>(waktuSekarang);
  /* Bila wali santri sudah masuk dengan PIN, label bawah sapaan memakai nama peserta didik. */
  const namaWali = useIdentitasWali();

  useEffect(() => {
    const jam = window.setInterval(() => setWaktu(waktuSekarang()), 60_000);
    return () => window.clearInterval(jam);
  }, []);

  useEffect(() => {
    if (!terbuka) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTerbuka(false);
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [terbuka]);

  const bukaPost = (n: Notifikasi) => {
    onTandai([n.id]);
    setTerbuka(false);
    onBukaPost(n);
  };

  const sapaan = sapaanWaktu[waktu];

  return (
    <>
      <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBeranda}
            aria-label="Beranda"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white ring-1 ring-line shadow-[0_6px_14px_-12px_rgba(7,41,26,0.5)] transition active:scale-95"
          >
            <img
              src={identitas.logo}
              alt="Logo PC PERSIS Cibatu"
              className="h-8 w-8 rounded-full object-contain"
              draggable={false}
            />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[3px]">
            <p className="font-header truncate text-[14px] leading-[18px] font-extrabold tracking-[-0.01em] text-ink-900">
              {sapaan.teks}
            </p>
            <span
              aria-hidden="true"
              data-testid={`sapaan-${waktu}`}
              className={`grid h-5 w-5 shrink-0 -translate-y-[3px] place-items-center rounded-full ${sapaan.latar} ${sapaan.warna}`}
            >
              <Icon name={sapaan.ikon} className={`h-[14px] w-[14px] ${sapaan.animasi}`} />
            </span>
          </div>
          <p
            data-testid="merek-label"
            className="mt-[-0.5px] truncate text-[10px] leading-[12px] font-semibold text-ink-400"
          >
            {namaWali ? `Wali ${namaWali}` : "Jama'ah Persis Cibatu"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTerbuka(true)}
          aria-label={jumlahBelumDibaca > 0 ? `Notifikasi, ${jumlahBelumDibaca} belum dibaca` : "Notifikasi"}
          data-testid="btn-notifikasi"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-white text-ink-700 ring-1 ring-line shadow-[0_6px_14px_-12px_rgba(7,41,26,0.5)] transition active:scale-95"
        >
          <Icon name="bell" className="h-[17px] w-[17px]" />
          {jumlahBelumDibaca > 0 ? (
            <span
              data-testid="notif-jumlah"
              className="absolute -top-1.5 -right-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-gold-400 px-1 text-[8.5px] font-extrabold text-persis-950 tabular-nums ring-2 ring-white"
            >
              {jumlahBelumDibaca}
            </span>
          ) : null}
        </button>
      </div>

      {terbuka ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setTerbuka(false)}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Notifikasi"
            data-testid="panel-notifikasi"
            className="panel-atas absolute inset-x-0 top-0 mx-auto flex max-h-[80vh] w-full max-w-[620px] flex-col overflow-hidden rounded-b-[24px] bg-white shadow-[0_26px_50px_-28px_rgba(7,41,26,0.55)]"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-2 pb-2">
              <p className="font-header text-[13px] font-extrabold text-ink-900">
                Notifikasi
                {jumlahBelumDibaca > 0 ? (
                  <span className="ml-2 rounded-full bg-leaf-100 px-2 py-0.5 text-[9.5px] font-bold text-persis-800 tabular-nums">
                    {jumlahBelumDibaca} baru
                  </span>
                ) : null}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                {jumlahBelumDibaca > 0 ? (
                  <button
                    type="button"
                    onClick={() => onTandai(notifikasiBelumDibaca.map((n) => n.id))}
                    data-testid="notif-tandai-semua"
                    className="rounded-full border border-line px-2.5 py-1 text-[9.5px] font-bold text-ink-600 transition active:scale-95"
                  >
                    Tandai semua
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setTerbuka(false)}
                  aria-label="Tutup notifikasi"
                  data-testid="notif-tutup"
                  className="grid h-7 w-7 place-items-center rounded-full bg-mist text-ink-400 transition active:scale-95"
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-2"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {notifikasiBelumDibaca.length > 0 ? (
                <ul data-testid="notif-daftar" className="divide-y divide-line">
                  {notifikasiBelumDibaca.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => bukaPost(n)}
                        data-testid={`notif-${n.id}`}
                        className="flex w-full items-start gap-3 py-3 text-left transition active:opacity-70"
                      >
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink-900">
                          <Icon name={ikonJenis[n.jenis] ?? "info"} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[8.5px] font-bold tracking-[0.14em] text-persis-800 uppercase">
                              {n.jenis}
                            </span>
                            <span className="ml-auto shrink-0 text-[9.5px] text-ink-400 tabular-nums">
                              {labelNotifikasi(n.tanggal)}
                            </span>
                          </span>
                          <span className="mt-1 block line-clamp-2 text-[12px] leading-snug font-bold text-ink-900">
                            {n.judul}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-justify text-[10px] leading-relaxed text-ink-600">
                            {n.ringkas}
                          </span>
                        </span>
                        <Icon name="chevron-right" className="mt-2 h-3.5 w-3.5 shrink-0 text-ink-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div data-testid="notif-kosong" className="mt-2 rounded-[14px] bg-mist px-4 py-5 text-center">
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900">
                    <Icon name="bell" className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-[11.5px] font-bold text-ink-900">Belum ada notifikasi baru</p>
                  <p className="mt-1 text-justify text-[10px] leading-relaxed text-ink-600">
                    Semua postingan terbaru sudah Anda baca. Notifikasi baru muncul di sini setiap ada berita,
                    pengumuman, agenda, atau kajian berikutnya.
                  </p>
                  <button
                    type="button"
                    onClick={onMunculkanLagi}
                    data-testid="notif-munculkan-lagi"
                    className="mt-3 rounded-full bg-white px-3.5 py-2 text-[10px] font-bold text-ink-900 shadow-sm transition active:scale-95"
                  >
                    Munculkan lagi notifikasi sebelumnya
                  </button>
                </div>
              )}
            </div>

            <div className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-line" aria-hidden="true" />
          </div>
        </div>
      ) : null}
    </>
  );
}
