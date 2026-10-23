import { useState } from "react";
import BarMerek from "../components/BarMerek";
import Sorotan from "../components/Sorotan";
import KartuAgenda from "../components/KartuAgenda";
import KartuStatistik from "../components/KartuStatistik";
import StatusLayanan from "../components/StatusLayanan";
import MomenKegiatan, { momenFoto } from "../components/MomenKegiatan";
import PenampilFoto from "../components/PenampilFoto";
import JudulSeksi from "../components/JudulSeksi";
import Popup from "../components/Popup";
import { Icon } from "../components/Icons";
import {
  aksesCepat,
  agendaTerdekat,
  berita,
  beritaTrending,
  carousel,
  notifikasi,
  pengumumanTerbaru,
  statistik,
  type Agenda,
  type Berita,
  type Pengumuman,
} from "../lib/content";
import { angkaRingkas, tanggalPanjang, tanggalRelatif } from "../lib/format";

/**
 * Beranda beranda desain baru.
 *
 * Seluruh isinya datang dari database (lihat src/app/situs/muatData.ts). Bagian
 * yang belum berisi di database tidak ditampilkan sama sekali — tidak pernah
 * diisi data contoh. Bila semuanya kosong, tampil satu kartu pemberitahuan.
 */
export default function Beranda({
  onPilihHalaman,
  onBukaBerita,
  onInfo,
  dibaca,
  onTandai,
  onMunculkanLagi,
}: {
  onPilihHalaman: (halaman: string, label: string) => void;
  /** Membuka satu berita tertentu di halaman berita. */
  onBukaBerita: (id: string) => void;
  onInfo: (pesan: string) => void;
  dibaca: string[];
  onTandai: (ids: string[]) => void;
  onMunculkanLagi: () => void;
}) {
  const [pengumumanPilih, setPengumumanPilih] = useState<Pengumuman | null>(null);
  const [agendaPilih, setAgendaPilih] = useState<Agenda | null>(null);
  const [fotoMomen, setFotoMomen] = useState<number | null>(null);

  const belumDibaca = notifikasi.filter((n) => !dibaca.includes(n.id));

  const bukaBerita = (b: Berita) => onBukaBerita(b.id);
  const daftarMomen = momenFoto();
  const geserMomen = (arah: number) =>
    setFotoMomen((i) =>
      i === null || daftarMomen.length === 0 ? i : (i + arah + daftarMomen.length) % daftarMomen.length,
    );

  const daftarPengumuman = pengumumanTerbaru(4);
  const daftarBerita = beritaTrending(4);
  const daftarAgenda = agendaTerdekat(4);

  /* Bagian mana yang ada isinya di database. */
  const adaSorotan = carousel.length > 0;
  const adaStatistik = statistik.length > 0;
  const adaAgenda = daftarAgenda.length > 0;
  const adaAkses = aksesCepat.length > 0;
  const adaPengumuman = daftarPengumuman.length > 0;
  const adaMomen = daftarMomen.length > 0;
  const adaBerita = daftarBerita.length > 0;
  const kosong =
    !adaSorotan && !adaStatistik && !adaAgenda && !adaAkses && !adaPengumuman && !adaMomen && !adaBerita;

  return (
    <>
      <div className="mx-auto w-full max-w-[620px] px-5 pt-4">
        <BarMerek
          onBeranda={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onBukaPost={(n) => onInfo(`Detail “${n.judul}” bisa dibuka dari halaman ${n.jenis.toLowerCase()}.`)}
          notifikasiBelumDibaca={belumDibaca}
          jumlahBelumDibaca={belumDibaca.length}
          onTandai={onTandai}
          onMunculkanLagi={onMunculkanLagi}
        />
      </div>

      <main className="mx-auto w-full max-w-[620px] px-5 pt-3">
        <div className="space-y-6 pb-1">
          {adaSorotan ? <Sorotan onPilih={onPilihHalaman} /> : null}

          {adaStatistik ? <KartuStatistik /> : null}

          {adaAgenda ? <KartuAgenda onBuka={setAgendaPilih} /> : null}

          {adaAkses ? <StatusLayanan onPilih={onPilihHalaman} /> : null}

          {adaPengumuman ? (
            <section aria-label="Pengumuman">
              <JudulSeksi
                title="Pengumuman"
                subtitle="Kabar terbaru dari cabang"
                onAction={() => onPilihHalaman("info", "Info")}
              />

              <ul className="card-line divide-y divide-line overflow-hidden">
                {daftarPengumuman.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setPengumumanPilih(p)}
                      aria-label={`Baca pengumuman: ${p.title}`}
                      data-testid={p.pinned ? "pengumuman-baca" : undefined}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition active:bg-mist/60"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink-700">
                        <Icon name="megaphone" className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-2 text-[11.5px] leading-snug font-semibold text-ink-900">
                          {p.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-ink-400">
                          <span className="font-semibold text-gold-700">{p.category}</span>
                          <span>·</span>
                          <span>{tanggalRelatif(p.date)}</span>
                        </span>
                      </span>
                      <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {adaMomen ? (
            <MomenKegiatan onBukaFoto={setFotoMomen} onSemua={() => onPilihHalaman("galeri", "Galeri")} />
          ) : null}

          {adaBerita ? (
            <section aria-label="Berita Trending">
              <JudulSeksi
                title="Berita Trending"
                subtitle="Paling banyak dibaca"
                onAction={() => onPilihHalaman("berita", "Berita")}
              />

              <ol className="card-line divide-y divide-line overflow-hidden">
                {daftarBerita.map((n, i) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => bukaBerita(n)}
                      aria-label={`Baca berita: ${n.title}`}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition active:bg-mist/60"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-pastel-green text-[10px] font-extrabold text-persis-800 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-2 text-[11.5px] leading-snug font-semibold text-ink-900">
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-[9.5px] text-ink-400">
                          {n.category} · {tanggalRelatif(n.date)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[9.5px] font-bold text-persis-800">
                        <Icon name="eye" className="h-3 w-3" />
                        {angkaRingkas(n.views)}
                      </span>
                      <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    </button>
                  </li>
                ))}
              </ol>

              <p className="mt-2 text-center text-[9.5px] text-ink-400">
                {daftarBerita.length} teratas dari {berita.length} berita
              </p>
            </section>
          ) : null}

          {kosong ? (
            <section aria-label="Beranda belum berisi" data-testid="beranda-kosong">
              <div className="card-line px-4 py-6 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-mist text-ink-700">
                  <Icon name="info" className="h-5 w-5" />
                </span>
                <p className="mt-2.5 font-header text-[12.5px] font-extrabold text-ink-900">
                  Beranda belum berisi
                </p>
                <p className="mx-auto mt-1 max-w-[320px] text-[10.5px] leading-relaxed text-ink-600">
                  Sorotan, pengumuman, agenda, berita, dan angka statistik yang tampil di sini diambil dari database.
                  Isi dulu lewat panel admin, lalu halaman ini akan memperbarui dirinya sendiri.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Popup
        open={pengumumanPilih !== null}
        onClose={() => setPengumumanPilih(null)}
        testId="popup-pengumuman"
        title={pengumumanPilih?.title ?? ""}
        keterangan={
          pengumumanPilih
            ? `${pengumumanPilih.category} · ${tanggalPanjang(pengumumanPilih.date)} · ${angkaRingkas(pengumumanPilih.views)} dibaca`
            : ""
        }
        detail={pengumumanPilih?.detail ?? []}
      />

      <Popup
        open={agendaPilih !== null}
        onClose={() => setAgendaPilih(null)}
        testId="popup-agenda"
        title={agendaPilih?.title ?? ""}
        keterangan={
          agendaPilih
            ? `${agendaPilih.tag} · ${tanggalPanjang(agendaPilih.date)} · ${agendaPilih.time} · ${agendaPilih.place}`
            : ""
        }
        detail={agendaPilih?.detail ?? []}
      />

      <PenampilFoto
        daftar={daftarMomen}
        indeks={fotoMomen}
        onTutup={() => setFotoMomen(null)}
        onGeser={geserMomen}
      />
    </>
  );
}
