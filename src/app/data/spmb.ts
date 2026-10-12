import { hariKe, tanggalBulanSingkat } from "../lib/format";

/* Data halaman SPMB — sama seperti situs rujukan. */

export const halamanSpmb = {
  judul: "SPMB",
  pengantar:
    "Sistem Penerimaan Murid & Mahasiswa Baru (SPMB) PC PERSIS Cibatu dibuka untuk lima jenjang formal, dari Raudhatul Athfal sampai perguruan tinggi. Pendaftaran dilakukan secara daring melalui formulir di bawah ini atau langsung ke sekretariat pada jam layanan.",
  catatan:
    "Data pendaftaran diteruskan ke panitia SPMB untuk diverifikasi. Setelah terkirim, isian dapat Anda teruskan ke WhatsApp admin dari tombol yang muncul.",
};

export type Gelombang = { id: string; nama: string; periode: string; kuota: string; sisa: string; status: string };

const geser = (hari: number) => tanggalBulanSingkat(hariKe(hari));

export const gelombang: Gelombang[] = [];

export const biaya: any[] = [];

/** Nomor WhatsApp admin panitia SPMB. */
export const waAdmin = "088224597479";
export const waAdminLink = waAdmin.replace(/\D/g, "").replace(/^0/, "62");
export const waAdminTeks = waAdmin.replace(/(\d{4})(\d{4})(\d+)/, "$1 $2 $3");
