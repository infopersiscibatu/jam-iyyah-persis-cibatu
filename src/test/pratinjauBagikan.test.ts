import { describe, expect, it } from "vitest";
import { tujuanBagikan } from "@/app/lib/tautanBagikan";
import { dariBawaan, dariJawaban, gambarPratinjau } from "@/lib/pratinjauBagikan";

describe("Pratinjau tautan publik", () => {
  it("returns null for built-in content because sample data is emptied", () => {
    expect(dariBawaan("artikel/adab-menuntut-ilmu-sebelum-pelajaran")).toBeNull();
  });
  it("uses the published content's uploaded image", () => {
    expect(dariJawaban("berita/kegiatan", { berita: [{ slug: "kegiatan", judul: "Kegiatan", gambarUrl: "/berkas/kegiatan.jpg", terbit: true }] })?.gambar).toBe("/berkas/kegiatan.jpg");
    expect(gambarPratinjau("/berkas/kegiatan.jpg", "https://persis.example")).toBe("https://persis.example/berkas/kegiatan.jpg");
  });
  it("does not expose drafts", () => {
    expect(dariJawaban("artikel/draf", { artikel: [{ slug: "draf", judul: "Rahasia", terbit: false }] })).toBeNull();
  });
  it("does not expose inactive gallery images", () => {
    expect(dariJawaban("galeri/f-1", { foto: [{ id: "f-1", aktif: false }] })).toBeNull();
  });
  it("does not invent images for announcements without photos", () => {
    expect(dariBawaan("beranda/pengumuman/an-1")).toBeNull();
  });
  it("rejects invalid and private destinations", () => {
    expect(tujuanBagikan("admin/akun")).toBeNull();
    expect(tujuanBagikan("artikel/%2e%2e")).toBeNull();
    expect(tujuanBagikan("artikel/%ZZ")).toBeNull();
  });
  it("rejects executable image URLs", () => {
    expect(gambarPratinjau("javascript:alert(1)", "https://persis.example")).toBe("");
  });
});