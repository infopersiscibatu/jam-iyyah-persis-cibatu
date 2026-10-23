export default function JudulSeksi({
  title,
  subtitle,
  actionLabel = "Lihat semua",
  onAction,
  align = "kiri",
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string | null;
  onAction?: () => void;
  /** kiri = judul & sub bertumpuk kiri (aksi di kanan), tengah = semua di tengah, kanan = judul kiri & sub di pojok kanan */
  align?: "kiri" | "tengah" | "kanan";
}) {
  const aksi = actionLabel ? (
    onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 text-[10.5px] font-semibold text-ink-400 transition active:opacity-60"
      >
        {actionLabel}
      </button>
    ) : (
      <span className="shrink-0 text-[10.5px] font-semibold text-ink-400">{actionLabel}</span>
    )
  ) : null;

  if (align === "kanan") {
    return (
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-header min-w-0 truncate text-[14.5px] leading-tight font-extrabold tracking-[-0.01em] text-ink-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="min-w-0 shrink-0 text-right text-[9.5px] leading-tight text-ink-400">
            {subtitle}
          </p>
        ) : aksi}
      </div>
    );
  }

  if (align === "tengah") {
    return (
      <div className="mb-3 flex flex-col items-center gap-1 text-center">
        <h2 className="font-header min-w-0 truncate text-[14.5px] leading-tight font-extrabold tracking-[-0.01em] text-ink-900">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[10px] text-ink-400">{subtitle}</p> : null}
        {aksi ? <div className="mt-1">{aksi}</div> : null}
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-header truncate text-[14.5px] leading-tight font-extrabold tracking-[-0.01em] text-ink-900">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 truncate text-[10px] text-ink-400">{subtitle}</p> : null}
      </div>
      {aksi}
    </div>
  );
}
