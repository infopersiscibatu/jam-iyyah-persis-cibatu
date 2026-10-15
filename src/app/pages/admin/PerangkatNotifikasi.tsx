import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { Pesan, TombolIkon } from "../../components/admin/Form";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { ambilToken } from "../../lib/sesi";
import { tanggalJam, tanggalRelatif } from "../../lib/format";

/**
 * Pengelola perangkat notifikasi.
 *
 * Menampilkan setiap HP yang pernah mengaktifkan notifikasi situs, lengkap dengan
 * tombol kirim uji dan tombol hapus. Menghapus sebuah perangkat berguna ketika HP
 * itu tidak lagi menerima notifikasi: setelah barisnya dihapus, HP tersebut akan
 * membuat langganan yang baru saat notifikasinya diaktifkan kembali.
 *
 * Alamat perangkat yang sebenarnya tidak pernah dikirim ke peramban — server hanya
 * mengirim sidik jarinya — sehingga daftar ini tidak bisa dipakai untuk mengirim
 * notifikasi langsung ke HP jamaah.
 */

export type PerangkatNotif = {
  id: string;
  perangkat: string | null;
  dibuat: string | null;
  diubah: string | null;
  santri: string | null;
};

type JawabanPerangkat = {
  ok?: boolean;
  total?: number;
  terikat?: number;
  terkirim?: number;
  gagal?: number;
  perangkat?: PerangkatNotif[];
  pesan?: string;
};

/** Pemanggil layanan panel admin untuk halaman ini. */
async function minta<T>(jalur: string, opsi: RequestInit = {}): Promise<T> {
  const token = ambilToken();
  const jawab = await fetch(jalur, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { "x-sesi-admin": token } : {}),
    },
    ...opsi,
  });
  const isi = (await jawab.json().catch(() => ({}))) as Record<string, unknown>;
  if (!jawab.ok) throw new Error((isi.pesan as string) || `Layanan menjawab ${jawab.status}`);
  return isi as T;
}

/** Peramban dan sistem dari teks perangkat, supaya mudah dikenali pengurus. */
function namaPerangkat(ua: string | null): string {
  const t = String(ua || "").toLowerCase();
  if (!t) return "Perangkat tak dikenal";
  const versiAndroid = /android\s+([\d.]+)/.exec(t);
  const sistem = t.includes("android")
    ? `Android${versiAndroid ? ` ${versiAndroid[1].split(".")[0]}` : ""}`
    : /iphone|ipad|ipod/.test(t)
      ? "iPhone/iPad"
      : t.includes("windows")
        ? "Windows"
        : t.includes("mac os")
          ? "Mac"
          : t.includes("linux")
            ? "Linux"
            : "perangkat lain";
  const peramban = /; wv\)|; wv;/.test(t)
    ? "Aplikasi PERSIS"
    : t.includes("edg/")
      ? "Edge"
      : t.includes("opr/")
        ? "Opera"
        : t.includes("samsungbrowser")
          ? "Samsung Internet"
          : t.includes("firefox/")
            ? "Firefox"
            : t.includes("chrome/") || t.includes("crios")
              ? "Chrome"
              : t.includes("safari")
                ? "Safari"
                : "peramban lain";
  return `${peramban} · ${sistem}`;
}

/** "didaftarkan 2 pekan lalu" — dikosongkan bila tanggalnya tidak tercatat. */
function kapanDidaftar(p: PerangkatNotif): string {
  const iso = p.dibuat || p.diubah;
  if (!iso) return "waktu pendaftaran tidak tercatat";
  return `didaftarkan ${tanggalRelatif(iso)}`;
}

export function PerangkatNotifikasi() {
  const [daftar, setDaftar] = useState<PerangkatNotif[]>([]);
  const [total, setTotal] = useState(0);
  const [terikat, setTerikat] = useState(0);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [menguji, setMenguji] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await minta<JawabanPerangkat>("/api/admin/perangkat-notifikasi");
      setDaftar(jawab.perangkat ?? []);
      setTotal(Number(jawab.total ?? 0));
      setTerikat(Number(jawab.terikat ?? 0));
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar perangkat belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const ujiSatu = async (p: PerangkatNotif) => {
    setSibuk(p.id);
    setPesan(null);
    try {
      const jawab = await minta<JawabanPerangkat>("/api/admin/perangkat-notifikasi/uji", {
        method: "POST",
        body: JSON.stringify({ id: p.id }),
      });
      const sampai = Number(jawab.terkirim ?? 0) > 0;
      setPesan({
        tipe: sampai ? "sukses" : "galat",
        teks: jawab.pesan ?? (sampai ? "Notifikasi uji sudah dikirim." : "Notifikasi uji gagal dikirim."),
      });
      await muat();
    } catch (e) {
      setPesan({
        tipe: "galat",
        teks: e instanceof Error ? e.message : "Notifikasi uji gagal dikirim.",
      });
    } finally {
      setSibuk(null);
    }
  };

  const ujiSemua = async () => {
    setMenguji(true);
    setPesan(null);
    try {
      const jawab = await minta<JawabanPerangkat>("/api/admin/perangkat-notifikasi/uji", {
        method: "POST",
        body: JSON.stringify({ semua: true }),
      });
      setPesan({
        tipe: Number(jawab.gagal ?? 0) > 0 ? "galat" : "sukses",
        teks: jawab.pesan ?? "Notifikasi uji sudah dikirim ke semua perangkat.",
      });
      await muat();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Notifikasi uji gagal dikirim." });
    } finally {
      setMenguji(false);
    }
  };

  const hapus = async (p: PerangkatNotif) => {
    const ya = await mintaKonfirmasi(
      `Hapus ${namaPerangkat(p.perangkat)} dari daftar perangkat notifikasi? HP itu akan terdaftar lagi sebagai perangkat baru setelah notifikasinya diaktifkan kembali.`,
      { judul: "Hapus perangkat", nada: "bahaya", labelYa: "Ya, hapus" },
    );
    if (!ya) return;
    setSibuk(p.id);
    setPesan(null);
    try {
      const jawab = await minta<JawabanPerangkat>("/api/admin/perangkat-notifikasi/hapus", {
        method: "POST",
        body: JSON.stringify({ id: p.id }),
      });
      setPesan({ tipe: "sukses", teks: jawab.pesan ?? "Perangkat sudah dihapus." });
      beritahu("sukses", "Perangkat notifikasi dihapus.");
      await muat();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Perangkat belum bisa dihapus." });
    } finally {
      setSibuk(null);
    }
  };

  const urut = [...daftar].sort((a, b) => String(b.diubah ?? b.dibuat ?? "").localeCompare(String(a.diubah ?? a.dibuat ?? "")));

  return (
    <div data-testid="admin-perangkat-notifikasi">
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
          <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">
            <Icon name="bell" className="h-[14px] w-[14px] shrink-0" />
            Perangkat terdaftar
          </span>
          <span className="font-header mt-1.5 block text-[17px] leading-tight font-extrabold text-persis-900">
            {total}
          </span>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
          <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">
            <Icon name="user" className="h-[14px] w-[14px] shrink-0" />
            Terikat akun wali
          </span>
          <span className="font-header mt-1.5 block text-[17px] leading-tight font-extrabold text-persis-900">
            {terikat}
          </span>
        </div>
      </div>

      <section
        data-testid="tabel-perangkat-notifikasi"
        className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-3"
      >
        <h2 className="font-header text-[12.5px] font-bold text-ink-900">HP penerima notifikasi</h2>
        <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Setiap HP yang pernah menekan Aktifkan notifikasi tercatat di sini. Bila sebuah HP tidak lagi
          menerima notifikasi, kirim uji kirim lebih dulu untuk memastikan, lalu hapus perangkatnya —
          HP itu akan mendaftar ulang sebagai perangkat baru saat notifikasinya dinyalakan lagi.
        </p>

        <button
          type="button"
          data-testid="uji-semua-perangkat"
          onClick={() => void ujiSemua()}
          disabled={menguji || memuat || total === 0}
          className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-persis-800 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          <Icon name="megaphone" className="h-[15px] w-[15px]" />
          {menguji ? "Mengirim uji…" : "Kirim uji ke semua perangkat"}
        </button>

        {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
        {galat ? <Pesan tipe="galat" teks={galat} /> : null}

        {memuat ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat daftar perangkat…</p>
        ) : urut.length === 0 ? (
          <p className="mt-3 rounded-xl bg-cream-50 px-3.5 py-3 text-justify text-[11px] leading-relaxed text-ink-400">
            Belum ada HP yang mendaftar. Ajak jamaah menekan tombol Aktifkan notifikasi di situs, atau
            nyalakan dari HP Anda sendiri lewat notifikasi berita terbaru.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/[0.06]" data-testid="daftar-perangkat">
            {urut.map((p) => (
              <li key={p.id} data-testid={`perangkat-${p.id}`} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-100 text-persis-800">
                  <Icon name={p.santri ? "user" : "bell"} className="h-[15px] w-[15px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-ink-900">
                    {namaPerangkat(p.perangkat)}
                  </p>
                  <p className="text-[9.5px] text-ink-400">
                    {p.santri ? `Terikat wali ${p.santri}` : "Penerima siaran umum"} · {kapanDidaftar(p)}
                  </p>
                  {p.diubah ? (
                    <p className="text-[9px] text-ink-400/80">Diperbarui {tanggalJam(p.diubah)}</p>
                  ) : null}
                  <p className="mt-0.5 truncate text-[9px] text-ink-400/70" title={p.perangkat ?? ""}>
                    {p.perangkat ?? "perangkat tidak menyebutkan namanya"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <TombolIkon
                    nama="bell"
                    label={`Kirim notifikasi uji ke ${namaPerangkat(p.perangkat)}`}
                    testid={`uji-perangkat-${p.id}`}
                    nonaktif={sibuk === p.id || menguji}
                    onClick={() => void ujiSatu(p)}
                  />
                  <TombolIkon
                    nama="trash"
                    label={`Hapus ${namaPerangkat(p.perangkat)} dari daftar`}
                    testid={`hapus-perangkat-${p.id}`}
                    bahaya
                    nonaktif={sibuk === p.id || menguji}
                    onClick={() => void hapus(p)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-3 text-justify text-[10px] leading-relaxed text-ink-400">
        Menghapus perangkat tidak menghapus izin notifikasi di HP itu, hanya barisnya di layanan. HP
        tersebut tetap bisa mendaftar lagi kapan saja — bahkan sebaiknya begitu, karena pendaftaran baru
        membuat alamat pengirimannya baru sehingga notifikasi kembali lancar.
      </p>
    </div>
  );
}

export default PerangkatNotifikasi;
