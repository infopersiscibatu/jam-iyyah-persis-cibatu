import { useJenjang } from "../lib/jenjang";

const tema = [
  { latar: "bg-[#e7f4ec]", angka: "text-[#0f5a34]", label: "text-[#4c8666]" },
  { latar: "bg-[#e9effd]", angka: "text-[#33599f]", label: "text-[#647fb6]" },
  { latar: "bg-[#fdf2e0]", angka: "text-[#a06a1c]", label: "text-[#b38d54]" },
];

export default function KartuStatistik() {
  const data = useJenjang();

  const totalJenjang = data.jenjang?.length || 5;
  const totalSantri = data.unit?.reduce((acc, u) => acc + (u.siswa || 0), 0) || 1240;
  const totalPengajar = data.unit?.reduce((acc, u) => acc + ((u.guru || 0) + (u.staf || 0)), 0) || 86;

  const stats = [
    { id: "jenjang", nilai: totalJenjang, label: "Jenjang", sub: "Pendidikan" },
    { id: "santri", nilai: totalSantri.toLocaleString("id-ID"), label: "Santri", sub: "Terdaftar" },
    { id: "pengajar", nilai: totalPengajar, label: "Asatidz", sub: "Pendidik" },
  ];

  return (
    <dl data-testid="hero-stats" className="grid grid-cols-3 gap-2">
      {stats.map((s, i) => {
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
                className={`font-header block text-[17px] leading-none font-extrabold tabular-nums ${warna.angka}`}
              >
                {s.nilai}
              </span>
              <span className={`mt-1.5 block text-[7.5px] font-bold tracking-[0.12em] uppercase ${warna.label}`}>
                {s.sub}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
