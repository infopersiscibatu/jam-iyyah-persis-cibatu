import { createFileRoute } from "@tanstack/react-router";
import { tujuanBagikan } from "@/app/lib/tautanBagikan";
import { alihKeBeranda, cariPratinjau, htmlBagikan, lanjutKeKonten } from "@/lib/bagikanServer";

/** HTML is readable without JavaScript; readers continue to the original hash page. */
export const Route = createFileRoute("/api/public/bagikan/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const jalur = params._splat ?? "";
        const tujuan = tujuanBagikan(jalur);
        if (!tujuan) return alihKeBeranda(request);
        const data = await cariPratinjau(jalur, request);
        if (!data) return lanjutKeKonten(tujuan.hash, request);
        return htmlBagikan(data, request);
      },
    },
  },
});
