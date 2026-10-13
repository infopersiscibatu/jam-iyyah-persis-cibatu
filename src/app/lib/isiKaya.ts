/**
 * Isi tulisan disimpan sebagai daftar blok. Tulisan lama berupa teks polos per
 * paragraf; tulisan dari editor berupa satu blok HTML per elemen teratas, jadi
 * posisi "baca juga" dan iklan tetap bisa dihitung per paragraf.
 */
export const adalahHtml = (s: string) => /<\/?[a-z][\s\S]*?>/i.test(s);

const lolos = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function keHtml(daftar: string[]): string {
  return daftar.map((p) => (adalahHtml(p) ? p : `<p>${lolos(p)}</p>`)).join("");
}

export function pecahHtml(html: string): string[] {
  if (!adalahHtml(html)) {
    return html.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }
  const dok = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const hasil: string[] = [];
  dok.body.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = (n.textContent ?? "").trim();
      if (t) hasil.push(`<p>${lolos(t)}</p>`);
    } else if (n.nodeType === 1) {
      const el = n as HTMLElement;
      const berisi = (el.textContent ?? "").replace(/\u00a0/g, " ").trim() || el.querySelector("img,iframe,table,hr");
      if (berisi || el.tagName === "HR") hasil.push(el.outerHTML);
    }
  });
  return hasil;
}

/** Teks polos untuk ringkasan berbagi dan pratinjau. */
export const teksPolos = (s: string) =>
  s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
