import type { ReactNode } from "react";
import { Icon } from "./Icons";
import { Button } from "@/components/ui/button";

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
  tone?: "green" | "gold";
  actionLabel?: string | null;
  judulId?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {false && icon ? (
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
            className={`font-header truncate text-[14.5px] font-extrabold text-ink-900 ${eyebrow ? "mt-1" : ""}`}
          >
            {title}
          </h2>
          {subtitle ? <p className="mt-0.5 truncate text-[10px] text-ink-400">{subtitle}</p> : null}
        </div>
      </div>

      {actionLabel && onAction ? (
        <Button variant="ghost" onClick={onAction} className="h-auto shrink-0 gap-0.5 px-1 py-1 text-[10px] font-semibold text-persis-800">
          {actionLabel}
          <Icon name="chevron-right" className="h-3.5 w-3.5 text-gold-600" />
        </Button>
      ) : null}
    </div>
  );
}
