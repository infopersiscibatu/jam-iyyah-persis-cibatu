// @ts-nocheck

/**
 * Pengelola perangkat notifikasi untuk panel admin.
 *
 * Setiap HP yang pernah mengaktifkan notifikasi situs tercatat satu baris di
 * push_langganan. Panel admin perlu melihat daftar itu, mencoba mengirim
 * notifikasi uji, dan menghapus perangkat yang bermasalah supaya HP-nya bisa
 * mendaftar ulang dari awal dengan langganan yang baru.
 *
 * Alamat (endpoint) asli perangkat tidak pernah dikirim ke peramban: daftar ini
 * memakai sidik jari md5(endpoint) sebagai penggantinya, sehingga halaman admin
 * tidak bisa dipakai orang lain untuk mengirim notifikasi langsung ke HP jamaah.
 */
const __ekspor = function pasangRutePerangkat(app, { tanya, push }) {
  const LABEL_LEMBAGA = "PC PERSIS Cibatu";

  /** Sidik jari perangkat beserta kolom yang ditampilkan di panel. */
  const KOLOM = `
    md5(endpoint) as id,
    perangkat,
    dibuat,
    diubah,
    santri_id,
    (select s.nama from santri s where s.id = push_langganan.santri_id) as santri`;

  /** Daftar perangkat yang terdaftar menerima notifikasi. */
  app.get("/api/admin/perangkat-notifikasi", async (_req, res) => {
    try {
      const { rows } = await tanya(
        `select ${KOLOM}
           from push_langganan
          order by coalesce(diubah, dibuat) desc nulls last`,
      );
      const { rows: ringkas } = await tanya(
        `select count(*)::int as total,
                count(*) filter (where santri_id is not null)::int as terikat
           from push_langganan`,
      );
      res.json({
        ok: true,
        total: ringkas[0].total,
        terikat: ringkas[0].terikat,
        perangkat: rows.map((r) => ({
          id: r.id,
          perangkat: r.perangkat || null,
          dibuat: r.dibuat || null,
          diubah: r.diubah || null,
          santri: r.santri || null,
        })),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Kirim notifikasi uji ke satu perangkat atau ke seluruh perangkat. */
  app.post("/api/admin/perangkat-notifikasi/uji", async (req, res) => {
    try {
      const { id, semua } = req.body || {};
      const item = {
        jenis: "uji",
        judul: `Uji notifikasi \u00b7 ${LABEL_LEMBAGA}`,
        isi: "Notifikasi uji coba dari panel admin. Postingan terbaru akan muncul seperti ini di layar HP.",
        tautan: "/",
        kunci: `uji-${Date.now()}`,
      };

      if (!semua) {
        if (!id) return res.status(400).json({ pesan: "Perangkat tidak dipilih." });
        const { rows } = await tanya(
          "select endpoint from push_langganan where md5(endpoint) = $1",
          [id],
        );
        if (rows.length === 0) {
          return res.status(404).json({ pesan: "Perangkat itu sudah tidak ada di daftar." });
        }
        try {
          await push.kirimKePerangkat(rows[0].endpoint, item);
          return res.json({
            ok: true,
            total: 1,
            terkirim: 1,
            gagal: 0,
            pesan: "Notifikasi uji sudah dikirim. Periksa layar HP itu.",
          });
        } catch (e) {
          return res.json({
            ok: true,
            total: 1,
            terkirim: 0,
            gagal: 1,
            pesan:
              e && e.status === 410
                ? "Langganan perangkat itu sudah tidak berlaku dan barisnya sudah dibersihkan. Buka aplikasi di HP itu, lalu aktifkan notifikasi lagi."
                : `Notifikasi uji gagal dikirim: ${e && e.message ? e.message : "tidak diketahui"}.`,
          });
        }
      }

      const { rows } = await tanya(
        "select endpoint from push_langganan order by coalesce(diubah, dibuat) desc nulls last",
      );
      let terkirim = 0;
      let gagal = 0;
      await Promise.all(
        rows.map(async (r) => {
          try {
            await push.kirimKePerangkat(r.endpoint, item);
            terkirim += 1;
          } catch (e) {
            gagal += 1;
            console.error("Uji perangkat gagal:", e && e.message);
          }
        }),
      );
      res.json({
        ok: true,
        total: rows.length,
        terkirim,
        gagal,
        pesan:
          `Notifikasi uji dikirim ke ${rows.length} perangkat: ${terkirim} sampai, ${gagal} gagal.` +
          (gagal > 0
            ? " Perangkat yang langganannya sudah tidak berlaku otomatis dibersihkan dari daftar."
            : ""),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Hapus satu perangkat dari daftar.
   *
   * Berguna ketika sebuah HP tidak lagi bisa menerima notifikasi: setelah barisnya
   * dihapus, HP itu akan membuat langganan baru saat notifikasinya diaktifkan lagi.
   */
  app.post("/api/admin/perangkat-notifikasi/hapus", async (req, res) => {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ pesan: "Perangkat tidak dipilih." });
      const hasil = await tanya("delete from push_langganan where md5(endpoint) = $1", [id]);
      if (!hasil.rowCount) {
        return res.status(404).json({ pesan: "Perangkat itu sudah tidak ada di daftar." });
      }
      const { rows } = await tanya("select count(*)::int as jumlah from push_langganan");
      res.json({
        ok: true,
        total: rows[0].jumlah,
        pesan:
          "Perangkat sudah dihapus dari daftar. Buka aplikasi di HP itu, lalu aktifkan notifikasi lagi supaya terdaftar sebagai perangkat baru.",
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
};

export default __ekspor;
