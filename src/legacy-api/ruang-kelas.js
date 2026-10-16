// @ts-nocheck
import __m0 from "./lib/unit.js";
import __m1 from "./lib/kelas.js";

/**
 * Rute kelas (rombel) satu unit pendidikan.
 *
 * Dipakai panel Admin Sekolah untuk memilah peserta didik per kelas, memindahkan
 * satu atau sekaligus banyak peserta didik, menaikkan kelas sekali setahun, dan
 * meluluskan kelas terakhir sehingga jumlahnya berkurang dari situs (alumni).
 * Panel Admin Tata Usaha memakai rute rekap di bagian bawah untuk menyaring
 * laporan tagihan per kelas.
 *
 * Kelas tidak disimpan pada tabel baru: daftar kelas disimpan pada tabel
 * `pengaturan`, sedangkan kelas setiap peserta didik tetap pada `santri.kelas`.
 * Semua permintaan disaring dengan unit_id dari sesi (penjaga /api/unit).
 */
const bantuanUnit = __m0;
const bantuanKelas = __m1;

const STATUS_AKTIF = "aktif";
/** Penanda kelas tujuan khusus pada kenaikan kelas: keluar dari daftar siswa aktif. */
const KE_ALUMNI = "Alumni";

export default function pasangRuteUnitKelas(app, { tanya }) {
  const { satu, sekolahWajib, angka } = bantuanUnit(tanya);
  const kelasBantuan = bantuanKelas(tanya);

  const daftar = async (sql, nilai) => (await tanya(sql, nilai)).rows ?? [];
  const rapikan = (nilai, batas) => {
    if (nilai === null || nilai === undefined) return null;
    const teks = String(nilai).replace(/\s+/g, " ").trim();
    return teks ? teks.slice(0, batas) : null;
  };

  /** Nama kelas dari alamat atau badan permintaan; kosong berarti "belum berkelas". */
  const namaKelas = (nilai, batas = 30) => rapikan(nilai, batas) ?? "";

  const jumlahDiKelas = async (unitId, nama) =>
    angka(
      (
        await satu(
          `select count(*)::int as n from santri
            where unit_id = $1 and status = $2 and coalesce(nullif(trim(kelas), ''), '') = $3`,
          [unitId, STATUS_AKTIF, nama],
        )
      )?.n,
    );

  const adaDiDaftar = async (unitId, nama) => {
    if (!nama) return true;
    const kelas = await kelasBantuan.ambil(unitId);
    return kelas.some((k) => k.nama.toLowerCase() === nama.toLowerCase());
  };

  const jawabKelas = async (res, unitId) => {
    const { kelas, ringkasan } = await kelasBantuan.gabung(unitId);
    res.json({ ok: true, kelas, ringkasan });
  };

  const barisSiswa = (r) => ({
    id: r.id,
    nama: r.nama ?? "",
    program: r.program ?? "",
    programNama: r.program_nama ?? "",
    kelas: r.kelas ?? "",
    waliNama: r.wali_nama ?? "",
    waliTelepon: r.wali_telepon ?? "",
    status: r.status ?? STATUS_AKTIF,
  });

  /* ------------------------------ daftar kelas ------------------------------ */

  app.get("/api/unit/kelas", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      await jawabKelas(res, sesi.unit_id);
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/kelas", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const nama = rapikan(req.body?.nama, 30);
      if (!nama) return res.status(400).json({ pesan: "Nama kelas wajib diisi." });
      const wali = rapikan(req.body?.wali, 60) ?? "";
      const kelas = await kelasBantuan.ambil(sesi.unit_id);
      if (kelas.some((k) => k.nama.toLowerCase() === nama.toLowerCase())) {
        return res.status(400).json({ pesan: `Kelas ${nama} sudah ada pada ${sesi.unit?.nama ?? "unit"} ini.` });
      }
      const urutan = Number.parseInt(String(req.body?.urutan ?? ""), 10);
      const baru = [...kelas, { nama, wali, urutan: Number.isFinite(urutan) ? urutan : kelas.length + 1 }];
      await kelasBantuan.simpan(sesi.unit_id, baru);
      await jawabKelas(res, sesi.unit_id);
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Susun ulang urutan kelas: dipakai tombol naik/turun dan menjadi urutan kenaikan kelas. */
  app.put("/api/unit/kelas/urutan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const diminta = Array.isArray(req.body?.daftar) ? req.body.daftar.map((n) => rapikan(n, 30)).filter(Boolean) : null;
      if (!diminta || diminta.length === 0) return res.status(400).json({ pesan: "Daftar urutan kelas tidak dikenali." });
      const kelas = await kelasBantuan.ambil(sesi.unit_id);
      const peta = new Map(kelas.map((k) => [k.nama.toLowerCase(), k]));
      const baru = [];
      for (const nama of diminta) {
        const k = peta.get(nama.toLowerCase());
        if (k && !baru.includes(k)) baru.push(k);
      }
      for (const k of kelas) if (!baru.includes(k)) baru.push(k);
      await kelasBantuan.simpan(sesi.unit_id, baru);
      await jawabKelas(res, sesi.unit_id);
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- peserta didik per kelas --------------------------- */

  /** Daftar peserta didik satu kelas; `kelas=` kosong berarti yang belum berkelas. */
  app.get("/api/unit/kelas/siswa", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const kelas = namaKelas(req.query.kelas);
      const cari = rapikan(req.query.cari, 60) ?? "";
      const status = ["aktif", "lulus", "semua"].includes(String(req.query.status ?? ""))
        ? String(req.query.status)
        : STATUS_AKTIF;
      const nilai = [sesi.unit_id, kelas];
      let kondisi = `s.unit_id = $1 and coalesce(nullif(trim(s.kelas), ''), '') = $2`;
      if (status !== "semua") {
        nilai.push(status);
        kondisi += ` and s.status = $${nilai.length}`;
      }
      if (cari) {
        nilai.push(`%${cari}%`);
        kondisi += ` and (s.nama ilike $${nilai.length} or coalesce(s.wali_nama,'') ilike $${nilai.length})`;
      }
      const rows = await daftar(
        `select s.id, s.nama, s.program, s.kelas, s.status, s.wali_nama, s.wali_telepon,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama
           from santri s
          where ${kondisi}
          order by s.nama
          limit 300`,
        nilai,
      );
      res.json({
        ok: true,
        kelas,
        cari,
        status,
        siswa: rows.map(barisSiswa),
        jumlah: rows.length,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Pindahkan satu peserta didik ke kelas lain (atau kosongkan bila kelasnya kosong). */
  app.put("/api/unit/kelas/siswa/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const kelas = namaKelas(req.body?.kelas);
      if (!(await adaDiDaftar(sesi.unit_id, kelas))) {
        return res.status(400).json({ pesan: `Kelas ${kelas} belum terdaftar pada unit ini.` });
      }
      const hasil = await tanya(
        `update santri set kelas = $3, diperbarui = now()
          where id = $1 and unit_id = $2
          returning id, nama, kelas`,
        [req.params.id, sesi.unit_id, kelas || null],
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Peserta didik tidak ditemukan pada unit ini." });
      const r = hasil.rows[0];
      const { ringkasan } = await kelasBantuan.gabung(sesi.unit_id);
      res.json({ ok: true, siswa: { id: r.id, nama: r.nama, kelas: r.kelas ?? "" }, ringkasan });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Pindahkan seluruh peserta didik satu kelas ke kelas lain (borongan). */
  app.post("/api/unit/kelas/pindah", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const dari = namaKelas(req.body?.dari);
      const ke = namaKelas(req.body?.ke);
      if (dari === ke) return res.status(400).json({ pesan: "Kelas asal dan kelas tujuan sama." });
      if (ke && !(await adaDiDaftar(sesi.unit_id, ke))) {
        return res.status(400).json({ pesan: `Kelas ${ke} belum terdaftar pada unit ini.` });
      }
      const ids = Array.isArray(req.body?.siswa) ? req.body.siswa.map((s) => String(s)).slice(0, 500) : null;
      const nilai = [sesi.unit_id, STATUS_AKTIF, dari, ke || null];
      let kondisi = `unit_id = $1 and status = $2 and coalesce(nullif(trim(kelas), ''), '') = $3`;
      if (ids && ids.length > 0) {
        nilai.push(ids);
        kondisi += ` and id = any(${nilai.length}::text[])`;
      }
      const hasil = await tanya(
        `update santri set kelas = $4, diperbarui = now() where ${kondisi} returning id`,
        nilai,
      );
      const { kelas, ringkasan } = await kelasBantuan.gabung(sesi.unit_id);
      res.json({ ok: true, dipindah: hasil.rowCount, dari, ke, kelas, ringkasan });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Kenaikan kelas borongan sekali setahun: urutan kelas pada daftar dipakai sebagai
   * jenjang, jadi kelas ke-1 naik ke kelas ke-2 dan seterusnya. Dikerjakan dari kelas
   * paling atas supaya kelas tujuan selalu sudah kosong lebih dahulu.
   * Kelas paling atas diluluskan (menjadi alumni) — itulah yang mengurangi jumlah
   * siswa di situs. Bila kelas paling atas belum dikosongkan, kenaikan tidak dijalankan
   * agar tidak ada dua angkatan yang bercampur.
   */
  app.post("/api/unit/kelas/naik", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const kelas = await kelasBantuan.ambil(sesi.unit_id);
      if (kelas.length === 0) return res.status(400).json({ pesan: "Belum ada kelas yang terdaftar." });
      const luluskanTerakhir = req.body?.luluskanTerakhir !== false;
      const terakhir = kelas[kelas.length - 1];
      const isiTerakhir = await jumlahDiKelas(sesi.unit_id, terakhir.nama);
      if (!luluskanTerakhir && isiTerakhir > 0) {
        return res.status(400).json({
          pesan:
            `Kelas ${terakhir.nama} masih berisi ${isiTerakhir} peserta didik. ` +
            `Luluskan kelas itu lebih dahulu, atau pindahkan isinya ke kelas lain, ` +
            `supaya tidak ada dua angkatan yang bercampur.`,
        });
      }

      const wajibAda = kelas.length > 1 ? kelas[kelas.length - 2].nama : null;
      if (wajibAda && !luluskanTerakhir) {
        const isiWajib = await jumlahDiKelas(sesi.unit_id, wajibAda);
        if (isiWajib > 0) {
          return res.status(400).json({
            pesan: `Kelas ${terakhir.nama} belum kosong, jadi kelas ${wajibAda} belum bisa dinaikkan.`,
          });
        }
      }

      const langkah = [];
      for (let i = kelas.length - 1; i >= 0; i -= 1) {
        const asal = kelas[i].nama;
        const tujuan = kelas[i + 1] ? kelas[i + 1].nama : null;
        if (!tujuan) {
          if (!luluskanTerakhir) continue;
          const hasil = await tanya(
            `update santri set status = 'lulus', diperbarui = now()
              where unit_id = $1 and status = $2 and coalesce(nullif(trim(kelas), ''), '') = $3
              returning id`,
            [sesi.unit_id, STATUS_AKTIF, asal],
          );
          langkah.push({ dari: asal, ke: KE_ALUMNI, jumlah: hasil.rowCount });
          continue;
        }
        const hasil = await tanya(
          `update santri set kelas = $3, diperbarui = now()
            where unit_id = $1 and status = $2 and coalesce(nullif(trim(kelas), ''), '') = $4
            returning id`,
          [sesi.unit_id, STATUS_AKTIF, tujuan, asal],
        );
        langkah.push({ dari: asal, ke: tujuan, jumlah: hasil.rowCount });
      }

      const { kelas: sesudah, ringkasan } = await kelasBantuan.gabung(sesi.unit_id);
      const diluluskan = langkah.filter((l) => l.ke === KE_ALUMNI).reduce((n, l) => n + l.jumlah, 0);
      res.json({
        ok: true,
        langkah,
        dipindah: langkah.filter((l) => l.ke !== KE_ALUMNI).reduce((n, l) => n + l.jumlah, 0),
        diluluskan,
        kelas: sesudah,
        ringkasan,
        pesan:
          diluluskan > 0
            ? `${diluluskan} peserta didik diluluskan. Daftar alumni menyesuaikan sendiri saat halaman Alumni dibuka.`
            : "Kenaikan kelas selesai.",
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Luluskan seluruh peserta didik satu kelas (statusmenjadi lulus, masuk alumni). */
  app.post("/api/unit/kelas/luluskan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const kelas = namaKelas(req.body?.kelas);
      if (!kelas) return res.status(400).json({ pesan: "Kelas yang diluluskan belum dipilih." });
      const hasil = await tanya(
        `update santri set status = 'lulus', diperbarui = now()
          where unit_id = $1 and status = $2 and coalesce(nullif(trim(kelas), ''), '') = $3
          returning id, nama`,
        [sesi.unit_id, STATUS_AKTIF, kelas],
      );
      const { kelas: sesudah, ringkasan } = await kelasBantuan.gabung(sesi.unit_id);
      res.json({
        ok: true,
        diluluskan: hasil.rowCount,
        nama: hasil.rows.map((r) => r.nama),
        kelas: sesudah,
        ringkasan,
        pesan:
          hasil.rowCount > 0
            ? `${hasil.rowCount} peserta didik kelas ${kelas} diluluskan. Jumlah siswa di situs berkurang, dan mereka masuk daftar alumni saat halaman Alumni dibuka.`
            : `Tidak ada peserta didik aktif di kelas ${kelas}.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- tagihan per kelas (TU) --------------------------- */

  /**
   * Rekap tagihan per kelas untuk panel Admin Tata Usaha: jumlah tagihan, nilainya,
   * yang sudah lunas, dan tunggakannya. Kelas dibaca dari data peserta didik saat ini,
   * jadi peserta didik yang baru dipindahkan ikut berpindah pada rekap ini.
   */
  app.get("/api/unit/kelas/tagihan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const periode = /^\d{4}-\d{2}$/.test(String(req.query.periode ?? "")) ? String(req.query.periode) : null;
      const kelasSaring = namaKelas(req.query.kelas);

      const nilai = [sesi.unit_id];
      let kondisi = "s.unit_id = $1";
      if (periode) {
        nilai.push(periode);
        kondisi += ` and t.periode = $${nilai.length}`;
      }
      if (kelasSaring) {
        nilai.push(kelasSaring);
        kondisi += ` and coalesce(nullif(trim(s.kelas), ''), '') = $${nilai.length}`;
      }

      const rows = await daftar(
        `select coalesce(nullif(trim(s.kelas), ''), '') as kelas,
                count(t.id)::int as jumlah,
                coalesce(sum(t.jumlah), 0) as total,
                coalesce(sum(t.jumlah) filter (where t.status = 'lunas'), 0) as lunas,
                count(t.id) filter (where t.status = 'lunas')::int as jumlah_lunas,
                coalesce(sum(t.jumlah) filter (where t.status in ('belum', 'menunggu')), 0) as tunggakan,
                count(t.id) filter (where t.status in ('belum', 'menunggu'))::int as jumlah_tunggakan,
                count(distinct t.santri_id)::int as peserta
           from tagihan t
           join santri s on s.id = t.santri_id
          where ${kondisi}
          group by 1
          order by 1`,
        nilai,
      );

      const baris = rows.map((r) => ({
        kelas: r.kelas || "Belum berkelas",
        kunci: r.kelas ?? "",
        jumlah: angka(r.jumlah),
        peserta: angka(r.peserta),
        total: angka(r.total),
        lunas: angka(r.lunas),
        jumlahLunas: angka(r.jumlah_lunas),
        tunggakan: angka(r.tunggakan),
        jumlahTunggakan: angka(r.jumlah_tunggakan),
      }));

      /* Periode yang pernah ditagih, untuk pilihan penyaring di panel. */
      const periodeAda = (
        await daftar(
          `select distinct t.periode from tagihan t join santri s on s.id = t.santri_id
            where s.unit_id = $1 and t.periode is not null
            order by 1 desc limit 24`,
          [sesi.unit_id],
        )
      ).map((r) => r.periode);

      res.json({
        ok: true,
        periode,
        kelasSaring,
        periodeAda,
        baris,
        ringkasan: {
          jumlah: baris.reduce((n, b) => n + b.jumlah, 0),
          total: baris.reduce((n, b) => n + b.total, 0),
          lunas: baris.reduce((n, b) => n + b.lunas, 0),
          tunggakan: baris.reduce((n, b) => n + b.tunggakan, 0),
          jumlahTunggakan: baris.reduce((n, b) => n + b.jumlahTunggakan, 0),
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------ ubah dan hapus satu kelas ------------------------ */

  app.put("/api/unit/kelas/:nama", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const lama = namaKelas(decodeURIComponent(req.params.nama));
      if (!lama) return res.status(400).json({ pesan: "Kelas yang diubah belum dipilih." });
      const kelas = await kelasBantuan.ambil(sesi.unit_id);
      const posisi = kelas.findIndex((k) => k.nama.toLowerCase() === lama.toLowerCase());
      if (posisi < 0) return res.status(404).json({ pesan: `Kelas ${lama} tidak ditemukan pada unit ini.` });

      const namaBaru = "nama" in (req.body ?? {}) ? namaKelas(req.body?.nama) : lama;
      if (!namaBaru) return res.status(400).json({ pesan: "Nama kelas tidak boleh kosong." });
      if (
        namaBaru.toLowerCase() !== lama.toLowerCase() &&
        kelas.some((k) => k.nama.toLowerCase() === namaBaru.toLowerCase())
      ) {
        return res.status(400).json({ pesan: `Kelas ${namaBaru} sudah ada pada unit ini.` });
      }

      const baru = [...kelas];
      baru[posisi] = {
        ...kelas[posisi],
        nama: namaBaru,
        wali: "wali" in (req.body ?? {}) ? rapikan(req.body?.wali, 60) ?? "" : kelas[posisi].wali,
      };
      await kelasBantuan.simpan(sesi.unit_id, baru);

      /* Nama kelas pada data peserta didik ikut diubah supaya tidak ada yang tertinggal. */
      let dipindah = 0;
      if (namaBaru.toLowerCase() !== lama.toLowerCase()) {
        const hasil = await tanya(
          `update santri set kelas = $3, diperbarui = now()
            where unit_id = $1 and coalesce(nullif(trim(kelas), ''), '') = $2
            returning id`,
          [sesi.unit_id, lama, namaBaru],
        );
        dipindah = hasil.rowCount;
      }

      const { kelas: sesudah, ringkasan } = await kelasBantuan.gabung(sesi.unit_id);
      res.json({ ok: true, kelas: sesudah, ringkasan, dipindah, pesan: `Kelas ${lama} diperbarui.` });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Hapus satu kelas; isinya dipindahkan lebih dahulu bila `pindahKe` diisi. */
  app.delete("/api/unit/kelas/:nama", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const nama = namaKelas(decodeURIComponent(req.params.nama));
      const pindahKe = namaKelas(req.body?.pindahKe ?? req.query.pindahKe);
      if (!nama) return res.status(400).json({ pesan: "Kelas yang dihapus belum dipilih." });
      const kelas = await kelasBantuan.ambil(sesi.unit_id);
      const posisi = kelas.findIndex((k) => k.nama.toLowerCase() === nama.toLowerCase());
      if (posisi < 0) return res.status(404).json({ pesan: `Kelas ${nama} tidak ditemukan pada unit ini.` });
      if (pindahKe && pindahKe.toLowerCase() === nama.toLowerCase()) {
        return res.status(400).json({ pesan: "Kelas tujuan pemindahan sama dengan kelas yang dihapus." });
      }
      if (pindahKe && !(await adaDiDaftar(sesi.unit_id, pindahKe))) {
        return res.status(400).json({ pesan: `Kelas ${pindahKe} belum terdaftar pada unit ini.` });
      }

      const isi = await jumlahDiKelas(sesi.unit_id, nama);
      if (isi > 0 && !pindahKe) {
        return res.status(400).json({
          pesan: `Kelas ${nama} masih berisi ${isi} peserta didik aktif. Pilih kelas tujuan pemindahannya lebih dahulu.`,
        });
      }

      let dipindah = 0;
      if (isi > 0) {
        const hasil = await tanya(
          `update santri set kelas = $3, diperbarui = now()
            where unit_id = $1 and status = $2 and coalesce(nullif(trim(kelas), ''), '') = $4
            returning id`,
          [sesi.unit_id, STATUS_AKTIF, pindahKe || null, nama],
        );
        dipindah = hasil.rowCount;
      }

      await kelasBantuan.simpan(
        sesi.unit_id,
        kelas.filter((_, i) => i !== posisi),
      );
      const { kelas: sesudah, ringkasan } = await kelasBantuan.gabung(sesi.unit_id);
      res.json({
        ok: true,
        kelas: sesudah,
        ringkasan,
        dipindah,
        pesan: dipindah > 0 ? `Kelas ${nama} dihapus, ${dipindah} peserta didik dipindahkan.` : `Kelas ${nama} dihapus.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
}
