import { useState } from "react";
import BarMerek from "../components/BarMerek";
import Sorotan from "../components/Sorotan";
import KartuAgenda from "../components/KartuAgenda";
import KartuStatistik from "../components/KartuStatistik";
import StatusLayanan from "../components/StatusLayanan";
import MomenKegiatan from "../components/MomenKegiatan";
import JudulSeksi from "../components/JudulSeksi";
import Popup from "../components/Popup";
import { Icon } from "../components/Icons";
import {
  berita,
  beritaTrending,
  notifikasi,
  pengumumanTerbaru,
  type Agenda,
  type Berita,
  type Pengumuman,
} from "../lib/content";
import { angkaRingkas, tanggalPanjang, tanggalRelatif } from "../lib/format";

export default function Beranda({
  onPilihHalaman,
  onInfo,
  dibaca,
  onTandai,
  onMunculkanLagi,
}: {
  onPilihHalaman: (halaman: string, label: string) => void;
  onInfo: (pesan: string) => void;
  dibaca: string[];
  onTandai: (ids: string[]) => void;
  onMunculkanLagi: () => void;
}) {
  const [pengumumanPilih, setPengumumanPilih] = useState<Pengumuman | null>(null);
  const [agendaPilih, setAgendaPilih] = useState<Agenda | null>(null);

  const belumDibaca = notifikasi.filter((n) => !dibaca.includes(n.id));

  const bukaBerita = (_b: Berita) => onPilihHalaman("berita", "Berita");
  const bukaMomen = () => onPilihHalaman("galeri", "Galeri");

  const daftarPengumuman = pengumumanTerbaru(4);

  return (
    <>
      <div className="mx-auto w-full max-w-[620px] px-5 pt-4">
        <BarMerek
          onBeranda={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onBukaPost={(n) =>
            onInfo(`Detail “${n.judul}” belum dijalankan pada pratinjau ini.`)
          }
          notifikasiBelumDibaca={belumDibaca}
          jumlahBelumDibaca={belumDibaca.length}
          onTandai={onTandai}
          onMunculkanLagi={onMunculkanLagi}
        />
      </div>

      <main className="mx-auto w-full max-w-[620px] px-5 pt-3">
        <div className="space-y-6 pb-1">
          <Sorotan onPilih={onPilihHalaman} />

          <KartuStatistik />

          <KartuAgenda onBuka={setAgendaPilih} />

          <StatusLayanan onPilih={onPilihHalaman} />

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

          <MomenKegiatan onBuka={bukaMomen} />

          <section aria-label="Berita Trending">
            <JudulSeksi
              title="Berita Trending"
              subtitle="Paling banyak dibaca"
              onAction={() => onPilihHalaman("berita", "Berita")}
            />

            <ol className="card-line divide-y divide-line overflow-hidden">
              {beritaTrending(4).map((n, i) => (
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
              4 teratas dari {berita.length} berita
            </p>
          </section>
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
    </>
  );
}
