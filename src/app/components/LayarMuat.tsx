import { useProfil } from "../lib/profil";
import { useMuatAwal } from "../lib/muatAwal";

/**
 * Layar pembuka situs: logo lembaga, teks "Memuat Data", dan garis kemajuan.
 *
 * Tampil selama seluruh data situs (identitas, beranda, berita, artikel, agenda,
 * galeri, kajian, SPMB, jenjang, kontak, donasi, iklan) masih diambil dari layanan,
 * supaya pengunjung tidak melihat halaman kosong atau setengah jadi — termasuk ketika
 * alamatnya langsung menuju halaman panel atau satu berita tertentu.
 */
export default function LayarMuat() {
  const { identitas } = useProfil();
  const { selesai, total, beres } = useMuatAwal();

  const persen = beres || total === 0 ? 100 : Math.min(100, Math.round((selesai / total) * 100));

  return (
    <div
      data-testid="layar-muat"
      role="status"
      aria-live="polite"
      aria-label="Memuat data situs"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3.5 bg-persis-900 px-8 text-center text-white"
    >
      {/* Logo tampil langsung tanpa latar: berkas logonya sudah berlatarbelakang transparan. */}
      <img
        data-testid="layar-muat-logo"
        src={identitas.logo}
        alt={identitas.logoAlt}
        className="h-24 w-24 rounded-full object-contain"
        draggable={false}
      />

      <p className="font-header mt-1 text-[15px] leading-tight font-extrabold tracking-[0.01em]">Memuat Data</p>
      <p className="max-w-[280px] text-[11px] leading-relaxed text-white/70">{identitas.namaLengkap}</p>

      {/* Garis kemajuan: seberapa banyak bagian situs yang sudah siap ditampilkan. */}
      <span className="mt-1 h-1 w-[150px] overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <span
          data-testid="layar-muat-kemajuan"
          className="block h-full rounded-full bg-gold-300 transition-[width] duration-300 ease-out"
          style={{ width: `${persen}%` }}
        />
      </span>

      <span className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 0.16}s` }}
            className="muat-titik block h-1.5 w-1.5 rounded-full bg-gold-300"
          />
        ))}
      </span>

      <p data-testid="layar-muat-keterangan" className="text-[10px] font-medium tracking-wide text-white/55">
        {beres ? "Menyiapkan tampilan…" : `${selesai} dari ${total} bagian siap`}
      </p>
    </div>
  );
}
