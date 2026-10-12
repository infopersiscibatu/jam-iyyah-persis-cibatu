// @ts-nocheck
/**
 * Penyiapan database (versi Lovable Cloud). Skema sudah dipasang lewat migrasi;
 * di sini hanya pengisian data awal (benih) sekali saja, sama seperti aslinya.
 */
import benihModul from "./benih.js";
import dataBenih from "./benih.json";

async function tandai(tanya, kunci, nilai) {
  await tanya(
    `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'sistem')
     on conflict (kunci) do update set nilai = excluded.nilai`,
    [kunci, JSON.stringify(nilai)],
  );
}

async function bacaTanda(tanya, kunci) {
  const { rows } = await tanya("select nilai from pengaturan where kunci = $1", [kunci]);
  return rows[0] ? rows[0].nilai : null;
}

async function siapkanSkema() {}

async function isiBenih(tanya) {
  // Data contoh dinonaktifkan atas permintaan pemilik: database dibiarkan kosong
  // dan seluruh isi situs diisi sendiri lewat halaman admin.
  return { diisi: false, versi: null };
}

async function siapkanDatabase(tanya) {
  await siapkanSkema(tanya);
  return isiBenih(tanya);
}

export default { siapkanDatabase, siapkanSkema, isiBenih, bacaTanda, tandai };
