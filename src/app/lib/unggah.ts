import { mintaUnit } from "./unitSpmb";
import { siapkanUnggahan } from "./kompresGambar";

/**
 * Unggah satu berkas gambar dari panel mana pun (admin, unit, ZIS, tata usaha).
 * Berkas dikirim sebagai data URL ke /api/unggah dan disimpan di penyimpanan objek
 * platform, jadi gambarnya tetap ada meski aplikasi dipasang ulang.
 */
export async function unggahGambar(berkas: File, folder = "umum"): Promise<{ id: string; url: string }> {
  const kiriman = await siapkanUnggahan(berkas);
  const jawab = await mintaUnit<{ media: { id: string; url: string } }>("/api/unggah", {
    method: "POST",
    body: JSON.stringify({ ...kiriman, folder, alt: berkas.name }),
  });
  return jawab.media;
}
