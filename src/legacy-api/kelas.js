// @ts-nocheck
/**
 * Daftar kelas (rombel) satu unit pendidikan.
 *
 * Daftar kelas disimpan pada tabel `pengaturan` yang sudah ada, dengan kunci
 * `kelas-unit-<unitId>`, sehingga tidak perlu tabel baru maupun perubahan skema.
 * Nama kelas setiap peserta didik tetap tersimpan pada kolom `santri.kelas` yang
 * sudah dipakai panel nilai, tahfidz, statistik, dan tagihan.
 *
 * Isi tersimpan berbentuk: { daftar: [ { nama, wali, urutan } ] }
 */

const BATAS_NAMA = 30;
const BATAS_WALI = 60;

/** Kunci pengaturan untuk daftar kelas satu unit. */
const KUNCI = (unitId) => `kelas-unit-${unitId}`;

/** Rapikan nama kelas atau nama wali kelas: spasi ganda dibuang, panjang dibatasi. */
export function rapikanNama(nilai, batas = BATAS_NAMA) {
  if (nilai === null || nilai === undefined) return null;
  const teks = String(nilai).replace(/\s+/g, " ").trim();
  return teks ? teks.slice(0, batas) : null;
}

/** Urutan alami: 1A, 2A, 10A — angka dibandingkan sebagai angka, bukan huruf. */
export function bandingkanNama(a, b) {
  const pecah = (teks) => String(teks).match(/(\d+|\D+)/g) ?? [];
  const kiri = pecah(a);
  const kanan = pecah(b);
  for (let i = 0; i < Math.max(kiri.length, kanan.length); i += 1) {
    const x = kiri[i] ?? "";
    const y = kanan[i] ?? "";
    if (x === y) continue;
    const xAngka = /^\d+$/.test(x);
    const yAngka = /^\d+$/.test(y);
    if (xAngka && yAngka) return Number(x) - Number(y);
    if (xAngka !== yAngka) return xAngka ? -1 : 1;
    return x.localeCompare(y, "id");
  }
  return 0;
}

/** Bersihkan isi tersimpan menjadi daftar kelas yang urut dan tanpa nama kembar. */
function rapikanDaftar(isi) {
  const keluar = [];
  const terpakai = new Set();
  for (const baris of Array.isArray(isi) ? isi : []) {
    const nama = rapikanNama(baris && baris.nama);
    if (!nama) continue;
    const kunci = nama.toLowerCase();
    if (terpakai.has(kunci)) continue;
    terpakai.add(kunci);
    keluar.push({
      nama,
      wali: rapikanNama(baris && baris.wali, BATAS_WALI) ?? "",
      urutan: Number(baris && baris.urutan) || keluar.length + 1,
    });
  }
  keluar.sort((a, b) => a.urutan - b.urutan || bandingkanNama(a.nama, b.nama));
  return keluar.map((k, i) => ({ ...k, urutan: i + 1 }));
}

export default function bantuanKelas(tanya) {
  const satu = async (sql, nilai) => (await tanya(sql, nilai)).rows[0] ?? null;
  const banyak = async (sql, nilai) => (await tanya(sql, nilai)).rows ?? [];

  /**
   * Daftar kelas tersimpan. Bila sekolah belum pernah mengaturnya, daftar disusun
   * dari kelas yang sudah tercatat pada data peserta didik supaya langsung terisi.
   */
  async function ambil(unitId) {
    const baris = await satu("select nilai from pengaturan where kunci = $1", [KUNCI(unitId)]);
    const isi = baris && baris.nilai && Array.isArray(baris.nilai.daftar) ? baris.nilai.daftar : null;
    if (isi) return rapikanDaftar(isi);

    const tercatat = await banyak(
      `select distinct trim(kelas) as nama from santri
        where unit_id = $1 and coalesce(nullif(trim(kelas), ''), '') <> ''`,
      [unitId],
    );
    return tercatat
      .map((r) => ({ nama: rapikanNama(r.nama), wali: "", urutan: 0 }))
      .filter((k) => k.nama)
      .map((k) => ({ ...k, urutan: 0 }))
      .sort((a, b) => bandingkanNama(a.nama, b.nama))
      .map((k, i) => ({ ...k, urutan: i + 1 }));
  }

  /** Simpan daftar kelas satu unit. */
  async function simpan(unitId, daftarKelas) {
    const bersih = rapikanDaftar(daftarKelas);
    await tanya(
      `insert into pengaturan (kunci, nilai, kelompok, keterangan)
       values ($1, $2::jsonb, 'sekolah', 'Daftar kelas (rombel) unit pendidikan')
       on conflict (kunci) do update set nilai = excluded.nilai, diperbarui = now()`,
      [KUNCI(unitId), JSON.stringify({ daftar: bersih })],
    );
    return bersih;
  }

  /** Jumlah peserta didik aktif per kelas; kelas kosong berarti belum berkelas. */
  async function hitung(unitId) {
    const baris = await banyak(
      `select coalesce(nullif(trim(kelas), ''), '') as kelas, count(*)::int as jumlah
         from santri
        where unit_id = $1 and status = 'aktif'
        group by 1`,
      [unitId],
    );
    const peta = new Map(baris.map((r) => [r.kelas, Number(r.jumlah) || 0]));
    return peta;
  }

  /** Daftar kelas beserta jumlah peserta aktif dan ringkasannya. */
  async function gabung(unitId) {
    const [daftarKelas, peta] = await Promise.all([ambil(unitId), hitung(unitId)]);
    const kelas = daftarKelas.map((k) => ({ ...k, jumlah: peta.get(k.nama) ?? 0 }));
    const dikenal = new Set(kelas.map((k) => k.nama.toLowerCase()));

    /* Kelas yang sudah dipakai pada data peserta didik tetapi belum terdaftar. */
    for (const [nama, jumlah] of peta) {
      if (!nama || dikenal.has(nama.toLowerCase())) continue;
      kelas.push({ nama, wali: "", urutan: kelas.length + 1, jumlah, belumTerdaftar: true });
    }

    let berKelas = 0;
    for (const k of kelas) berKelas += k.jumlah;
    const belum = peta.get("") ?? 0;
    return {
      kelas,
      ringkasan: { total: kelas.length, berKelas, belum, peserta: berKelas + belum },
    };
  }

  return { ambil, simpan, hitung, gabung, KUNCI };
}
