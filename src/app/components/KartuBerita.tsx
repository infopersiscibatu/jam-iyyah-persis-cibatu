import JudulSeksi from "./JudulSeksi";
import { Icon } from "./Icons";
import type { Berita } from "../data/content";
import { angkaRingkas, tanggalRelatif } from "../lib/format";

export type ItemKartu = {
  slug: string;
  tujuan: string;
  kategori: string;
  judul: string;
  ringkasan: string;
  tanggalTeks: string;
  metaIkon: "jam" | "mata";
  metaTeks: string;
  gambar: string;
};

/** Kartu berita/artikel pada daftar — sama seperti situs rujukan. */
export default function KartuBerita({ item, onOpen }: { item: ItemKartu; onOpen: () => void }) {
  return (
    <a
      href={`#${item.tujuan}/${item.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      className="flex items-stretch gap-3 rounded-[14px] border border-line bg-surface p-2.5 transition active:bg-mist"
    >
      <img src={item.gambar} alt="" loading="lazy" className="h-[70px] w-[94px] shrink-0 rounded-[10px] object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-extrabold text-gold-600 uppercase">{item.kategori}</p>
        <h3 className="mt-1 line-clamp-2 text-[11.5px] leading-snug font-bold text-ink-900">{item.judul}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-ink-400"><span>{item.tanggalTeks}</span><span>·</span><span className="inline-flex items-center gap-1"><Icon name={item.metaIkon === "jam" ? "clock" : "eye"} className="h-3 w-3" />{item.metaTeks}</span></p>
      </div>
    </a>
  );
}

/** Kartu "Baca juga" yang diselipkan di antara paragraf isi berita. */
export function KartuBacaJuga({ item, onOpen }: { item: ItemKartu; onOpen: () => void }) {
  return (
    <a
      href={`#${item.tujuan}/${item.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      className="block rounded-r-xl border-l-[3px] border-l-gold-500 bg-cream-100/70 px-3.5 py-2.5 transition active:bg-cream-50"
    >
      <p className="text-[9.5px] font-bold tracking-[0.16em] text-persis-900 uppercase">Baca juga</p>
      <p className="mt-1 text-[12px] leading-snug font-semibold text-persis-800">{item.judul}</p>
    </a>
  );
}

/** Daftar berita paling banyak dibaca (dipakai di beranda dan halaman berita). */
export function BagianTrending({
  title = "Berita Trending",
  subtitle = "Paling banyak dibaca",
  items,
  total,
  onOpen,
}: {
  title?: string;
  subtitle?: string;
  items: Berita[];
  total?: number;
  onOpen: (b: Berita) => void;
}) {
  return (
    <section aria-label={title}>
      <JudulSeksi
        icon={<Icon name="flame" className="h-[18px] w-[18px]" />}
        title={title}
        subtitle={subtitle}
        actionLabel={null}
      />
      <ol className="card-line divide-y divide-line overflow-hidden">
        {items.map((n, i) => (
          <li key={n.id}>
            <a
              href={`#berita/${n.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onOpen(n);
              }}
              className="flex items-center gap-3 px-3.5 py-3 transition active:bg-mist"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-stat-green text-[10px] font-extrabold text-persis-800">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[11.5px] leading-snug font-semibold text-ink-900">{n.title}</h3>
                <p className="mt-0.5 flex items-center gap-2 text-[9.5px] text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    {angkaRingkas(n.views)} dibaca
                  </span>
                  <span>·</span>
                  <span>{tanggalRelatif(n.date)}</span>
                </p>
              </div>
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-center text-[9.5px] text-ink-400">
        {items.length} teratas dari {total ?? items.length} berita
      </p>
    </section>
  );
}
