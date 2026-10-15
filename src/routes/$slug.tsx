import { createFileRoute } from "@tanstack/react-router";
import { alihKeBeranda, cariPratinjau, htmlBagikan } from "@/lib/bagikanServer";

/** Short public share URLs: namadomain/judul-artikel. Urutan pencarian menentukan prioritas bila slug sama. */
const JENIS = ["berita", "artikel", "info", "beranda/pengumuman", "beranda/agenda", "galeri"];

export const Route = createFileRoute("/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let slug = params.slug ?? "";
        try { slug = decodeURIComponent(slug); } catch { return alihKeBeranda(request); }
        if (!/^[\p{L}\p{N}_-]{1,200}$/u.test(slug)) return alihKeBeranda(request);
        for (const jenis of JENIS) {
          const data = await cariPratinjau(`${jenis}/${encodeURIComponent(slug)}`, request);
          if (data) return htmlBagikan(data, request);
        }
        return alihKeBeranda(request);
      },
    },
  },
  component: function HalamanSlug() {
    return null;
  },
});
