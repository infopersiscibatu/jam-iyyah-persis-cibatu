import { Button } from "@/components/ui/button";
import JudulSeksi from "./JudulSeksi";
import { gridTampil, useBeranda } from "../lib/beranda";
import { Icon } from "./Icons";



export default function GridMenu({ onSelect }: { onSelect: (halaman: string) => void }) {
  const menu = gridTampil(useBeranda());

  return (
    <section aria-label="Menu utama" id="menu" className="w-full">
      <JudulSeksi title="Akses Cepat" subtitle="Pilihan menu jama’ah Persis Cibatu" actionLabel={null} />
      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {menu.map((m) => (
          <Button variant="ghost"
            key={m.id}
            type="button"
            onClick={() => onSelect(m.halaman)}
            aria-label={m.label}
            data-testid={`menu-${m.halaman}`}
            data-menu-id={m.id}
            className="flex h-auto w-full flex-col items-center gap-1.5 rounded-2xl px-0 py-0.5 transition active:scale-95"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] border border-line bg-mist text-ink-900">
              <Icon name={m.ikon} className="h-[22px] w-[22px]" />
            </span>
            <span className="w-full truncate text-center text-[9.5px] leading-3 font-semibold text-ink-600">
              {m.label}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
