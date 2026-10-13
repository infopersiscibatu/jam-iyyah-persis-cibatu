import DOMPurify from "dompurify";
import { adalahHtml } from "../lib/isiKaya";

/** Satu blok isi: teks polos lama tampil sebagai paragraf, HTML editor disaring dulu. */
export function BlokIsi({ teks, className }: { teks: string; className?: string }) {
  if (!adalahHtml(teks)) return <p className={className}>{teks}</p>;
  const bersih = DOMPurify.sanitize(teks, { ADD_ATTR: ["target"], FORBID_TAGS: ["style", "script", "form", "input"] });
  return <div className={`isi-kaya ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: bersih }} />;
}
