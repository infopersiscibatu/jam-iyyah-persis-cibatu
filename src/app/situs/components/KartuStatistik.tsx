import { statistik } from "../lib/content";

/** Tiga angka ringkas dengan latar warna berbeda supaya beranda lebih hidup. */
const tema = [
  { latar: "bg-[#e7f4ec]", angka: "text-[#0f5a34]", label: "text-[#4c8666]" },
  { latar: "bg-[#e9effd]", angka: "text-[#33599f]", label: "text-[#647fb6]" },
  { latar: "bg-[#fdf2e0]", angka: "text-[#a06a1c]", label: "text-[#b38d54]" },
];

export default function KartuStatistik() {
  return (
    <dl data-testid="hero-stats" className="grid grid-cols-3 gap-2">
      {statistik.map((s, i) => {
        const warna = tema[i % tema.length];
        return (
          <div
            key={s.id}
            data-testid={`stat-kartu-${s.id}`}
            className={`rounded-[14px] px-2.5 py-3 text-center ${warna.latar}`}
          >
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <span
                data-testid={`stat-${s.id}`}
                aria-label={`${s.label}: ${s.nilai}`}
                className={`font-header block text-[17px] leading-none font-extrabold tabular-nums ${warna.angka}`}
              >
                {s.nilai}
              </span>
              <span
                className={`mt-1.5 block text-[7.5px] font-bold tracking-[0.12em] uppercase ${warna.label}`}
              >
                {s.labelPendek}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
