import { useEffect } from "react";
import { Icon } from "./Icons";
import { BlokIsi } from "../../components/IsiKaya";

/** Jendela bawah untuk membaca detail pengumuman dan agenda di beranda. */
export default function Popup({
  open,
  onClose,
  title,
  keterangan,
  detail,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  keterangan?: string;
  detail: string[];
  testId?: string;
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
      aria-label={title}
      data-testid={testId}
    >
      <button
        type="button"
        aria-label="Tutup detail"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/35 backdrop-blur-[2px]"
      />
      <div className="popup-panel relative flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[22px] bg-white shadow-[0_-24px_60px_-30px_rgba(17,24,20,0.5)]">
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-line" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-header text-[15px] leading-snug font-extrabold text-ink-900">{title}</h2>
            {keterangan ? <p className="mt-1 text-[10px] leading-relaxed text-ink-400">{keterangan}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            data-testid="popup-tutup-x"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink-600 transition active:scale-95"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3.5 pb-5">
          <div className="space-y-3 border-t border-line pt-3.5">
            {detail.map((par, i) => (
              <BlokIsi
                key={i}
                teks={par}
                className={`text-justify leading-relaxed ${
                  i === 0 ? "text-[12.5px] font-medium text-ink-900" : "text-[12px] text-ink-600"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className="shrink-0 border-t border-line bg-white px-5 pt-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="popup-tutup"
            className="w-full rounded-full bg-persis-900 py-3 text-[12px] font-bold text-white transition active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
