/**
 * Pengiriman donasi dari formulir situs.
 *
 * Setiap donasi dikirim ke server dan tersimpan dengan status "menunggu" supaya
 * petugas ZIS dapat memverifikasinya dari halaman Admin ZIS. Halaman program tidak
 * menyimpan salinan di peramban: yang tampil di sana (dana terkumpul, donatur,
 * riwayat) hanya data yang benar-benar tercatat di database.
 */
export type IsianDonasiServer = {
  program: string;
  nama: string;
  anonim: boolean;
  telepon: string;
  jumlah: number;
  pesan: string;
  metode: string;
};

/** Kirim donasi ke server; mengembalikan nomor donasi yang dibuat petugas lihat. */
export async function kirimDonasiKeServer(isian: IsianDonasiServer): Promise<{ id: number; nomor: string }> {
  const jawab = await fetch("/api/donasi", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(isian),
  });
  const isi = (await jawab.json().catch(() => ({}))) as {
    ok?: boolean;
    pesan?: string;
    donasi?: { id: number; nomor: string };
  };
  if (!jawab.ok || !isi.ok || !isi.donasi) {
    throw new Error(isi.pesan || "Donasi belum bisa dikirim. Periksa sambungan lalu coba lagi.");
  }
  return isi.donasi;
}
