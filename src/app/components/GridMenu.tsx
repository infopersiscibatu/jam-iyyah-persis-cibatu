import { Icon } from "./Icons";

const menuCepat = [
  { id: "berita", label: "Berita", ikon: "newspaper", tujuan: "berita" },
  { id: "artikel", label: "Artikel", ikon: "book-open", tujuan: "artikel" },
  { id: "kajian", label: "Kajian", ikon: "megaphone", tujuan: "kajian" },
  { id: "jenjang", label: "Jenjang", ikon: "academic", tujuan: "jenjang" },
  { id: "spmb", label: "SPMB", ikon: "clipboard", tujuan: "spmb" },
  { id: "galeri", label: "Galeri", ikon: "photo", tujuan: "galeri" },
  { id: "profil", label: "Profil", ikon: "building", tujuan: "profil" },
  { id: "kontak", label: "Kontak", ikon: "phone", tujuan: "kontak" },
];

export default function GridMenu({
  onSelect,
}: {
  onSelect: (halaman: string, label: string) => void;
}) {
  return (
    <section aria-label="Menu cepat" id="menu" className="w-full">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-header text-[14.5px] leading-tight font-extrabold tracking-[-0.01em] text-ink-900">
          Jelajahi
        </h2>
        <span className="text-[10.5px] font-semibold text-ink-400">Layanan jamaah</span>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {menuCepat.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.tujuan, m.label)}
            aria-label={m.label}
            data-testid={`menu-${m.id}`}
            className="flex w-full flex-col items-center gap-1.5 rounded-2xl py-0.5 transition active:scale-95"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] border border-line bg-mist text-ink-900 shadow-xs">
              <Icon name={m.ikon} className="h-[21px] w-[21px]" />
            </span>
            <span className="w-full truncate text-center text-[9.5px] leading-3 font-semibold text-ink-600">
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
