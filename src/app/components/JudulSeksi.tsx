import type { ReactNode } from "react";

export default function JudulSeksi({
  title,
  subtitle,
  onAction,
  actionLabel = "Lihat semua",
}: {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-header text-[14px] leading-tight font-extrabold tracking-[-0.01em] text-ink-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[10.5px] font-medium text-ink-400">{subtitle}</p>
        ) : null}
      </div>

      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-[10.5px] font-bold text-persis-900 hover:underline"
        >
          {actionLabel} ›
        </button>
      ) : null}
    </div>
  );
}
