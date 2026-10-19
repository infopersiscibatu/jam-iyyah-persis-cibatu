import { Button } from "@/components/ui/button";
import { Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { type Notifikasi } from "../data/content";
import { useProfil } from "../lib/profil";
import { labelNotifikasi } from "../lib/format";
import { Icon } from "./Icons";

const ikonJenis: Record<string, string> = {
  Berita: "newspaper",
  Pengumuman: "megaphone",
  Agenda: "calendar",
  Kajian: "book-open",
};

export default function Header({
  scrolled,
  onBeranda,
  onBukaPost,
  notifikasiBelumDibaca,
  jumlahBelumDibaca,
  onTandai,
  onMunculkanLagi,
}: {
  scrolled: boolean;
  onBeranda: () => void;
  onBukaPost: (n: Notifikasi) => void;
  notifikasiBelumDibaca: Notifikasi[];
  jumlahBelumDibaca: number;
  onTandai: (ids: string[]) => void;
  onMunculkanLagi: () => void;
}) {
  const { identitas } = useProfil();
  const [terbuka, setTerbuka] = useState(false);
  const [jam, setJam] = useState(() => new Date().getHours());
  useEffect(() => {
    const timer = window.setInterval(() => setJam(new Date().getHours()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const waktu = jam >= 4 && jam < 11 ? "pagi" : jam >= 11 && jam < 15 ? "siang" : jam >= 15 && jam < 18 ? "sore" : "malam";
  const IkonSapaan = waktu === "pagi" ? CloudSun : waktu === "siang" ? Sun : waktu === "sore" ? Sunset : Moon;
  const sapaan = `Selamat ${waktu.charAt(0).toUpperCase()}${waktu.slice(1)}`;

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

  return (
    <header className={`relative z-40 mx-auto w-full max-w-[620px] px-5 pt-4 pb-3 ${scrolled ? "" : ""}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button variant="ghost" onClick={onBeranda} aria-label="Beranda" className="tile-shadow h-10 w-10 shrink-0 rounded-[13px] border border-line bg-surface p-0">
            <img src={identitas.logo} alt="Logo PC PERSIS Cibatu" className="h-8 w-8 rounded-full object-contain" draggable={false} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-header truncate text-[14px] leading-[18px] font-extrabold text-ink-900">{sapaan}</p>
              <span data-testid={`sapaan-${waktu}`} className={`grid h-5 w-5 shrink-0 -translate-y-[3px] place-items-center rounded-full ${waktu === "malam" ? "bg-greeting-night text-greeting-night-ink" : "bg-stat-gold text-stat-gold-ink"}`}>
                <IkonSapaan className={`h-[14px] w-[14px] ikon-${waktu}`} />
              </span>
            </div>
            <p className="truncate text-[10px] leading-3 font-semibold text-ink-400">{identitas.nama} · {identitas.wilayah}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setTerbuka((v) => !v)} aria-label={jumlahBelumDibaca > 0 ? `Notifikasi, ${jumlahBelumDibaca} belum dibaca` : "Notifikasi"} aria-expanded={terbuka} data-testid="btn-notifikasi" className="tile-shadow relative h-9 w-9 shrink-0 rounded-[11px] border border-line bg-surface p-0 text-ink-700">
          <Icon name="bell" className="h-[17px] w-[17px]" />
          {jumlahBelumDibaca > 0 ? <span data-testid="notif-jumlah" className="absolute -top-1.5 -right-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-gold-400 px-1 text-[8.5px] font-extrabold text-persis-950 ring-2 ring-surface">{jumlahBelumDibaca}</span> : null}
        </Button>
      </div>

      {terbuka ? (
        <>
          <Button variant="ghost"
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setTerbuka(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="popup-panel fixed inset-x-0 top-0 z-40 mx-auto max-h-[80vh] max-w-[620px] overflow-y-auto rounded-b-[24px] border-b border-line bg-surface float-nav-list">
            <div className="mx-auto w-full max-w-[620px] px-5 py-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-header text-[13px] font-semibold text-ink-900">
                  Notifikasi
                  {jumlahBelumDibaca > 0 ? (
                    <span className="ml-2 rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-persis-900 tabular-nums">
                      {jumlahBelumDibaca} baru
                    </span>
                  ) : null}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  {jumlahBelumDibaca > 0 ? (
                    <Button variant="ghost"
                      type="button"
                      onClick={() => onTandai(notifikasiBelumDibaca.map((n) => n.id))}
                      data-testid="notif-tandai-semua"
                      className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-bold text-persis-900 transition active:scale-95"
                    >
                      Tandai semua dibaca
                    </Button>
                  ) : null}
                  <Button variant="ghost"
                    type="button"
                    onClick={() => setTerbuka(false)}
                    aria-label="Tutup notifikasi"
                    data-testid="notif-tutup"
                    className="rounded-full p-1 text-ink-400 transition hover:bg-cream-100"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {notifikasiBelumDibaca.length > 0 ? (
                <ul data-testid="notif-daftar" className="divide-y divide-line">
                  {notifikasiBelumDibaca.map((n) => (
                    <li key={n.id}>
                      <Button variant="ghost"
                        type="button"
                        onClick={() => bukaPost(n)}
                        data-testid={`notif-${n.id}`}
                        className="flex w-full items-start gap-3 py-3 text-left transition active:opacity-70"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-cream-50 text-gold-600">
                          <Icon name={ikonJenis[n.jenis] ?? "info"} className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[9.5px] font-bold tracking-[0.12em] text-persis-900 uppercase">
                              {n.jenis}
                            </span>
                            <span className="ml-auto shrink-0 text-[10px] text-persis-900 tabular-nums">
                              {labelNotifikasi(n.tanggal)}
                            </span>
                          </span>
                          <span className="mt-1 block line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">
                            {n.judul}
                          </span>
                          <span className="mt-1 block line-clamp-2 text-justify text-[10.5px] leading-relaxed text-ink-600">
                            {n.ringkas}
                          </span>
                        </span>
                        <Icon name="chevron-right" className="mt-2 h-4 w-4 shrink-0 text-ink-400" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  data-testid="notif-kosong"
                  className="rounded-2xl border border-line bg-cream-50 px-4 py-5 text-center"
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-cream-100 text-persis-900">
                    <Icon name="bell" className="h-5 w-5" />
                  </span>
                  <p className="mt-2 text-[12px] font-semibold text-ink-900">Belum ada notifikasi baru</p>
                  <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600">
                    Semua postingan terbaru sudah Anda baca. Notifikasi baru muncul di sini setiap ada berita,
                    pengumuman, agenda, atau kajian berikutnya.
                  </p>
                  <Button variant="ghost"
                    type="button"
                    onClick={onMunculkanLagi}
                    data-testid="notif-munculkan-lagi"
                    className="mt-3 rounded-full border border-persis-900/20 bg-surface px-3.5 py-2 text-[10.5px] font-bold text-persis-900 transition active:scale-95"
                  >
                    Munculkan lagi notifikasi sebelumnya
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
