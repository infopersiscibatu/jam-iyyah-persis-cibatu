import { useEffect, useState } from "react";
import BerandaSitus from "../situs/pages/Beranda";
import { Icon } from "../situs/components/Icons";
import { berita } from "../situs/lib/content";
import { muatDataSitus, terapkanDataTersimpan } from "../situs/muatData";

/**
 * Beranda PERSIS Cibatu dengan desain baru — sama seperti beranda situs versi
 * mobile (kepala sapaan, sorotan bergambar, angka ringkas, agenda, layanan,
 * pengumuman, momen kegiatan, dan berita trending).
 *
 * Berkas ini penghubung antara desain baru (folder src/app/situs) dan aplikasi lama:
 *  - isinya diambil dari database lewat muatDataSitus();
 *  - tombol menu memakai `onPilihMenu` milik aplikasi lama;
 *  - berita yang ditekan memanggil `onBukaBerita` dengan slug beritanya.
 */

const KUNCI_DIBACA = "persis-cibatu-notif-situs";

function bacaDibaca(): string[] {
  try {
    const teks = window.localStorage.getItem(KUNCI_DIBACA);
    return teks ? (JSON.parse(teks) as string[]) : [];
  } catch {
    return [];
  }
}

function simpanDibaca(ids: string[]) {
  try {
    window.localStorage.setItem(KUNCI_DIBACA, JSON.stringify(ids));
  } catch {
    /* penyimpanan peramban tidak tersedia — abaikan */
  }
}

/** Pesan singkat di bagian bawah layar, seperti toast pada situs baru. */
function Toast({ pesan, onTutup }: { pesan: string; onTutup: () => void }) {
  useEffect(() => {
    const jam = window.setTimeout(onTutup, 3600);
    return () => window.clearTimeout(jam);
  }, [pesan, onTutup]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast-beranda"
      className="fixed inset-x-0 bottom-4 z-[70] mx-auto w-[calc(100%-2.5rem)] max-w-[420px]"
    >
      <div className="flex items-center gap-2.5 rounded-[14px] bg-ink-900 px-4 py-3 text-white shadow-[0_18px_36px_-18px_rgba(7,41,26,0.7)]">
        <Icon name="info" className="h-4 w-4 shrink-0 text-gold-300" />
        <p className="min-w-0 flex-1 text-[11px] leading-snug font-semibold">{pesan}</p>
        <button
          type="button"
          onClick={onTutup}
          aria-label="Tutup pesan"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 active:scale-95"
        >
          <Icon name="x" className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function Beranda({
  onPilihMenu,
  onBukaBerita,
}: {
  /** Pindah halaman memakai penamaan halaman aplikasi lama (berita, galeri, info, …). */
  onPilihMenu: (halaman: string, slug?: string) => void;
  /** Membuka satu berita: aplikasi lama memakai slug berita. */
  onBukaBerita: (berita: { slug: string }) => void;
}) {
  /* Salinan kunjungan sebelumnya dipasang lebih dulu supaya halaman langsung penuh. */
  const [versi, setVersi] = useState(() => {
    terapkanDataTersimpan();
    return 0;
  });
  const [pesan, setPesan] = useState<string | null>(null);
  const [dibaca, setDibaca] = useState<string[]>(bacaDibaca);

  /* Isi situs disegarkan dari database di belakang layar. */
  useEffect(() => {
    let hidup = true;
    void muatDataSitus()
      .catch(() => null)
      .finally(() => {
        if (hidup) setVersi((v) => v + 1);
      });
    return () => {
      hidup = false;
    };
  }, []);

  const tandai = (ids: string[]) => {
    const baru = [...new Set([...dibaca, ...ids])];
    setDibaca(baru);
    simpanDibaca(baru);
  };

  const munculkanLagi = () => {
    setDibaca([]);
    simpanDibaca([]);
  };

  return (
    <div className="beranda-situs" data-muat={versi}>
      {/* data-muat berubah setiap data database selesai dimuat, memaksa tampilan segar. */}
      <BerandaSitus
        onPilihHalaman={(halaman) => onPilihMenu(halaman)}
        onBukaBerita={(id) => {
          const cocok = berita.find((b) => b.id === id);
          if (cocok) onBukaBerita({ slug: cocok.slug });
        }}
        onInfo={setPesan}
        dibaca={dibaca}
        onTandai={tandai}
        onMunculkanLagi={munculkanLagi}
      />

      {pesan ? <Toast pesan={pesan} onTutup={() => setPesan(null)} /> : null}
    </div>
  );
}
