/** Compression runs before upload, never in the server runtime. */
const SASARAN = 50 * 1024;
const KUALITAS_MINIMUM = 0.75;

async function animasi(berkas: File): Promise<boolean> {
  if (berkas.type !== "image/gif" && berkas.type !== "image/webp") return false;
  const bytes = new Uint8Array(await berkas.arrayBuffer());
  if (berkas.type === "image/webp") {
    return bytes.length > 20 && String.fromCharCode(...bytes.slice(12, 16)) === "VP8X" && Boolean((bytes[20] ?? 0) & 2);
  }
  // Graphics control extensions precede GIF frames. Keep animations intact.
  let bingkai = 0;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 4 && ++bingkai > 1) return true;
  }
  return false;
}

function enkode(canvas: HTMLCanvasElement, kualitas: number): Promise<Blob> {
  return new Promise((selesai, gagal) => {
    canvas.toBlob((blob) => blob ? selesai(blob) : gagal(new Error("Gambar tidak bisa dikompres. Coba gambar lain.")), "image/webp", kualitas);
  });
}

/** Do not upscale, crop, flatten transparency, or force tiny images to 30 KB. */
export async function kompresGambar(berkas: File): Promise<File> {
  if (!berkas.type.startsWith("image/") || berkas.size <= SASARAN) return berkas;
  // Vectors already retain perfect sharpness; animation must not become a still.
  if (berkas.type === "image/svg+xml" || await animasi(berkas)) return berkas;
  const url = URL.createObjectURL(berkas);
  const gambar = new Image();
  try {
    await new Promise<void>((selesai, gagal) => {
      gambar.onload = () => selesai();
      gambar.onerror = () => gagal(new Error("Gambar tidak terbaca. Gunakan JPG, PNG, WEBP, atau GIF."));
      gambar.src = url;
    });
    const panjang = Math.max(gambar.naturalWidth, gambar.naturalHeight);
    if (!panjang) throw new Error("Gambar kosong atau rusak.");
    const canvas = document.createElement("canvas");
    const konteks = canvas.getContext("2d");
    if (!konteks) throw new Error("Peramban tidak mendukung kompresi gambar.");
    let terbaik: Blob | null = null;
    // Start at full HD; retain at least a 1280px long edge for large originals.
    for (const batas of [1920, 1600, 1280]) {
      const skala = Math.min(1, batas / panjang);
      canvas.width = Math.max(1, Math.round(gambar.naturalWidth * skala));
      canvas.height = Math.max(1, Math.round(gambar.naturalHeight * skala));
      konteks.imageSmoothingEnabled = true;
      konteks.imageSmoothingQuality = "high";
      konteks.drawImage(gambar, 0, 0, canvas.width, canvas.height);
      const tinggi = await enkode(canvas, 0.92);
      if (!terbaik || tinggi.size < terbaik.size) terbaik = tinggi;
      if (tinggi.size <= SASARAN) { terbaik = tinggi; break; }
      let bawah = KUALITAS_MINIMUM;
      let atas = 0.92;
      const rendah = await enkode(canvas, bawah);
      if (!terbaik || rendah.size < terbaik.size) terbaik = rendah;
      if (rendah.size <= SASARAN) {
        terbaik = rendah;
        for (let langkah = 0; langkah < 5; langkah++) {
          const tengah = (bawah + atas) / 2;
          const hasil = await enkode(canvas, tengah);
          if (hasil.size <= SASARAN) { terbaik = hasil; bawah = tengah; }
          else atas = tengah;
        }
        break;
      }
      if (panjang <= batas) break;
    }
    if (!terbaik || terbaik.size >= berkas.size) return berkas;
    const ekstensi = terbaik.type === "image/webp" ? "webp" : terbaik.type === "image/jpeg" ? "jpg" : "png";
    return new File([terbaik], `${berkas.name.replace(/\.[^.]+$/, "")}.${ekstensi}`, { type: terbaik.type, lastModified: berkas.lastModified });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function siapkanUnggahan(berkas: File): Promise<{ nama: string; tipe: string; data: string }> {
  const hasil = await kompresGambar(berkas);
  const data = await new Promise<string>((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result).split(",")[1] ?? "");
    pembaca.onerror = () => gagal(new Error("Berkas tidak bisa dibaca."));
    pembaca.readAsDataURL(hasil);
  });
  if (!data) throw new Error("Berkas kosong atau tidak bisa dibaca.");
  return { nama: hasil.name, tipe: hasil.type, data };
}

/** Legacy guardian endpoints accept encoded files rather than File objects. */
export async function siapkanKiriman(kiriman: { nama: string; tipe: string; data: string }) {
  if (!kiriman.tipe.startsWith("image/")) return kiriman;
  const isi = atob(kiriman.data.replace(/^data:[^;]+;base64,/, ""));
  const bytes = Uint8Array.from(isi, (huruf) => huruf.charCodeAt(0));
  return siapkanUnggahan(new File([bytes], kiriman.nama, { type: kiriman.tipe }));
}