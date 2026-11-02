// @ts-nocheck
/**
 * Rute "Download Aplikasi": daftar aplikasi (berkas APK) beserta tangkapan layar
 * dan rating pengunjung. Seluruh CRUD-nya dipakai panel admin.
 *
 * Tabel dibuat sendiri saat pertama kali dipakai (create table if not exists),
 * jadi pemilik situs tidak perlu menjalankan SQL apa pun.
 */

const BATAS_JUDUL = 200;
const BATAS_NAMA = 160;
const BATAS_TEKS = 8000;
const BATAS_ULASAN = 600;
const BATAS_URL = 1000;

function rapikan(nilai, batas = BATAS_JUDUL) {
  if (nilai === null || nilai === undefined) return null;
  const t = String(nilai).replace(/\r\n/g, "\n").trim();
  return t === "" ? null : t.slice(0, batas);
}

/** Fitur aplikasi: boleh dikirim sebagai larik, boleh sebagai teks satu baris satu fitur. */
function daftarFitur(nilai) {
  const mentah = Array.isArray(nilai) ? nilai : String(nilai ?? "").split("\n");
  return mentah
    .map((s) => String(s).replace(/^\s*[-•*]\s*/, "").trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 40);
}

const __ekspor = function pasangRuteAplikasi(app, { tanya }) {
  const kodeBaru = (awalan) =>
    `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  /* ---------------------------- tabel database ---------------------------- */

  let siapTabel = null;

  /** Membuat tabel yang belum ada. Dipanggil sekali per proses. */
  const pastikanTabel = () => {
    if (!siapTabel) {
      siapTabel = (async () => {
        await tanya(
          `create table if not exists aplikasi (
             id text primary key,
             nama text not null,
             versi text,
             pengembang text,
             deskripsi text,
             fitur jsonb not null default '[]'::jsonb,
             ikon_url text,
             berkas_url text,
             berkas_nama text,
             berkas_ukuran bigint,
             aktif boolean not null default true,
             urutan integer,
             dibuat timestamptz not null default now(),
             diperbarui timestamptz not null default now()
           )`,
        );
        await tanya(
          `create table if not exists aplikasi_screenshot (
             id text primary key,
             aplikasi_id text not null references aplikasi(id) on delete cascade,
             gambar_url text not null,
             urutan integer,
             dibuat timestamptz not null default now()
           )`,
        );
        await tanya(
          `create table if not exists aplikasi_rating (
             id text primary key,
             aplikasi_id text not null references aplikasi(id) on delete cascade,
             nilai integer not null,
             nama text,
             ulasan text,
             dibuat timestamptz not null default now()
           )`,
        );
        await tanya(`create index if not exists aplikasi_rating_app_idx on aplikasi_rating (aplikasi_id)`);
        await tanya(`create index if not exists aplikasi_screenshot_app_idx on aplikasi_screenshot (aplikasi_id)`);
      })().catch((e) => {
        siapTabel = null;
        throw e;
      });
    }
    return siapTabel;
  };

  /* ------------------------------- pembacaan ------------------------------- */

  const ambilScreenshot = async () =>
    (await tanya(`select id, aplikasi_id, gambar_url, urutan from aplikasi_screenshot order by urutan nulls last, dibuat`))
      .rows;

  const ambilRingkasanRating = async () =>
    (
      await tanya(
        `select aplikasi_id, round(avg(nilai)::numeric, 1) as rata, count(*)::int as jumlah
           from aplikasi_rating group by aplikasi_id`,
      )
    ).rows;

  const bentukAplikasi = (baris, screenshot, ringkasan) => {
    const rata = ringkasan.get(baris.id);
    return {
      id: baris.id,
      nama: baris.nama,
      versi: baris.versi ?? "",
      pengembang: baris.pengembang ?? "",
      deskripsi: baris.deskripsi ?? "",
      fitur: Array.isArray(baris.fitur) ? baris.fitur : [],
      ikon: baris.ikon_url ?? "",
      berkasUrl: baris.berkas_url ?? "",
      berkasNama: baris.berkas_nama ?? "",
      berkasUkuran: Number(baris.berkas_ukuran ?? 0),
      aktif: baris.aktif !== false,
      urutan: baris.urutan ?? null,
      screenshot: (screenshot.get(baris.id) ?? []).map((s) => ({ id: s.id, url: s.gambar_url })),
      rata: rata ? Number(rata.rata) : 0,
      jumlahRating: rata ? Number(rata.jumlah) : 0,
    };
  };

  /** Daftar aplikasi. `semua` dipakai panel admin supaya yang nonaktif ikut terlihat. */
  const ambilDaftar = async (semua = false) => {
    await pastikanTabel();
    const baris = (
      await tanya(
        `select id, nama, versi, pengembang, deskripsi, fitur, ikon_url, berkas_url, berkas_nama,
                berkas_ukuran, aktif, urutan
           from aplikasi
          ${semua ? "" : "where aktif = true"}
          order by urutan nulls last, dibuat desc`,
      )
    ).rows;

    const ss = await ambilScreenshot();
    const ringkasan = new Map((await ambilRingkasanRating()).map((r) => [r.aplikasi_id, r]));

    const perApp = new Map();
    for (const s of ss) {
      if (!perApp.has(s.aplikasi_id)) perApp.set(s.aplikasi_id, []);
      perApp.get(s.aplikasi_id).push(s);
    }

    return baris.map((b) => bentukAplikasi(b, perApp, ringkasan));
  };

  const ambilRating = async (id) => {
    const rows = (
      await tanya(
        `select id, nilai, nama, ulasan, dibuat from aplikasi_rating
          where aplikasi_id = $1 order by dibuat desc limit 40`,
        [id],
      )
    ).rows;
    return rows.map((r) => ({
      id: r.id,
      nilai: Number(r.nilai),
      nama: r.nama ?? "",
      ulasan: r.ulasan ?? "",
      tanggal: r.dibuat ? new Date(r.dibuat).toISOString() : null,
    }));
  };

  const ringkasanSatu = async (id) => {
    const row = (
      await tanya(
        `select round(avg(nilai)::numeric, 1) as rata, count(*)::int as jumlah
           from aplikasi_rating where aplikasi_id = $1`,
        [id],
      )
    ).rows[0];
    return { rata: row && row.rata ? Number(row.rata) : 0, jumlahRating: row ? Number(row.jumlah) : 0 };
  };

  const adaAplikasi = async (id) =>
    (await tanya("select id from aplikasi where id = $1", [id])).rowCount > 0;

  const kirimDaftar = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, aplikasi: await ambilDaftar(true) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  /* --------------------------- halaman pengunjung --------------------------- */

  app.get("/api/aplikasi", async (_req, res) => {
    try {
      res.json({ ok: true, aplikasi: await ambilDaftar(false) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/aplikasi/:id", async (req, res) => {
    try {
      const daftar = await ambilDaftar(false);
      const app1 = daftar.find((a) => a.id === req.params.id);
      if (!app1) return res.status(404).json({ pesan: "Aplikasi tidak ditemukan." });
      res.json({ ok: true, aplikasi: app1, rating: await ambilRating(app1.id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Pengunjung memberi rating (1–5) dan ulasan singkat. Tanpa perlu masuk. */
  app.post("/api/aplikasi/:id/rating", async (req, res) => {
    try {
      await pastikanTabel();
      const id = req.params.id;
      if (!(await adaAplikasi(id))) return res.status(404).json({ pesan: "Aplikasi tidak ditemukan." });

      const nilai = Number((req.body || {}).nilai);
      if (!Number.isInteger(nilai) || nilai < 1 || nilai > 5) {
        return res.status(400).json({ pesan: "Pilih rating 1 sampai 5 bintang." });
      }

      const nama = rapikan((req.body || {}).nama, BATAS_NAMA);
      const ulasan = rapikan((req.body || {}).ulasan, BATAS_ULASAN);

      await tanya(
        `insert into aplikasi_rating (id, aplikasi_id, nilai, nama, ulasan)
         values ($1, $2, $3, $4, $5)`,
        [kodeBaru("ar"), id, nilai, nama, ulasan],
      );

      res.json({ ok: true, ...(await ringkasanSatu(id)), rating: await ambilRating(id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------------ panel admin ------------------------------ */

  app.get("/api/admin/aplikasi", async (_req, res) => {
    try {
      res.json({ ok: true, aplikasi: await ambilDaftar(true) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Isian bersama untuk simpan dan ubah. */
  const bacaIsian = (b, { wajibNama }) => {
    const nama = rapikan(b.nama, BATAS_NAMA);
    if (wajibNama && !nama) {
      const e = new Error("Nama aplikasi tidak boleh kosong.");
      e.status = 400;
      throw e;
    }
    return {
      nama,
      versi: rapikan(b.versi, BATAS_NAMA),
      pengembang: rapikan(b.pengembang, BATAS_NAMA),
      deskripsi: rapikan(b.deskripsi, BATAS_TEKS),
      fitur: daftarFitur(b.fitur),
      ikon_url: rapikan(b.ikon_url, BATAS_URL),
      berkas_url: rapikan(b.berkas_url, BATAS_URL),
      berkas_nama: rapikan(b.berkas_nama, BATAS_NAMA),
      berkas_ukuran: Number(b.berkas_ukuran) > 0 ? Math.round(Number(b.berkas_ukuran)) : null,
      aktif: b.aktif !== false,
    };
  };

  app.post("/api/admin/aplikasi", async (req, res) => {
    const b = req.body || {};
    let isian;
    try {
      isian = bacaIsian(b, { wajibNama: true });
    } catch (e) {
      return res.status(e.status || 400).json({ pesan: e.message });
    }

    await kirimDaftar(res, async () => {
      const urutan = (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from aplikasi")).rows[0].n ?? 1;
      await tanya(
        `insert into aplikasi (id, nama, versi, pengembang, deskripsi, fitur, ikon_url, berkas_url,
                               berkas_nama, berkas_ukuran, aktif, urutan)
         values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12)`,
        [
          kodeBaru("ap"),
          isian.nama,
          isian.versi,
          isian.pengembang,
          isian.deskripsi,
          JSON.stringify(isian.fitur),
          isian.ikon_url,
          isian.berkas_url,
          isian.berkas_nama,
          isian.berkas_ukuran,
          isian.aktif,
          urutan,
        ],
      );
    });
  });

  app.put("/api/admin/aplikasi/:id", async (req, res) => {
    const b = req.body || {};
    let isian;
    try {
      isian = bacaIsian(b, { wajibNama: true });
    } catch (e) {
      return res.status(e.status || 400).json({ pesan: e.message });
    }

    await kirimDaftar(res, async () => {
      const hasil = await tanya(
        `update aplikasi
            set nama = $1, versi = $2, pengembang = $3, deskripsi = $4, fitur = $5::jsonb,
                ikon_url = $6, berkas_url = $7, berkas_nama = $8, berkas_ukuran = $9,
                aktif = $10, diperbarui = now()
          where id = $11
          returning id`,
        [
          isian.nama,
          isian.versi,
          isian.pengembang,
          isian.deskripsi,
          JSON.stringify(isian.fitur),
          isian.ikon_url,
          isian.berkas_url,
          isian.berkas_nama,
          isian.berkas_ukuran,
          isian.aktif,
          req.params.id,
        ],
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Aplikasi tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/aplikasi/:id", async (req, res) => {
    await kirimDaftar(res, async () => {
      const hasil = await tanya("delete from aplikasi where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Aplikasi tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /** Tangkapan layar: satu per satu supaya unggahan gambar bisa berurutan. */
  app.post("/api/admin/aplikasi/:id/screenshot", async (req, res) => {
    const url = rapikan((req.body || {}).gambar_url, BATAS_URL);
    if (!url) return res.status(400).json({ pesan: "Gambar tangkapan layar belum diunggah." });

    await kirimDaftar(res, async () => {
      if (!(await adaAplikasi(req.params.id))) {
        const e = new Error("Aplikasi tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from aplikasi_screenshot where aplikasi_id = $1", [
          req.params.id,
        ])).rows[0].n ?? 1;
      await tanya(
        `insert into aplikasi_screenshot (id, aplikasi_id, gambar_url, urutan) values ($1, $2, $3, $4)`,
        [kodeBaru("as"), req.params.id, url, urutan],
      );
    });
  });

  app.delete("/api/admin/aplikasi/:id/screenshot/:ssId", async (req, res) => {
    await kirimDaftar(res, async () => {
      const hasil = await tanya(
        "delete from aplikasi_screenshot where id = $1 and aplikasi_id = $2 returning id",
        [req.params.ssId, req.params.id],
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Tangkapan layar tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /** Admin menghapus satu rating yang tidak pantas. */
  app.delete("/api/admin/aplikasi/:id/rating/:ratingId", async (req, res) => {
    await kirimDaftar(res, async () => {
      const hasil = await tanya("delete from aplikasi_rating where id = $1 and aplikasi_id = $2 returning id", [
        req.params.ratingId,
        req.params.id,
      ]);
      if (hasil.rowCount === 0) {
        const e = new Error("Rating tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });
};

export default __ekspor;
