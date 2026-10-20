import DaftarKonten from "../components/DaftarKonten";
import { artikelTerbaru, kategoriArtikel, useArtikel } from "../lib/artikel";
import { tanggalRelatif } from "../lib/format";

export default function HalamanArtikel({ onBuka }: { onBuka: (slug: string) => void }) {
  const data = useArtikel();
  const items = artikelTerbaru(data).map((a) => ({
    id: String(a.id),
    slug: a.slug,
    kategori: a.kategori,
    judul: a.judul,
    gambar: a.gambar,
    tanggal: tanggalRelatif(a.tanggal),
    meta: `${a.menitBaca} menit`,
    metaIkon: "clock" as const,
  }));
  return (
    <DaftarKonten
      testId="artikel-page"
      judul={data.halaman.judul}
      subjudul="Bacaan ringan untuk jama'ah"
      satuan="artikel"
      items={items}
      kategori={kategoriArtikel(data)}
      kosong="Belum ada artikel yang terbit."
      onBuka={onBuka}
    />
  );
}
