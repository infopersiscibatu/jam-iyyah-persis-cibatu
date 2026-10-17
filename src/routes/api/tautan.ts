import { createFileRoute } from "@tanstack/react-router";
import { tujuanBagikan } from "@/app/lib/tautanBagikan";
import { cariPratinjau } from "@/lib/bagikanServer";

/**
 * Pencari tujuan tautan bagikan.
 *
 * Tautan yang dibagikan berbentuk namadomain/judul-konten, sedangkan halaman situs
 * memakai alamat #/…. Alamat pendek itu dilayani halaman pratinjau (untuk perayap
 * WhatsApp/Google), tetapi bila yang membuka kerangka aplikasi — misalnya karena
 * kerangka tersimpan di HP — isinya tidak tampil. Skrip di kerangka halaman bertanya
 * ke sini: "slug ini isinya jenis apa?" lalu memindahkan pembaca ke alamat #/ yang benar.
 *
 * Jawaban: { tujuan: "/#/berita/judul-konten" } atau { tujuan: "/" } bila tak ditemukan.
 */
const JENIS = ["berita", "artikel", "info", "beranda/pengumuman", "beranda/agenda", "galeri"];

export const Route = createFileRoute("/api/tautan")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = (url.searchParams.get("slug") ?? "").trim();

        const jawab = (tujuan: string) =>
          new Response(JSON.stringify({ tujuan }), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
          });

        if (!slug || slug.length > 200 || !/^[\p{L}\p{N}_-]{1,200}$/u.test(slug)) return jawab("/");

        for (const jenis of JENIS) {
          const jalur = `${jenis}/${encodeURIComponent(slug)}`;
          const tujuan = tujuanBagikan(jalur);
          if (!tujuan) continue;
          const data = await cariPratinjau(jalur, request);
          if (data) return jawab(tujuan.hash);
        }

        /* Tidak ada konten dengan slug itu: pembaca diantar ke beranda. */
        return jawab("/");
      },
    },
  },
});
