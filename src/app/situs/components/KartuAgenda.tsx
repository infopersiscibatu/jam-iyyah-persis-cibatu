import { agendaTerdekat, type Agenda } from "../lib/content";
import { hariTersisa, tanggalPanjang } from "../lib/format";
import { Icon } from "./Icons";

/** Kartu sorotan agenda terdekat dengan cincin hitung hari. */
export default function KartuAgenda({ onBuka }: { onBuka: (a: Agenda) => void }) {
  const a = agendaTerdekat(1)[0];
  if (!a) return null;

  const sisa = Math.max(0, hariTersisa(a.date));
  const derajat = Math.min(360, Math.max(26, (1 - Math.min(sisa, 30) / 30) * 360));

  return (
    <button
      type="button"
      onClick={() => onBuka(a)}
      aria-label={`Agenda terdekat: ${a.title}`}
      data-testid="kartu-agenda"
      className="card-line flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-100 text-persis-800">
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
          {tanggalPanjang(a.date)} · {a.time}
        </span>
      </span>

      <span
        className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(#1b8f4f ${derajat}deg, #e7f0ea 0deg)` }}
        aria-hidden="true"
      >
        <span className="grid h-[45px] w-[45px] place-items-center rounded-full bg-white">
          <span className="text-center">
            <span className="block text-[15px] leading-none font-extrabold text-ink-900 tabular-nums">
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
