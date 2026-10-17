import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Layar muat awal: digambar oleh CSS sebaris ini, jadi muncul sebelum berkas gaya
 * situs dan React siap. Bentuknya sengaja sama dengan layar "Memuat Data" situs
 * (logo, tulisan, tiga titik emas) supaya layar pembuka sistem HP menyatu mulus
 * ke layar memuat — tanpa kedipan hitam atau putih saat aplikasi dibuka.
 */
const GAYA_MUAT = `
  html { color-scheme: light; }
  html, body { margin: 0; }
  html:not(.persis-muat-selesai) body { background: #0e4b2b; }
  #persis-muat {
    position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px; background: #0e4b2b;
    color: #fff; text-align: center; padding: 0 32px;
  }
  #persis-muat img { width: 96px; height: 96px; border-radius: 9999px; object-fit: contain; }
  #persis-muat p {
    margin: 4px 0 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 15px; font-weight: 800; line-height: 1.15; letter-spacing: 0.01em;
  }
  #persis-muat span { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
  #persis-muat i {
    display: block; width: 6px; height: 6px; border-radius: 9999px; background: #ecd27f;
    animation: persis-muat-denyut 1.05s ease-in-out infinite;
  }
  #persis-muat i:nth-child(2) { animation-delay: 0.16s; }
  #persis-muat i:nth-child(3) { animation-delay: 0.32s; }
  @keyframes persis-muat-denyut {
    0%, 100% { opacity: 0.35; transform: translateY(0); }
    35% { opacity: 1; transform: translateY(-3px); }
  }
  html.persis-muat-selesai #persis-muat { display: none; }
  @media (prefers-reduced-motion: reduce) { #persis-muat i { animation: none; opacity: 0.75; } }
`;

/**
 * Layar muat dilepas begitu aplikasi benar-benar tampil (halaman situs sudah
 * memiliki penandanya), dan paling lambat 12 detik atau 2,5 detik setelah seluruh
 * berkas selesai dimuat — supaya tidak ada yang tertahan di layar muat.
 */
const SKRIP_MUAT = `(function () {
  var akar = document.documentElement;
  var mulai = Date.now();
  var selesai = false;
  function tutup() {
    if (selesai) return;
    selesai = true;
    akar.classList.add("persis-muat-selesai");
  }
  var pengawas = window.setInterval(function () {
    if (document.querySelector("[data-testid]") || Date.now() - mulai > 12000) {
      window.clearInterval(pengawas);
      window.setTimeout(tutup, 80);
    }
  }, 80);
  window.addEventListener("load", function () {
    window.setTimeout(function () { if (Date.now() - mulai > 1200) tutup(); }, 2500);
  });
})();`;

/**
 * Pemulihan saat berkas halaman versi lama tidak ditemukan.
 *
 * Setiap kali situs diperbarui, nama berkas halamannya ikut berganti. Halaman yang
 * masih terbuka dari versi sebelumnya bisa meminta berkas lama yang sudah dihapus
 * (jawabannya 404) — misalnya saat membuka borang berita yang memuat editor teks
 * kaya. Skrip ini mendengarkan kegagalan seperti itu lalu memuat ulang halaman
 * sekali, sehingga versi baru terpakai dan borangnya terbuka normal kembali.
 */
const SKRIP_PEMULIHAN = `(function () {
  var kunci = "persis-muat-ulang-berkas";
  function muatUlang() {
    try {
      var terakhir = Number(window.sessionStorage.getItem(kunci) || 0);
      /* Jangan sampai berulang-ulang: paling sering sekali per 10 menit, sehingga
         gangguan sesaat pulih sendiri tanpa membuat halaman memuat ulang terus. */
      if (Date.now() - terakhir < 600000) return;
      window.sessionStorage.setItem(kunci, String(Date.now()));
    } catch (galat) { /* penyimpanan tidak tersedia */ }
    window.location.reload();
  }
  window.addEventListener("vite:preloadError", muatUlang);
  window.addEventListener("error", function (peristiwa) {
    var pesan = peristiwa && peristiwa.message ? String(peristiwa.message) : "";
    if (/dynamically imported module|Importing a module script failed|Loading chunk/i.test(pesan)) muatUlang();
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (peristiwa) {
      if (peristiwa.data && peristiwa.data.tipe === "muat-ulang") muatUlang();
    });
  }
})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
      { name: "theme-color", content: "#0e4b2b" },
      /* Halaman ini hanya bertema terang: tanpa ini peramban bisa menggambar
         latar gelap (tampak hitam) selama situs dimuat di HP bertema gelap. */
      { name: "color-scheme", content: "light" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "PERSIS Cibatu" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "64x64" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: GAYA_MUAT }} />
      </head>
      <body>
        <div id="persis-muat" role="status" aria-live="polite" aria-label="Memuat data situs">
          <img src="/logo-persis.png" alt="" width={96} height={96} draggable={false} />
          <p>Memuat Data</p>
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
        {children}
        <script dangerouslySetInnerHTML={{ __html: SKRIP_PEMULIHAN }} />
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: SKRIP_MUAT }} />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
