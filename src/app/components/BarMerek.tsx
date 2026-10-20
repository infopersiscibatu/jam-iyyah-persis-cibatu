import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { useProfil } from "../lib/profil";

type Waktu = "pagi" | "siang" | "sore" | "malam";

const sapaanWaktu: Record<
  Waktu,
  { teks: string; ikon: string; latar: string; warna: string }
> = {
  pagi: { teks: "Selamat Pagi", ikon: "cloud-sun", latar: "bg-[#fdf3e2]", warna: "text-[#b8860b]" },
  siang: { teks: "Selamat Siang", ikon: "sun", latar: "bg-[#fff0d8]", warna: "text-[#c9761a]" },
  sore: { teks: "Selamat Sore", ikon: "sunset", latar: "bg-[#fdeae0]", warna: "text-[#c2623a]" },
  malam: { teks: "Selamat Malam", ikon: "moon", latar: "bg-[#e9edfb]", warna: "text-[#4f5fa8]" },
};

function hitungWaktu(): Waktu {
  const jam = new Date().getHours();
  if (jam >= 4 && jam < 11) return "pagi";
  if (jam >= 11 && jam < 15) return "siang";
  if (jam >= 15 && jam < 18) return "sore";
  return "malam";
}

export default function BarMerek({
  onBeranda,
  onBukaNotif,
}: {
  onBeranda: () => void;
  onBukaNotif?: () => void;
}) {
  const { data: profil } = useProfil();
  const [waktu, setWaktu] = useState<Waktu>(hitungWaktu);

  useEffect(() => {
    const timer = window.setInterval(() => setWaktu(hitungWaktu()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const sapaan = sapaanWaktu[waktu];

  return (
    <header className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onBeranda}
        aria-label="Beranda"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white ring-1 ring-line shadow-xs transition active:scale-95"
      >
        <img
          src={profil?.logo || "/logo-persis.png"}
          alt="Logo PERSIS Cibatu"
          className="h-8 w-8 rounded-full object-contain"
          draggable={false}
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-header truncate text-[14px] leading-tight font-extrabold tracking-[-0.01em] text-ink-900">
            {sapaan.teks}
          </p>
          <span
            aria-hidden="true"
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${sapaan.latar} ${sapaan.warna}`}
          >
            <Icon name={sapaan.ikon} className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] leading-tight font-semibold text-ink-400">
          {profil?.namaSekolah || "Jama'ah Persis Cibatu"}
        </p>
      </div>

      <button
        type="button"
        onClick={onBukaNotif}
        aria-label="Notifikasi"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-white text-ink-700 ring-1 ring-line shadow-xs transition active:scale-95"
      >
        <Icon name="bell" className="h-[17px] w-[17px]" />
      </button>
    </header>
  );
}
