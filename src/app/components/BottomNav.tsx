import { navTampil, useBeranda } from "../lib/beranda";
import { Icon } from "./Icons";

export type TabId = "beranda" | "berita" | "ppdb" | "artikel" | "info";

/**
 * Navigasi bawah situs.
 *
 * Ada dua tampilan, isinya sama (ikon + nama menu di bawah ikon):
 *  - `melayang` → dipakai di halaman beranda: batang mengambang, membulat penuh,
 *    berjarak dari tepi layar, tab aktif berupa pil hijau.
 *  - biasa (bawaan) → dipakai halaman lain: batang penuh menempel di bawah layar
 *    dengan garis pemisah, seperti desain sebelumnya.
 */
export default function BottomNav({
  active,
  onChange,
  melayang = false,
}: {
  active: string | null;
  onChange: (t: string) => void;
  /** Tampilan mengambang, khusus halaman beranda. */
  melayang?: boolean;
}) {
  const tab = navTampil(useBeranda());

  if (melayang) {
    return (
      <nav
        aria-label="Navigasi bawah"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-2"
        style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="pointer-events-auto flex w-full max-w-[430px] items-center justify-between gap-1 rounded-[26px] border border-line bg-white/95 px-3 py-3 max-[359px]:gap-0.5 max-[359px]:px-1.5 max-[359px]:py-2 shadow-[0_22px_44px_-18px_rgba(7,41,26,0.45)] backdrop-blur-md">
          {tab.map((t) => {
            const ini = active === t.halaman;
            return (
              <li key={t.halaman} className="flex flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => onChange(t.halaman)}
                  aria-current={ini ? "page" : undefined}
                  title={t.label}
                  data-testid={`nav-${t.halaman}`}
                  className="flex items-center justify-center transition active:scale-95"
                >
                  {ini ? (
                    /* Tab aktif: ikon dengan nama menu di samping kanannya, dalam pil hijau. */
                    <span className="flex items-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-white max-[359px]:gap-1.5 max-[359px]:px-2.5 shadow-[0_10px_20px_-14px_rgba(7,41,26,0.9)]">
                      <Icon name={t.ikon} className="h-[18px] w-[18px] shrink-0" />
                      <span className="text-[10.5px] font-bold whitespace-nowrap">{t.label}</span>
                    </span>
                  ) : (
                    /* Tab lain: ikon dengan nama menu di bawahnya. */
                    <span className="flex flex-col items-center gap-1.5 rounded-full px-2 py-1 text-ink-600 max-[359px]:gap-1 max-[359px]:px-1 transition hover:bg-mist hover:text-ink-900">
                      <Icon name={t.ikon} className="h-[21px] w-[21px] shrink-0" />
                      <span className="max-w-[58px] truncate text-[10px] max-[359px]:text-[9px] leading-none font-semibold">
                        {t.label}
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed bottom-0 left-0 z-40 w-full border-t border-black/5 bg-white/95 backdrop-blur"
    >
      <ul
        className="mx-auto grid w-full max-w-[620px] px-2 pt-1.5"
        style={{
          paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))",
          gridTemplateColumns: `repeat(${Math.max(tab.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {tab.map((t) => {
          const ini = active === t.halaman;
          return (
            <li key={t.halaman}>
              <button
                type="button"
                onClick={() => onChange(t.halaman)}
                aria-current={ini ? "page" : undefined}
                data-testid={`nav-${t.halaman}`}
                className={`flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-95 ${
                  ini ? "text-persis-900" : "text-ink-400"
                }`}
              >
                <Icon name={t.ikon} className="h-[21px] w-[21px]" />
                <span className={`text-[10px] ${ini ? "font-bold" : "font-medium"}`}>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Menu bawah khusus portal wali santri — tetap tampilan biasa. */
export const tabWali = [
  { id: "beranda", label: "Beranda", icon: "home" },
  { id: "nilai", label: "Nilai", icon: "clipboard" },
  { id: "tagihan", label: "Tagihan", icon: "wallet" },
  { id: "tahfidz", label: "Tahfidz", icon: "book-open" },
  { id: "profil", label: "Profil", icon: "user" },
] as const;

export type TabWali = (typeof tabWali)[number]["id"];
export type TabWaliIsi = Exclude<TabWali, "beranda">;

/**
 * Portal wali santri punya menunya sendiri: Beranda kembali ke situs utama,
 * sedangkan Nilai, Tagihan, Tahfidz, dan Profil pindah bagian di portal.
 */
export function BottomNavWali({
  active,
  onPilih,
  onBeranda,
}: {
  active: TabWali;
  onPilih: (t: TabWaliIsi) => void;
  onBeranda: () => void;
}) {
  return (
    <nav
      aria-label="Navigasi portal wali"
      className="fixed bottom-0 left-0 z-40 w-full border-t border-black/5 bg-white/95 backdrop-blur"
    >
      <ul
        className="mx-auto grid w-full max-w-[620px] grid-cols-5 px-2 pt-1.5"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        {tabWali.map((t) => {
          const ini = active === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => (t.id === "beranda" ? onBeranda() : onPilih(t.id))}
                aria-current={ini ? "page" : undefined}
                data-testid={`nav-wali-${t.id}`}
                className={`flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-95 ${
                  ini ? "text-persis-900" : "text-ink-400"
                }`}
              >
                <Icon name={t.icon} className="h-[21px] w-[21px]" />
                <span className={`text-[10px] ${ini ? "font-bold" : "font-medium"}`}>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
