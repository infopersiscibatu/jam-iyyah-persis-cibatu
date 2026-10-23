import { useEffect, useRef, useState } from "react";
import { carousel } from "../lib/content";

const halamanSorotan: Record<string, { halaman: string; label: string }> = {
  Pendidikan: { halaman: "jenjang", label: "Jenjang Pendidikan" },
  "SPMB 2026/2027": { halaman: "ppdb", label: "SPMB" },
  "Kajian & Dakwah": { halaman: "kajian", label: "Kajian" },
  "Tahfizhul Qur'an": { halaman: "tahfizh", label: "Program Tahfizh" },
};

/** Carousel sorotan di bawah kepala beranda: bergeser sendiri, bisa digeser tangan. */
export default function Sorotan({
  onPilih,
}: {
  onPilih: (halaman: string, label: string) => void;
}) {
  const [aktif, setAktif] = useState(0);
  const sentuhAwal = useRef<number | null>(null);
  const jumlah = carousel.length;

  useEffect(() => {
    const jam = window.setInterval(() => setAktif((i) => (i + 1) % jumlah), 5200);
    return () => window.clearInterval(jam);
  }, [jumlah, aktif]);

  const geser = (arah: number) => setAktif((i) => (i + arah + jumlah) % jumlah);

  const buka = (tag: string) => {
    const tujuan = halamanSorotan[tag];
    if (tujuan) onPilih(tujuan.halaman, tujuan.label);
  };

  return (
    <section aria-label="Sorotan beranda" aria-roledescription="carousel" data-testid="carousel-sorotan">
      <div
        className="relative h-[178px] overflow-hidden rounded-[18px] bg-persis-900 shadow-[0_20px_34px_-26px_rgba(7,41,26,0.9)]"
        onTouchStart={(e) => {
          sentuhAwal.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (sentuhAwal.current === null) return;
          const jarak = e.changedTouches[0].clientX - sentuhAwal.current;
          if (Math.abs(jarak) > 40) geser(jarak < 0 ? 1 : -1);
          sentuhAwal.current = null;
        }}
      >
        {carousel.map((s, i) => {
          const ini = i === aktif;
          return (
            <div
              key={s.id}
              aria-hidden={!ini}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                ini ? "scale-100 opacity-100" : "pointer-events-none scale-[1.04] opacity-0"
              }`}
            >
              <img
                src={s.gambarUrl}
                alt=""
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#052414]/95 via-[#052414]/45 to-transparent" />

              <button
                type="button"
                onClick={() => buka(s.tag)}
                tabIndex={ini ? 0 : -1}
                aria-label={`Sorotan: ${s.judul}`}
                data-testid={`sorotan-${i + 1}`}
                className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 px-4 pt-4 pb-[18px] text-left transition active:opacity-90"
              >
                <span className="rounded-full bg-gold-300 px-2 py-[3px] text-[8px] font-extrabold tracking-[0.12em] text-persis-950 uppercase">
                  {s.tag}
                </span>
                <span className="line-clamp-2 text-[13px] leading-snug font-extrabold text-white">
                  {s.judul}
                </span>
              </button>
            </div>
          );
        })}

        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/30 px-2 py-1.5 backdrop-blur-sm">
          {carousel.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setAktif(i)}
              aria-label={`Tampilkan sorotan ${i + 1}: ${s.tag}`}
              aria-current={i === aktif ? "true" : undefined}
              data-testid={`sorotan-titik-${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === aktif ? "w-4 bg-gold-300" : "w-1.5 bg-white/55 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
