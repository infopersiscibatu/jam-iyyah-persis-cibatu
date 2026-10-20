import { agendaTerdekat, useAgenda, type AgendaTampil } from "../lib/agenda";
import { tanggalPanjang } from "../lib/format";
import { Icon } from "./Icons";

function sisaHari(tanggal: string): number {
  const t = new Date(tanggal.length <= 10 ? `${tanggal}T00:00:00` : tanggal).getTime();
  const hariIni = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((t - hariIni) / (1000 * 60 * 60 * 24));
}

export default function KartuAgenda({ onBuka }: { onBuka: (a: AgendaTampil) => void }) {
  const data = useAgenda();
  const daftar = agendaTerdekat(data, 1);
  const a = daftar[0];

  if (!a) return null;

  const sisa = Math.max(0, sisaHari(a.date));
  const derajat = Math.min(360, Math.max(26, (1 - Math.min(sisa, 30) / 30) * 360));

  return (
    <button
      type="button"
      onClick={() => onBuka(a)}
      aria-label={`Agenda terdekat: ${a.title}`}
      data-testid="kartu-agenda"
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3.5 text-left shadow-xs transition active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-100 text-persis-900">
        <Icon name="calendar" className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[8px] font-extrabold tracking-[0.16em] text-ink-400 uppercase">
          Agenda terdekat
        </span>
        <span className="mt-1 block line-clamp-2 text-[12.5px] leading-snug font-extrabold text-ink-900">
          {a.title}
        </span>
        <span className="mt-1 block truncate text-[9.5px] text-ink-400">
          {tanggalPanjang(a.date)} {a.time ? `· ${a.time}` : ""}
        </span>
      </span>

      <span
        className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(#1b8f4f ${derajat}deg, #e7f0ea 0deg)` }}
        aria-hidden="true"
      >
        <span className="grid h-[44px] w-[44px] place-items-center rounded-full bg-white">
          <span className="text-center">
            <span className="block text-[14px] leading-none font-extrabold text-ink-900 tabular-nums">
              {sisa === 0 ? "Hari" : sisa}
            </span>
            <span className="mt-0.5 block text-[7px] font-bold tracking-[0.08em] text-ink-400 uppercase">
              {sisa === 0 ? "ini" : "hari"}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
