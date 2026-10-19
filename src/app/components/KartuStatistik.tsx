import { statistikTampil, useBeranda } from "../lib/beranda";
const tema = ["bg-stat-green text-stat-green-ink", "bg-stat-blue text-stat-blue-ink", "bg-stat-gold text-stat-gold-ink"];
const label = ["text-stat-green-label", "text-stat-blue-label", "text-stat-gold-label"];
export default function KartuStatistik() {
  const statistik = statistikTampil(useBeranda());
  if (!statistik.length) return null;
  return <dl data-testid="hero-stats" className="grid grid-cols-3 gap-2">
    {statistik.map((s,i) => <div key={s.id} data-testid={`stat-kartu-${s.id}`} className={`min-w-0 rounded-[14px] px-2.5 py-3 text-center ${tema[i % tema.length]}`}>
      <dt className="sr-only">{s.label}</dt><dd>
        <span data-testid={`stat-${s.id}`} aria-label={`${s.label}: ${s.nilai}${s.satuan ? ` ${s.satuan}` : ""}`} className="font-header block text-[17px] leading-none font-extrabold tabular-nums">{s.nilai}</span>
        <span className={`mt-1.5 block text-[7.5px] font-bold uppercase ${label[i % label.length]}`}>{s.labelPendek}</span>
      </dd></div>)}
  </dl>;
}
