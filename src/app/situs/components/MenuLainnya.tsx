import { useEffect } from "react";
import type { MenuCepat } from "../lib/content";
import { Icon } from "./Icons";

/**
 * Panel bawah berisi menu lain yang tidak tampil sebagai kartu akses cepat:
 * Profil, Galeri, Kajian, Kontak, dan seterusnya (isi dari database).
 */
export default function MenuLainnya({
  open,
  onClose,
  menu,
  onPilih,
}: {
  open: boolean;
  onClose: () => void;
  menu: MenuCepat[];
  onPilih: (halaman: string, label: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tekan);
    const sebelum = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = sebelum;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Menu lainnya"
      data-testid="menu-lainnya"
    >
      <button
        type="button"
        aria-label="Tutup menu lainnya"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/35 backdrop-blur-[2px]"
      />
      <div className="popup-panel relative flex max-h-[86vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[22px] bg-white shadow-[0_-24px_60px_-30px_rgba(17,24,20,0.5)]">
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-line" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-header text-[15px] leading-snug font-extrabold text-ink-900">Menu lainnya</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-400">
              Layanan jama'ah PC PERSIS Cibatu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            data-testid="menu-lainnya-tutup-x"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink-600 transition active:scale-95"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3.5 pb-3">
          <ul className="grid grid-cols-2 gap-2.5">
            {menu.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onPilih(m.halaman, m.label)}
                  aria-label={m.label}
                  data-testid={`menu-lainnya-${m.halaman}`}
                  className="card-line flex h-full w-full items-center gap-2.5 p-3 text-left transition active:scale-[0.98]"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white"
                    style={{ backgroundColor: m.warna }}
                    aria-hidden="true"
                  >
                    <Icon name={m.ikon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] leading-tight font-extrabold text-ink-900">
                      {m.label}
                    </span>
                    {m.sub ? <span className="mt-0.5 block truncate text-[9px] text-ink-400">{m.sub}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="shrink-0 border-t border-line bg-white px-5 pt-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="menu-lainnya-tutup"
            className="w-full rounded-full bg-persis-900 py-3 text-[12px] font-bold text-white transition active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
