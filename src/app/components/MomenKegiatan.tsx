import { Button } from "@/components/ui/button";
import { useGaleri } from "../lib/galeri";
import JudulSeksi from "./JudulSeksi";

export default function MomenKegiatan({ onBuka }: { onBuka: () => void }) {
  const data = useGaleri();
  const foto = data.dariDatabase ? data.foto.filter((f) => f.aktif && f.gambar).slice(0, 4) : [];
  if (!foto.length) return null;
  return <section aria-label="Momen kegiatan">
    <JudulSeksi title="Momen Kegiatan" subtitle="Dokumentasi terbaru" onAction={onBuka} />
    <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
      {foto.map((f) => <Button variant="ghost" key={f.id} onClick={onBuka} aria-label={`Lihat momen: ${f.judul}`} className="block h-auto w-[164px] shrink-0 overflow-hidden rounded-[14px] border border-line bg-surface p-0 text-left whitespace-normal">
        <img src={f.gambar} alt={f.judul} loading="lazy" className="h-[92px] w-full object-cover" />
        <span className="block p-2.5"><span className="block text-[7.5px] font-extrabold text-gold-600 uppercase">{f.kategori}</span><span className="mt-1 block line-clamp-2 text-[10.5px] leading-snug font-bold text-ink-900">{f.judul}</span></span>
      </Button>)}
    </div>
  </section>;
}