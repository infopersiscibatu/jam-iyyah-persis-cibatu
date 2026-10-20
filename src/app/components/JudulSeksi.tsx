import type { ReactNode } from "react";
import { Icon } from "./Icons";

export default function JudulSeksi({
  title,
  subtitle,
  eyebrow,
  icon,
  tone = "green",
  actionLabel = "Lihat semua",
  judulId,
  onAction,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  tone?: "green" | "gold" | "brand" | string;
  actionLabel?: string | null;
  judulId?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
              tone === "gold"
                ? "border-gold-400/30 bg-cream-100 text-gold-600"
                : "border-persis-700/10 bg-mint-100 text-persis-800"
            }`}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[9.5px] font-bold tracking-[0.2em] text-persis-900 uppercase">{eyebrow}</p>
          ) : null}
          <h2
            id={judulId}
            className={`font-header truncate text-[14.5px] font-extrabold tracking-[-0.01em] text-ink-900 ${
              eyebrow ? "mt-0.5" : ""
            }`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="truncate text-[11px] font-medium text-ink-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-persis-900 transition hover:underline active:scale-95"
        >
          {actionLabel}
          <Icon name="chevron-right" className="h-3 w-3 text-gold-600" />
        </button>
      ) : actionLabel ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 px-1 py-1 text-[11px] font-semibold text-persis-900">
          {actionLabel}
          <Icon name="chevron-right" className="h-3.5 w-3.5 text-gold-600" />
        </span>
      ) : null}
    </div>
  );
}
