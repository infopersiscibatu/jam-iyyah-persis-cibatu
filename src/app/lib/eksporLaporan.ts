/**
 * Ekspor laporan tagihan Tata Usaha ke Excel dan PDF.
 *
 * Tampilannya sengaja dibuat mengikuti tabel di layar: kepala krem, kolom nama di kiri,
 * kolom bulan berisi tanda ✓ / X, lalu Total lunas dan Sisa tunggakan di kanan. Baris
 * nama ikut dibekukan di Excel (Freeze Pane) supaya perilakunya sama seperti di panel.
 *
 * Pustaka beratnya (exceljs, jspdf) baru dipanggil saat tombolnya ditekan, jadi halaman
 * panel tidak ikut memberat.
 */

import type { Styles } from "jspdf-autotable";
import { angkaRingkas, rupiah, rupiahSingkat } from "./format";
import type { BarisLaporan, JawabanLaporan, StatusSelLaporan } from "./unitTataUsaha";

export type OpsiEksporLaporan = {
  /** Judul laporan, biasanya nama kategori tagihan. */
  judul: string;
  /** Nama unit pendidikan yang dipakai di kepala berkas. */
  unit?: string;
  /** Keterangan tambahan bila perlu. */
  keterangan?: string;
};

/* Warna disamakan dengan token tema panel di src/app/index.css. */
const WARNA = {
  persis: "#0e4b2b",
  mint: "#e9f2ec",
  emas: "#8a6a12",
  emasMuda: "#faf1da",
  emasTerang: "#ecd27f",
  merah: "#be123c",
  merahMuda: "#f7e6e6",
  krem: "#fffdf8",
  kremTua: "#faf6ec",
  tinta: "#10231a",
  tintaMuda: "#55655d",
  abuAbu: "#8b968f",
  garis: "#e7e4da",
  putih: "#ffffff",
} as const;

/** ExcelJS memakai warna ARGB (8 digit). */
const argb = (warna: string) => `FF${warna.slice(1).toUpperCase()}`;

const HURUF_SEL: Record<StatusSelLaporan, string> = {
  lunas: "✓",
  menunggu: "✓",
  belum: "X",
  kosong: "–",
};

const LATAR_SEL: Record<StatusSelLaporan, string | null> = {
  lunas: WARNA.mint,
  menunggu: WARNA.emasMuda,
  belum: WARNA.merahMuda,
  kosong: null,
};

const TINTA_SEL: Record<StatusSelLaporan, string> = {
  lunas: WARNA.persis,
  menunggu: WARNA.emas,
  belum: WARNA.merah,
  kosong: WARNA.abuAbu,
};

const KETERANGAN_SEL: Record<StatusSelLaporan, string> = {
  lunas: "sudah dibayar",
  menunggu: "sudah dibayar, menunggu verifikasi",
  belum: "belum dibayar",
  kosong: "belum ditagihkan",
};

const tanggalIndo = (tanggal = new Date()) =>
  tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const slug = (teks: string) =>
  teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "laporan";

const namaBerkas = (laporan: JawabanLaporan, opsi: OpsiEksporLaporan, ekstensi: string) =>
  `${slug(`laporan-${opsi.judul}-${laporan.tahun}`)}.${ekstensi}`;

/** Keterangan satu baris di bawah judul: unit, jenis tagihan, nominal, tahun. */
const barisKeterangan = (laporan: JawabanLaporan, opsi: OpsiEksporLaporan) => {
  const kategori = laporan.kategori;
  const bagian = [
    opsi.unit,
    kategori.tipe === "bulanan" ? "Tagihan bulanan" : "Sekali bayar",
    kategori.nominal > 0
      ? `${rupiah(kategori.nominal)}${kategori.tipe === "bulanan" ? " per bulan" : " sekali bayar"}`
      : "",
    `Tahun ${laporan.tahun}`,
  ];
  return bagian.filter(Boolean).join(" · ");
};

const subNama = (baris: BarisLaporan) => [baris.kelas, baris.programNama].filter(Boolean).join(" · ");

const simpanBlob = (blob: Blob, nama: string) => {
  const tautan = document.createElement("a");
  const alamat = URL.createObjectURL(blob);
  tautan.href = alamat;
  tautan.download = nama;
  tautan.rel = "noopener";
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  /* Alamat blob baru dilepas setelah peramban selesai mengunduh. */
  setTimeout(() => URL.revokeObjectURL(alamat), 10000);
};

/* ================================== Excel ================================== */

/** Berkas .xlsx bergaya sama dengan tabel di layar; angkanya berupa angka asli. */
export async function buatLaporanExcel(laporan: JawabanLaporan, opsi: OpsiEksporLaporan): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;

  const kolom = laporan.kolom;
  const kolomNama = 1;
  const kolomAwalBulan = 2;
  const kolomLunas = kolom.length + 2;
  const kolomSisa = kolom.length + 3;
  const kolomAkhir = kolomSisa;
  const barisAwalData = 6;
  const satuan = laporan.bulanan ? "bulan" : "tahun";
  const jumlahKolom = new Map(laporan.kolomJumlah.map((j) => [j.kunci, j]));

  const buku = new ExcelJS.Workbook();
  buku.creator = "Panel Tata Usaha PC PERSIS Cibatu";
  buku.created = new Date();

  const lembar = buku.addWorksheet("Laporan", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, /* A4 */
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "5:5",
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  /* Kolom nama dan kepala tabel dibekukan, sama seperti di layar. */
  lembar.views = [{ state: "frozen", xSplit: 1, ySplit: 5 }];

  const garisBawah = { bottom: { style: "thin" as const, color: { argb: argb(WARNA.garis) } } };
  const garisAtas = { top: { style: "thin" as const, color: { argb: argb(WARNA.garis) } } };

  lembar.getColumn(kolomNama).width = 30;
  kolom.forEach((_, urutan) => {
    lembar.getColumn(kolomAwalBulan + urutan).width = 6.5;
  });
  lembar.getColumn(kolomLunas).width = 15;
  lembar.getColumn(kolomSisa).width = 15;

  /* ------------------------------- kepala berkas ------------------------------- */
  lembar.getRow(1).height = 24;
  lembar.mergeCells(1, kolomNama, 1, kolomAkhir);
  const selJudul = lembar.getCell(1, kolomNama);
  selJudul.value = `Laporan ${opsi.judul}`;
  selJudul.font = { bold: true, size: 14, color: { argb: argb(WARNA.persis) } };
  selJudul.alignment = { vertical: "middle" };

  lembar.mergeCells(2, kolomNama, 2, kolomAkhir);
  const selKeterangan = lembar.getCell(2, kolomNama);
  selKeterangan.value = barisKeterangan(laporan, opsi);
  selKeterangan.font = { size: 10, color: { argb: argb(WARNA.tintaMuda) } };

  lembar.mergeCells(3, kolomNama, 3, kolomAkhir);
  const selCatatan = lembar.getCell(3, kolomNama);
  selCatatan.value = `Diekspor ${tanggalIndo()} · ${laporan.ringkasan.peserta} ${laporan.sebutan} · ${
    laporan.ringkasan.menunggak
  } masih menunggak${opsi.keterangan ? ` · ${opsi.keterangan}` : ""}`;
  selCatatan.font = { size: 9, color: { argb: argb(WARNA.abuAbu) } };

  lembar.getRow(4).height = 6;

  /* ------------------------------ kepala tabel ------------------------------ */
  const barisKepala = lembar.getRow(5);
  barisKepala.height = 32;
  const kepala = (nomorKolom: number, teks: string, rata: "left" | "center" | "right") => {
    const sel = lembar.getCell(5, nomorKolom);
    sel.value = teks;
    sel.font = { bold: true, size: 9, color: { argb: argb(WARNA.tintaMuda) } };
    sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(WARNA.krem) } };
    sel.alignment = { horizontal: rata, vertical: "middle", wrapText: true };
    sel.border = garisBawah;
  };

  kepala(kolomNama, "Nama", "left");
  kolom.forEach((k, urutan) => kepala(kolomAwalBulan + urutan, k.label, "center"));
  kepala(kolomLunas, "Total lunas", "right");
  lembar.getCell(5, kolomLunas).border = {
    ...garisBawah,
    left: { style: "thin", color: { argb: argb(WARNA.garis) } },
  };
  kepala(kolomSisa, "Sisa tunggakan", "right");

  /* --------------------------------- isi tabel --------------------------------- */
  laporan.baris.forEach((b, urutan) => {
    const nomor = barisAwalData + urutan;
    lembar.getRow(nomor).height = 26;

    const anak = subNama(b);
    const selNama = lembar.getCell(nomor, kolomNama);
    selNama.value = {
      richText: [
        { font: { bold: true, size: 10, color: { argb: argb(WARNA.tinta) } }, text: b.nama },
        ...(anak ? [{ font: { size: 8, color: { argb: argb(WARNA.abuAbu) } }, text: `\n${anak}` }] : []),
      ],
    };
    selNama.alignment = { vertical: "top", wrapText: true };
    selNama.border = garisBawah;
    if (b.status && b.status !== "aktif") selNama.note = `Status peserta: ${b.status}`;

    kolom.forEach((k, urutanKolom) => {
      const isi = b.sel[k.kunci];
      const status: StatusSelLaporan = isi ? isi.status : "kosong";
      const sel = lembar.getCell(nomor, kolomAwalBulan + urutanKolom);
      sel.value = HURUF_SEL[status];
      sel.font = { bold: true, size: 10, color: { argb: argb(TINTA_SEL[status]) } };
      sel.alignment = { horizontal: "center", vertical: "middle" };
      sel.border = garisBawah;
      const latar = LATAR_SEL[status];
      if (latar) sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(latar) } };
      sel.note = `${k.keterangan}: ${KETERANGAN_SEL[status]}${
        isi && isi.nominal > 0 ? ` ${rupiah(isi.nominal)}` : ""
      }`;
    });

    const selLunas = lembar.getCell(nomor, kolomLunas);
    selLunas.value = b.lunas;
    selLunas.numFmt = '"Rp"#,##0';
    selLunas.font = { bold: true, size: 10, color: { argb: argb(WARNA.persis) } };
    selLunas.alignment = { horizontal: "right", vertical: "middle" };
    selLunas.border = { ...garisBawah, left: { style: "thin", color: { argb: argb(WARNA.garis) } } };
    selLunas.note = `${b.jumlahLunas} ${satuan} lunas dari ${rupiah(b.ditagih)} yang ditagihkan`;

    const selSisa = lembar.getCell(nomor, kolomSisa);
    selSisa.value = b.tunggakan;
    selSisa.numFmt = '"Rp"#,##0';
    selSisa.font = { bold: true, size: 10, color: { argb: argb(b.tunggakan > 0 ? WARNA.merah : WARNA.abuAbu) } };
    selSisa.alignment = { horizontal: "right", vertical: "middle" };
    selSisa.border = garisBawah;
    selSisa.note =
      b.jumlahTunggakan > 0
        ? `${b.jumlahTunggakan} ${satuan} belum dibayar`
        : "tidak ada tunggakan pada kolom yang ditampilkan";
  });

  /* -------------------------------- baris jumlah -------------------------------- */
  const nomorJumlah = barisAwalData + laporan.baris.length;
  lembar.getRow(nomorJumlah).height = 22;

  const isiJumlah = (
    nomorKolom: number,
    nilai: string | number,
    rata: "left" | "center" | "right",
  ) => {
    const sel = lembar.getCell(nomorJumlah, nomorKolom);
    sel.value = nilai;
    sel.font = { bold: true, size: 9, color: { argb: argb(WARNA.tintaMuda) } };
    sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(WARNA.kremTua) } };
    sel.alignment = { horizontal: rata, vertical: "middle" };
    sel.border = garisAtas;
    return sel;
  };

  isiJumlah(kolomNama, "Jumlah lunas", "left");
  kolom.forEach((k, urutan) => {
    const jumlah = jumlahKolom.get(k.kunci);
    isiJumlah(kolomAwalBulan + urutan, jumlah && jumlah.lunas > 0 ? angkaRingkas(jumlah.lunas) : "–", "center");
  });

  const jumlahLunas = isiJumlah(kolomLunas, laporan.ringkasan.lunas, "right");
  jumlahLunas.numFmt = '"Rp"#,##0';
  jumlahLunas.font = { bold: true, size: 10, color: { argb: argb(WARNA.persis) } };
  jumlahLunas.border = { ...garisAtas, left: { style: "thin", color: { argb: argb(WARNA.garis) } } };

  const jumlahSisa = isiJumlah(kolomSisa, laporan.ringkasan.tunggakan, "right");
  jumlahSisa.numFmt = '"Rp"#,##0';
  jumlahSisa.font = {
    bold: true,
    size: 10,
    color: { argb: argb(laporan.ringkasan.tunggakan > 0 ? WARNA.merah : WARNA.abuAbu) },
  };

  /* ---------------------------------- catatan ---------------------------------- */
  let nomorCatatan = nomorJumlah + 2;
  const catatan = (teks: string) => {
    lembar.mergeCells(nomorCatatan, kolomNama, nomorCatatan, kolomAkhir);
    const sel = lembar.getCell(nomorCatatan, kolomNama);
    sel.value = teks;
    sel.font = { size: 8, color: { argb: argb(WARNA.abuAbu) } };
    nomorCatatan += 1;
  };

  catatan("Tanda sel: ✓ sudah dibayar · ✓ kuning menunggu verifikasi · X belum dibayar · – belum ditagihkan.");
  catatan("Angka pada kolom Total lunas dan Sisa tunggakan bisa langsung dijumlahkan di Excel. Arahkan kursor ke sel untuk melihat keterangannya.");
  if (laporan.cari) catatan(`Laporan ini disaring dengan pencarian “${laporan.cari}”.`);
  if (laporan.saring) catatan(`Saringan peserta: ${laporan.saring === "aktif" ? "hanya yang aktif" : "semua nama"}.`);
  if (laporan.penuh) catatan("Laporan memuat lebih dari 500 nama; yang diekspor 500 nama pertama saja.");

  const isi = (await buku.xlsx.writeBuffer()) as unknown as ArrayBuffer;
  return new Blob([isi], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Unduh laporan sebagai berkas Excel .xlsx. */
export async function unduhLaporanExcel(laporan: JawabanLaporan, opsi: OpsiEksporLaporan): Promise<void> {
  simpanBlob(await buatLaporanExcel(laporan, opsi), namaBerkas(laporan, opsi, "xlsx"));
}

/* =================================== PDF =================================== */

type Kotak = { x: number; y: number; width: number; height: number };

/** Tanda ✓ / X / – digambar sebagai garis vektor, jadi tampil sama di semua pembaca PDF. */
function gambarTanda(dok: import("jspdf").jsPDF, status: StatusSelLaporan, kotak: Kotak) {
  const { x, y, width, height } = kotak;
  const latar = LATAR_SEL[status];
  if (latar) {
    dok.setFillColor(latar);
    dok.rect(x + 0.8, y + 0.8, width - 1.6, height - 1.6, "F");
  }

  dok.setDrawColor(TINTA_SEL[status]);
  dok.setLineWidth(1.1);
  dok.setLineCap("round");

  const tengahX = x + width / 2;
  const tengahY = y + height / 2;

  if (status === "belum") {
    dok.line(tengahX - 3.2, tengahY - 3.2, tengahX + 3.2, tengahY + 3.2);
    dok.line(tengahX + 3.2, tengahY - 3.2, tengahX - 3.2, tengahY + 3.2);
  } else if (status === "kosong") {
    dok.line(tengahX - 3.2, tengahY, tengahX + 3.2, tengahY);
  } else {
    dok.line(tengahX - 3.4, tengahY, tengahX - 1, tengahY + 3.4);
    dok.line(tengahX - 1, tengahY + 3.4, tengahX + 3.6, tengahY - 3.4);
  }

  /* garis bawah sel dikembalikan supaya kerangka tabel tetap rapi */
  dok.setDrawColor(WARNA.garis);
  dok.setLineWidth(0.5);
  dok.line(x, y + height, x + width, y + height);
}

function gambarNama(dok: import("jspdf").jsPDF, baris: BarisLaporan, kotak: Kotak) {
  const { x, y, width, height } = kotak;
  const kiri = x + 6;
  const batas = width - 12;
  const potongan = dok.splitTextToSize(baris.nama, batas);

  dok.setFont("helvetica", "bold");
  dok.setFontSize(8);
  dok.setTextColor(WARNA.tinta);

  if (potongan.length > 1) {
    dok.text(potongan.slice(0, 2), kiri, y + height / 2 - 4);
    return;
  }

  dok.text(potongan[0], kiri, y + height / 2 - 2);

  const anak = subNama(baris);
  if (anak) {
    dok.setFont("helvetica", "normal");
    dok.setFontSize(6.5);
    dok.setTextColor(WARNA.abuAbu);
    dok.text(dok.splitTextToSize(anak, batas)[0], kiri, y + height / 2 + 8);
  }
}

/** Berkas PDF satu laporan, lengkap dengan kepala berkas dan angka ringkas. */
export async function buatLaporanPdf(laporan: JawabanLaporan, opsi: OpsiEksporLaporan): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const kolom = laporan.kolom;
  const dok = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const lebarHalaman = dok.internal.pageSize.getWidth();
  const tinggiHalaman = dok.internal.pageSize.getHeight();
  const tepi = 26;
  const lebarIsi = lebarHalaman - tepi * 2;

  /* -------------------------------- kepala berkas -------------------------------- */
  dok.setFont("helvetica", "bold");
  dok.setFontSize(13);
  dok.setTextColor(WARNA.persis);
  dok.text(`Laporan ${opsi.judul}`, tepi, 32);

  dok.setFont("helvetica", "normal");
  dok.setFontSize(8.5);
  dok.setTextColor(WARNA.tintaMuda);
  dok.text(barisKeterangan(laporan, opsi), tepi, 46);

  dok.setFontSize(7.5);
  dok.setTextColor(WARNA.abuAbu);
  dok.text(`Diekspor ${tanggalIndo()}${opsi.keterangan ? ` · ${opsi.keterangan}` : ""}`, tepi, 58);

  dok.setDrawColor(WARNA.persis);
  dok.setLineWidth(1.2);
  dok.line(tepi, 66, lebarHalaman - tepi, 66);

  /* -------------------------------- angka ringkas -------------------------------- */
  const kartu = [
    {
      judul: "DITAGIHKAN",
      nilai: rupiahSingkat(laporan.ringkasan.ditagih),
      catatan: `${laporan.ringkasan.peserta} ${laporan.sebutan}`,
      latar: WARNA.putih,
      tepiKartu: WARNA.garis,
      judulWarna: WARNA.abuAbu,
      nilaiWarna: WARNA.tinta,
      catatanWarna: WARNA.abuAbu,
    },
    {
      judul: "TOTAL LUNAS",
      nilai: rupiahSingkat(laporan.ringkasan.lunas),
      catatan: `${laporan.ringkasan.sudahLunas} sudah lunas penuh`,
      latar: WARNA.persis,
      tepiKartu: WARNA.persis,
      judulWarna: WARNA.emasTerang,
      nilaiWarna: WARNA.putih,
      catatanWarna: "#d9e3dd",
    },
    {
      judul: "SISA TUNGGAKAN",
      nilai: rupiahSingkat(laporan.ringkasan.tunggakan),
      catatan: `${laporan.ringkasan.menunggak} masih menunggak`,
      latar: WARNA.merahMuda,
      tepiKartu: WARNA.merahMuda,
      judulWarna: WARNA.merah,
      nilaiWarna: WARNA.merah,
      catatanWarna: WARNA.tintaMuda,
    },
  ];

  const lebarKartu = (lebarIsi - 16) / 3;
  kartu.forEach((k, urutan) => {
    const x = tepi + urutan * (lebarKartu + 8);
    const y = 76;
    const tinggi = 34;
    dok.setFillColor(k.latar);
    dok.setDrawColor(k.tepiKartu);
    dok.setLineWidth(0.8);
    dok.roundedRect(x, y, lebarKartu, tinggi, 5, 5, "FD");

    dok.setFont("helvetica", "bold");
    dok.setFontSize(6.5);
    dok.setTextColor(k.judulWarna);
    dok.text(k.judul, x + 7, y + 11);

    dok.setFontSize(11.5);
    dok.setTextColor(k.nilaiWarna);
    dok.text(k.nilai, x + 7, y + 25);

    dok.setFont("helvetica", "normal");
    dok.setFontSize(6.5);
    dok.setTextColor(k.catatanWarna);
    dok.text(k.catatan, x + lebarKartu - 7, y + 25, { align: "right" });
  });

  /* ----------------------------------- tabel ----------------------------------- */
  const lebarBulan = Math.max(30, Math.min(46, (lebarIsi - 170 - 128) / Math.max(1, kolom.length)));
  const lebarTotal = 64;

  const gayaKolom: Record<string, Partial<Styles>> = {
    "0": { cellWidth: 170, halign: "left" },
  };
  kolom.forEach((_, urutan) => {
    gayaKolom[String(urutan + 1)] = { cellWidth: lebarBulan, halign: "center" };
  });
  gayaKolom[String(kolom.length + 1)] = {
    cellWidth: lebarTotal,
    halign: "right",
    /* garis pemisah tipis sebelum kolom angka, sama seperti di layar */
    lineColor: WARNA.garis,
    lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0.5 },
  };
  gayaKolom[String(kolom.length + 2)] = { cellWidth: lebarTotal, halign: "right" };

  const isiTabel = laporan.baris.map((b) => [
    "",
    ...kolom.map(() => ""),
    b.lunas > 0 ? rupiahSingkat(b.lunas) : "—",
    b.tunggakan > 0 ? rupiahSingkat(b.tunggakan) : "—",
  ]);

  const jumlahKolom = new Map(laporan.kolomJumlah.map((j) => [j.kunci, j]));
  const barisJumlah = [
    "Jumlah lunas",
    ...kolom.map((k) => {
      const jumlah = jumlahKolom.get(k.kunci);
      return jumlah && jumlah.lunas > 0 ? angkaRingkas(jumlah.lunas) : "–";
    }),
    rupiahSingkat(laporan.ringkasan.lunas),
    laporan.ringkasan.tunggakan > 0 ? rupiahSingkat(laporan.ringkasan.tunggakan) : "—",
  ];

  const nomorKolomSisa = kolom.length + 2;

  autoTable(dok, {
    startY: 122,
    margin: { left: tepi, right: tepi },
    tableWidth: "auto",
    head: [["Nama", ...kolom.map((k) => k.label), "Total lunas", "Sisa tunggakan"]],
    body: isiTabel,
    foot: [barisJumlah],
    showHead: "everyPage",
    showFoot: "lastPage",
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: WARNA.tinta,
      valign: "middle",
      minCellHeight: 24,
      lineColor: WARNA.garis,
      lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 },
    },
    headStyles: {
      fillColor: WARNA.krem,
      textColor: WARNA.abuAbu,
      fontStyle: "bold",
      fontSize: 7,
      minCellHeight: 20,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 },
    },
    footStyles: {
      fillColor: WARNA.kremTua,
      textColor: WARNA.tintaMuda,
      fontStyle: "bold",
      fontSize: 7.5,
      lineColor: WARNA.garis,
      lineWidth: { top: 0.5, right: 0, bottom: 0, left: 0 },
    },
    columnStyles: gayaKolom,
    didParseCell: (data) => {
      /* Nama dan kolom bulan digambar sendiri supaya bisa memakai tanda ✓ / X. */
      if (data.section === "body" && data.column.index <= kolom.length) data.cell.text = [];
      if (data.section === "body" && data.column.index === nomorKolomSisa) {
        const b = laporan.baris[data.row.index];
        data.cell.styles.textColor = b && b.tunggakan > 0 ? WARNA.merah : WARNA.abuAbu;
      }
      if (data.section === "body" && data.column.index === kolom.length + 1) {
        data.cell.styles.textColor = WARNA.persis;
        data.cell.styles.fontStyle = "bold";
      }
    },
    didDrawCell: (data) => {
      if (data.section !== "body") return;
      const b = laporan.baris[data.row.index];
      if (!b) return;
      if (data.column.index === 0) {
        gambarNama(dok, b, data.cell);
        return;
      }
      if (data.column.index <= kolom.length) {
        const k = kolom[data.column.index - 1];
        const isi = b.sel[k.kunci];
        gambarTanda(dok, isi ? isi.status : "kosong", data.cell);
      }
    },
  });

  /* ---------------------------------- catatan ---------------------------------- */
  const akhirTabel =
    (dok as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tinggiHalaman - 60;
  let posisiCatatan = akhirTabel + 16;

  dok.setFont("helvetica", "normal");
  dok.setFontSize(7);
  let posisiX = tepi;
  const legenda: { status: StatusSelLaporan; teks: string }[] = [
    { status: "lunas", teks: "sudah dibayar" },
    { status: "menunggu", teks: "sudah dibayar, menunggu verifikasi" },
    { status: "belum", teks: "belum dibayar" },
    { status: "kosong", teks: "belum ditagihkan" },
  ];
  legenda.forEach((l) => {
    gambarTanda(dok, l.status, { x: posisiX, y: posisiCatatan - 8, width: 11, height: 11 });
    dok.setFontSize(7);
    dok.setTextColor(WARNA.tintaMuda);
    dok.text(l.teks, posisiX + 14, posisiCatatan);
    posisiX += 14 + dok.getTextWidth(l.teks) + 16;
  });

  const catatanKaki = [
    laporan.cari ? `Disaring dengan pencarian “${laporan.cari}”.` : "",
    laporan.saring ? `Saringan peserta: ${laporan.saring === "aktif" ? "hanya yang aktif" : "semua nama"}.` : "",
    laporan.penuh ? "Laporan memuat lebih dari 500 nama; yang diekspor 500 nama pertama saja." : "",
  ].filter(Boolean);

  catatanKaki.forEach((teks) => {
    posisiCatatan += 11;
    dok.setFontSize(7);
    dok.setTextColor(WARNA.abuAbu);
    dok.text(teks, tepi, posisiCatatan);
  });

  /* ------------------------------ kaki tiap halaman ------------------------------ */
  const jumlahHalaman = dok.getNumberOfPages();
  for (let halaman = 1; halaman <= jumlahHalaman; halaman += 1) {
    dok.setPage(halaman);
    dok.setFont("helvetica", "normal");
    dok.setFontSize(7);
    dok.setTextColor(WARNA.abuAbu);
    dok.text(opsi.unit ?? "PC PERSIS Cibatu", tepi, tinggiHalaman - 14);
    dok.text(`Halaman ${halaman} dari ${jumlahHalaman}`, lebarHalaman / 2, tinggiHalaman - 14, { align: "center" });
    dok.text(`Dicetak ${tanggalIndo()}`, lebarHalaman - tepi, tinggiHalaman - 14, { align: "right" });
  }

  return dok.output("blob");
}

/** Unduh laporan sebagai berkas PDF. */
export async function unduhLaporanPdf(laporan: JawabanLaporan, opsi: OpsiEksporLaporan): Promise<void> {
  simpanBlob(await buatLaporanPdf(laporan, opsi), namaBerkas(laporan, opsi, "pdf"));
}
