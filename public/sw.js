/* Service worker PC PERSIS Cibatu — dua tugas.

   1. Membuat aplikasi terbuka seketika, tanpa layar hitam lebih dahulu.
      Saat aplikasi Android (TWA) dibuka, Chrome lebih dahulu menyiapkan
      jendelanya dan menghubungi jaringan; selama menunggu itulah yang tampil
      bidang kosong berwarna hitam. Service worker ini menyimpan kerangka situs
      di dalam HP lalu menyajikannya lebih dahulu — layar pembuka hijau sudah
      tergambar hampir seketika — sementara versi terbaru situs diambil di
      belakang layar dan dipakai pada pembukaan berikutnya.

   2. Menerima push dan menampilkan notifikasi di layar HP (bagian ini tidak
      diubah dari sebelumnya). */

const VERSI = "v2";
const KERANGKA = `persis-kerangka-${VERSI}`; /* Kerangka halaman: diganti tiap versi. */
const ASET = "persis-aset"; /* Berkas gaya, skrip, dan gambar: bertahan antarversi. */

/* Disimpan saat pemasangan supaya pembukaan pertama pun tidak menunggu jaringan. */
const BERKAS_AWAL = [
  "/",
  "/manifest.json",
  "/logo-persis.png",
  "/ikon-192.png",
  "/ikon-512.png",
  "/favicon.png",
  "/apple-touch-icon.png",
];

/* Halaman darurat: hanya tampil bila kerangka belum tersimpan dan jaringan mati. */
const HALAMAN_LURING = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>PC PERSIS Cibatu</title>
<style>
  html, body { margin: 0; height: 100%; background: #0e4b2b; color: #fff;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .kotak { display: flex; height: 100%; flex-direction: column; align-items: center;
    justify-content: center; gap: 14px; padding: 0 32px; text-align: center; }
  img { width: 96px; height: 96px; border-radius: 9999px; object-fit: contain; }
  p { margin: 0; font-size: 15px; font-weight: 800; }
  small { font-size: 12px; line-height: 1.6; color: rgba(255, 255, 255, 0.72); }
</style>
</head>
<body>
  <div class="kotak">
    <img src="/logo-persis.png" alt="Logo Persatuan Islam Cibatu">
    <p>Tidak ada sambungan internet</p>
    <small>Sambungkan kembali HP Anda ke internet, lalu buka aplikasi ini sekali lagi.</small>
  </div>
</body>
</html>`;

/* ---------- Pemasangan dan pembaruan ---------- */

self.addEventListener("install", (peristiwa) => {
  peristiwa.waitUntil(
    (async () => {
      const khazanah = await caches.open(KERANGKA);
      /* allSettled: bila satu berkas gagal, pemasangan tetap berjalan. */
      await Promise.allSettled(
        BERKAS_AWAL.map((alamat) => khazanah.add(new Request(alamat, { cache: "reload" }))),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (peristiwa) => {
  peristiwa.waitUntil(
    (async () => {
      /* Buang kerangka versi lama; berkas di ASET dibiarkan supaya kerangka
         yang masih tersimpan selalu menemukan gaya dan skripnya. */
      const kunci = await caches.keys();
      await Promise.all(
        kunci
          .filter((k) => k.startsWith("persis-kerangka-") && k !== KERANGKA)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/* ---------- Penangan permintaan ---------- */

self.addEventListener("fetch", (peristiwa) => {
  const minta = peristiwa.request;
  if (minta.method !== "GET") return;

  let alamat;
  try {
    alamat = new URL(minta.url);
  } catch {
    return;
  }
  if (alamat.origin !== self.location.origin) return;

  /* Data dari layanan situs selalu langsung dari jaringan: tidak boleh basi. */
  if (alamat.pathname.startsWith("/api/")) return;

  /* Pembukaan halaman (termasuk aplikasi Android): kerangka dari HP dulu. */
  if (minta.mode === "navigate") {
    peristiwa.respondWith(halaman(peristiwa, minta));
    return;
  }

  /* Berkas bernama sidik jari (assets/...): isinya tidak pernah berubah. */
  if (alamat.pathname.startsWith("/assets/")) {
    peristiwa.respondWith(berkasKekal(peristiwa, minta));
    return;
  }

  /* Gambar, manifes, dan gaya lain: sajikan tersimpan, segarkan di belakang. */
  if (/\.(?:css|js|mjs|png|jpe?g|svg|webp|ico|woff2?|ttf|json)$/i.test(alamat.pathname)) {
    peristiwa.respondWith(berkasSegar(peristiwa, minta));
  }
});

async function halaman(peristiwa, minta) {
  const khazanah = await caches.open(KERANGKA);
  const tersimpan = await khazanah.match("/");

  const pembaruan = fetch(minta)
    .then((jawaban) => {
      if (jawaban && jawaban.ok) return khazanah.put("/", jawaban.clone());
      return null;
    })
    .catch(() => null);

  if (tersimpan) {
    peristiwa.waitUntil(pembaruan);
    return tersimpan;
  }

  await pembaruan;
  const baru = await khazanah.match("/");
  if (baru) return baru;

  return new Response(HALAMAN_LURING, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function berkasKekal(peristiwa, minta) {
  const khazanah = await caches.open(ASET);
  const tersimpan = await khazanah.match(minta);
  if (tersimpan) return tersimpan;

  try {
    const jawaban = await fetch(minta);
    if (jawaban && jawaban.ok) {
      peristiwa.waitUntil(khazanah.put(minta, jawaban.clone()));
      return jawaban;
    }
    if (jawaban && jawaban.status === 404) {
      /* Berkas lama sudah tidak ada di peladen: buang kerangka tersimpan agar
         halaman diambil baru, jangan sampai aplikasi menunggu berkas hilang. */
      await caches.delete(KERANGKA);
    }
    return jawaban;
  } catch (galat) {
    const lain = await caches.match(minta);
    if (lain) return lain;
    throw galat;
  }
}

async function berkasSegar(peristiwa, minta) {
  const khazanah = await caches.open(ASET);
  const tersimpan = await khazanah.match(minta);

  if (tersimpan) {
    peristiwa.waitUntil(
      fetch(minta)
        .then((jawaban) => (jawaban && jawaban.ok ? khazanah.put(minta, jawaban.clone()) : null))
        .catch(() => null),
    );
    return tersimpan;
  }

  try {
    const jawaban = await fetch(minta);
    if (jawaban && jawaban.ok) peristiwa.waitUntil(khazanah.put(minta, jawaban.clone()));
    return jawaban;
  } catch (galat) {
    const lain = await caches.match(minta);
    if (lain) return lain;
    throw galat;
  }
}

/* ---------- Notifikasi (tidak diubah) ---------- */

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
