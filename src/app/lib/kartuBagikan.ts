// Membuat gambar kartu berbagi (foto + ringkasan + judul + alamat situs) di peramban.
function bungkus(ctx: CanvasRenderingContext2D, teks: string, lebar: number, maks: number): string[] {
  const kata = teks.split(/\s+/).filter(Boolean);
  const baris: string[] = [];
  let kini = "";
  for (const k of kata) {
    const coba = kini ? `${kini} ${k}` : k;
    if (ctx.measureText(coba).width > lebar && kini) {
      baris.push(kini);
      kini = k;
      if (baris.length === maks) break;
    } else kini = coba;
  }
  if (baris.length < maks && kini) baris.push(kini);
  if (baris.length === maks && kata.join(" ").length > baris.join(" ").length) {
    let akhir = baris[maks - 1];
    while (ctx.measureText(`${akhir}…`).width > lebar && akhir.length) akhir = akhir.slice(0, -1);
    baris[maks - 1] = `${akhir.trimEnd()}…`;
  }
  return baris;
}

export async function buatKartuBagikan(opsi: { foto?: Blob | null; judul: string; ringkasan: string; situs: string }): Promise<File | null> {
  try {
    const L = 1080, T = 1350;
    const kanvas = document.createElement("canvas");
    kanvas.width = L; kanvas.height = T;
    const ctx = kanvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#0e4b2b";
    ctx.fillRect(0, 0, L, T);
    if (opsi.foto) {
      const bmp = await createImageBitmap(opsi.foto);
      const s = Math.max(L / bmp.width, T / bmp.height);
      const w = bmp.width * s, h = bmp.height * s;
      ctx.drawImage(bmp, (L - w) / 2, (T - h) / 2, w, h);
      bmp.close?.();
    }
    const g = ctx.createLinearGradient(0, T * 0.3, 0, T);
    g.addColorStop(0, "rgba(6,40,22,0.05)");
    g.addColorStop(0.45, "rgba(6,40,22,0.75)");
    g.addColorStop(1, "rgba(6,40,22,0.96)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, T);

    const pad = 72, lebar = L - pad * 2;
    let y = T - 90;
    // Alamat situs
    ctx.font = "600 32px system-ui, sans-serif";
    ctx.fillStyle = "#e8c46a";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(opsi.situs, pad, y);
    y -= 60;
    // Ringkasan
    ctx.font = "400 38px system-ui, sans-serif";
    const rBaris = opsi.ringkasan ? bungkus(ctx, opsi.ringkasan, lebar, 4) : [];
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = rBaris.length - 1; i >= 0; i--) { ctx.fillText(rBaris[i], pad, y); y -= 52; }
    y -= 24;
    // Judul
    ctx.font = "800 60px system-ui, sans-serif";
    const jBaris = bungkus(ctx, opsi.judul, lebar, 3);
    ctx.fillStyle = "#ffffff";
    for (let i = jBaris.length - 1; i >= 0; i--) { ctx.fillText(jBaris[i], pad, y); y -= 74; }
    // Garis aksen
    ctx.fillStyle = "#e8c46a";
    ctx.fillRect(pad, y - 10, 120, 8);

    const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "persis-cibatu.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}
