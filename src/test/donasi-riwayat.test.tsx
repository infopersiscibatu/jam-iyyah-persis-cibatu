import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HalamanDonasiDetail } from "@/app/pages/DonasiDetail";

/**
 * Tab Riwayat halaman donasi harus membaca data dari database
 * (`GET /api/program-donasi` → `program[].riwayat`), bukan data contoh:
 * bila tabel donasi_riwayat kosong, halaman menyatakan belum ada catatan.
 */

const programDasar = {
  id: "p1",
  slug: "uji-riwayat",
  judul: "Program Uji",
  kategori: "Pendidikan",
  gambar: "/logo-persis.png",
  target: 10000000,
  terkumpul: 2500000,
  donatur: 3,
  batas: "2026-12-31",
  ringkasan: "Ringkasan program uji.",
  pengelola: "PC PERSIS Cibatu",
  body: ["Isi program."],
  rincian: [{ item: "Kebutuhan", jumlah: 10000000 }],
  donaturTampil: [],
  metode: [],
};

/** Jawaban server tiruan dengan isi tabel yang diinginkan. */
function jawabServer(program: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, program: [program], metode: [], rekening: [] }),
    })) as unknown as typeof fetch,
  );
}

function bukaTabRiwayat() {
  fireEvent.click(screen.getByRole("tab", { name: /riwayat/i }));
}

describe("Tab riwayat halaman donasi", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("menyatakan belum ada catatan bila database kosong, bukan riwayat contoh", async () => {
    jawabServer({ ...programDasar, riwayat: [] });
    render(<HalamanDonasiDetail slug="uji-riwayat" onBuka={() => {}} onKembali={() => {}} />);
    await waitFor(() => expect(screen.getByText("Program Uji")).toBeInTheDocument());

    bukaTabRiwayat();

    expect(screen.getByTestId("donasi-riwayat-kosong")).toBeInTheDocument();
    expect(screen.queryByText(/Program dibuka/i)).toBeNull();
    expect(screen.queryByText(/Pencairan dana tahap 1/i)).toBeNull();
  });

  it("menampilkan catatan dari database apa adanya, termasuk nominalnya", async () => {
    jawabServer({
      ...programDasar,
      riwayat: [
        {
          id: "rw-1",
          tanggal: "2026-10-01",
          judul: "Penyaluran tahap 1",
          keterangan: "Dana diserahkan kepada penanggung jawab program.",
          jenis: "Penyaluran",
          nominal: 750000,
        },
      ],
    });
    render(<HalamanDonasiDetail slug="uji-riwayat" onBuka={() => {}} onKembali={() => {}} />);
    await waitFor(() => expect(screen.getByText("Program Uji")).toBeInTheDocument());

    bukaTabRiwayat();

    await waitFor(() => expect(screen.getByText("Penyaluran tahap 1")).toBeInTheDocument());
    expect(screen.queryByTestId("donasi-riwayat-kosong")).toBeNull();
    expect(screen.getByTestId("riwayat-nominal").textContent).toContain("750.000");
  });
});
