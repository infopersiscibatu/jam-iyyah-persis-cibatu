import DaftarKonten from "../components/DaftarKonten";
import { beritaTerbaru, kategoriBerita, useBerita } from "../lib/berita";
import { angkaRingkas, tanggalRelatif } from "../lib/format";

export default function HalamanBerita({ onBuka }: { onBuka: (slug: string) => void }) {
  const data = useBerita();
  const items = beritaTerbaru(data).map((b) => ({
    id: String(b.id),
    slug: b.slug,
    kategori: b.category,
    judul: b.title,
    gambar: b.image,
    tanggal: tanggalRelatif(b.date),
    meta: angkaRingkas(b.views),
    metaIkon: "eye" as const,
  }));
  return (
    <DaftarKonten
      testId="berita-page"
      judul={data.halaman.judul}
      subjudul="Kabar terbaru dari PC PERSIS Cibatu"
      satuan="berita"
      items={items}
      kategori={kategoriBerita(data)}
      kosong="Belum ada berita yang terbit."
      onBuka={onBuka}
    />
  );
}
