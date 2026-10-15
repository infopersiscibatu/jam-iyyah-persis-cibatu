import { tujuanBagikan } from "@/app/lib/tautanBagikan";
import { dariBawaan, dariJawaban, endpointBagikan, halamanPratinjau, type Pratinjau } from "./pratinjauBagikan";

/** Cari data pratinjau untuk satu jalur konten; null bila tidak ditemukan. */
export async function cariPratinjau(jalur: string, request: Request): Promise<Pratinjau | null> {
  const endpoint = endpointBagikan(jalur);
  if (!endpoint || !tujuanBagikan(jalur)) return null;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      // Reuse existing public read handlers; never query private records here.
      const { tangani } = await import("@/legacy-api/index.js");
      const response = await tangani(new Request(new URL(endpoint, request.url)));
      if (!response.ok) throw new Error(`Layanan konten menjawab ${response.status}`);
      return dariJawaban(jalur, await response.json());
    } catch (error) {
      console.error("Pratinjau bagikan gagal:", error);
      return null;
    }
  }
  return dariBawaan(jalur);
}

/** URL publik yang disanitasi (proxy sandbox menyediakan host lewat header). */
export function urlPublikRequest(request: Request): string {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  const host = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) { url.host = host; url.protocol = "https:"; }
  return url.href;
}

export function htmlBagikan(data: Pratinjau, request: Request): Response {
  return new Response(halamanPratinjau(data, urlPublikRequest(request)), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60", "x-content-type-options": "nosniff" },
  });
}

/** Pembaca selalu sampai ke konten, walau pratinjau gagal dimuat. */
export function lanjutKeKonten(hash: string, request: Request): Response {
  return new Response(null, { status: 302, headers: { location: new URL(hash, request.url).href, "cache-control": "no-store" } });
}

export function alihKeBeranda(request: Request): Response {
  return Response.redirect(new URL("/", request.url).href, 302);
}
