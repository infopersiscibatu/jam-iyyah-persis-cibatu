import { useState } from "react";
import JudulSeksi from "./JudulSeksi";
import MenuLainnya from "./MenuLainnya";
import { Icon } from "./Icons";
import { aksesCepat } from "../lib/content";

/**
 * Empat kartu akses cepat berwarna. Tombol "Lihat semua" membuka panel bawah
 * berisi sisa menu yang tersimpan di database — tidak ada menu tambahan karangan,
 * jadi tombol itu hanya muncul bila memang ada menu lain.
 */
export default function StatusLayanan({
  onPilih,
}: {
  onPilih: (halaman: string, label: string) => void;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const kartu = aksesCepat.slice(0, 4);
  const lainnya = aksesCepat.slice(4);

  return (
    <section aria-label="Akses cepat">
      <JudulSeksi
        title="Akses Cepat"
        subtitle="Pilihan menu jama'ah Persis Cibatu"
        onAction={lainnya.length ? () => setTerbuka(true) : undefined}
        actionLabel={lainnya.length ? "Lihat semua" : null}
      />

      <div className="grid grid-cols-2 gap-2.5">
        {kartu.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => onPilih(k.halaman, k.label)}
            aria-label={k.label}
            data-testid={`status-${k.halaman}`}
            className="flex min-h-[88px] flex-col justify-between rounded-[14px] p-3 text-left text-white shadow-[0_12px_22px_-18px_rgba(17,24,20,0.75)] transition active:scale-[0.98]"
            style={{ backgroundColor: k.warna }}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-[11.5px] leading-tight font-extrabold">{k.label}</span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-white/25">
                <Icon name={k.ikon} className="h-3.5 w-3.5" />
              </span>
            </span>
            <span className="mt-3 block text-[8.5px] font-medium text-white/85">{k.sub}</span>
          </button>
        ))}
      </div>

      <MenuLainnya
        open={terbuka}
        onClose={() => setTerbuka(false)}
        menu={lainnya}
        onPilih={(halaman, label) => {
          setTerbuka(false);
          onPilih(halaman, label);
        }}
      />
    </section>
  );
}
