/* Service worker PERSIS Cibatu:
   1) menerima notifikasi push dan menampilkannya di layar HP,
   2) menyajikan halaman dari simpanan saat sambungan bermasalah.
   Halaman selalu diambil dari jaringan lebih dulu supaya isinya tidak pernah
   basi; simpanan hanya dipakai kalau jaringan gagal. Berkas statis ditampilkan
   dari simpanan lalu diperbarui di belakang layar. Data dari /api/ tidak pernah
   disimpan. */

const VERSI = "persis-cibatu-v1";
const BERKAS_INTI = ["/", "/manifest.json", "/logo-persis.png", "/ikon-maskable.png", "/favicon.png"];

const HALAMAN_LURING = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tidak ada sambungan — PERSIS Cibatu</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e4b2b;color:#fff;
       font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;padding:24px}
  img{width:96px;height:96px;object-fit:contain;margin:0 auto 16px;display:block}
  h1{font-size:17px;margin:0 0 8px}
  p{font-size:13px;line-height:1.6;color:rgba(255,255,255,.75);margin:0 0 18px;max-width:320px}
  button{border:0;border-radius:999px;background:#e9f2ec;color:#0e4b2b;font-weight:700;
         padding:12px 22px;font-size:13px}
</style></head>
<body><div>
  <img src="/logo-persis.png" alt="Logo PC PERSIS Cibatu">
  <h1>Tidak ada sambungan internet</h1>
  <p>Kabar terbaru akan tampil begitu sambungan kembali. Notifikasi yang sudah pernah terbuka tetap bisa dibaca lewat ikon lonceng.</p>
  <button onclick="location.reload()">Coba lagi</button>
</div></body></html>`;

self.addEventListener("install", (peristiwa) => {
  peristiwa.waitUntil(
    caches
      .open(VERSI)
      .then((simpanan) =>
        Promise.allSettled(BERKAS_INTI.map((alamat) => simpanan.add(new Request(alamat, { cache: "reload" })))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (peristiwa) => {
  peristiwa.waitUntil(
    caches
      .keys()
      .then((kunci) => Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Kunci simpanan tanpa bagian # supaya semua halaman situs memakai satu salinan. */
function kunciSimpanan(permintaan) {
  const alamat = new URL(permintaan.url);
  alamat.hash = "";
  return alamat.href;
}

function simpanSalinan(permintaan, jawab) {
  if (!jawab || !jawab.ok || jawab.type === "opaque") return;
  caches
    .open(VERSI)
    .then((simpanan) => simpanan.put(kunciSimpanan(permintaan), jawab))
    .catch(() => {});
}

self.addEventListener("fetch", (peristiwa) => {
  const permintaan = peristiwa.request;
  if (permintaan.method !== "GET") return;

  const alamat = new URL(permintaan.url);
  if (alamat.origin !== self.location.origin) return;
  if (alamat.pathname.startsWith("/api/")) return; /* data dinamis: selalu dari jaringan */

  /* Halaman: jaringan dulu, simpanan sebagai cadangan, halaman khusus tanpa sambungan. */
  if (permintaan.mode === "navigate") {
    peristiwa.respondWith(
      fetch(permintaan)
        .then((jawab) => {
          simpanSalinan(permintaan, jawab.clone());
          return jawab;
        })
        .catch(async () => {
          const salinan = await caches.match(kunciSimpanan(permintaan));
          if (salinan) return salinan;
          const beranda = await caches.match("/");
          if (beranda) return beranda;
          return new Response(HALAMAN_LURING, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }),
    );
    return;
  }

  /* Berkas statis: tampilkan simpanan lebih dulu, perbarui di belakang layar. */
  if (/\.(?:js|mjs|css|png|jpe?g|webp|avif|svg|gif|ico|woff2?|json)$/i.test(alamat.pathname)) {
    peristiwa.respondWith(
      caches.match(kunciSimpanan(permintaan)).then((salinan) => {
        const dariJaringan = fetch(permintaan)
          .then((jawab) => {
            simpanSalinan(permintaan, jawab.clone());
            return jawab;
          })
          .catch(() => salinan);
        return salinan || dariJaringan;
      }),
    );
  }
});

/* ------------------------- notifikasi push ke layar HP ------------------------- */

self.addEventListener("push", (peristiwa) => {
  let data = {};
  try {
    data = peristiwa.data ? peristiwa.data.json() : {};
  } catch {
    data = { title: "PC PERSIS Cibatu", body: peristiwa.data ? peristiwa.data.text() : "" };
  }

  const judul = data.title || "PC PERSIS Cibatu";
  const opsi = {
    body: data.body || "",
    icon: data.ikon || "/logo-persis.png",
    badge: "/favicon.png",
    tag: data.tag || "persis-cibatu",
    lang: "id",
    /* Prioritas tinggi: getar kuat, tahan di layar, dan bunyi ulang agar seperti aplikasi Android. */
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify: true,
    silent: false,
    data: { url: data.url || "/" },
  };

  peristiwa.waitUntil(self.registration.showNotification(judul, opsi));
});

self.addEventListener("notificationclick", (peristiwa) => {
  peristiwa.notification.close();
  const tujuan = (peristiwa.notification.data && peristiwa.notification.data.url) || "/";
  const alamat = new URL(tujuan, self.location.origin).href;

  peristiwa.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((daftar) => {
      for (const klien of daftar) {
        if (klien.url.startsWith(self.location.origin)) {
          klien.navigate(alamat);
          return klien.focus();
        }
      }
      return self.clients.openWindow(alamat);
    }),
  );
});
