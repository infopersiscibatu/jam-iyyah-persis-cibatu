import { Button } from "@/components/ui/button";
import MomenKegiatan from "../components/MomenKegiatan";
import { teksPolos } from "../lib/isiKaya";
import { useEffect, useState } from "react";
import GridMenu from "../components/GridMenu";
import { BagianTrending } from "../components/KartuBerita";
import Hero from "../components/Hero";
import KartuStatistik from "../components/KartuStatistik";
import JudulSeksi from "../components/JudulSeksi";
import Popup from "../components/Popup";
import { Icon } from "../components/Icons";
import type { Berita, Pengumuman } from "../data/content";
import {
  angkaRingkas,
  tanggalPanjang,
  tanggalRelatif,
} from "../lib/format";
import { beritaTrending, terbitSaja, useBerita } from "../lib/berita";
import { cariPengumuman, hitungDibaca as hitungDibacaPengumuman, pengumumanTerbaru, usePengumuman } from "../lib/pengumuman";
import {
  agendaTerdekat,
  cariAgenda,
  hitungDibaca as hitungDibacaAgenda,
  useAgenda,
  type AgendaTampil,
} from "../lib/agenda";

const ikon = "h-[18px] w-[18px]";

/* -------------------------------- Pengumuman Terbaru -------------------------------- */

function BagianPengumumanTerbaru({ sasaran }: { sasaran?: string | null }) {
  const data = usePengumuman();
  const [pilih, setPilih] = useState<Pengumuman | null>(null);
  const terbaru = pengumumanTerbaru(data, 4);
  /* Notifikasi pengumuman membuka detailnya langsung. */
  useEffect(() => {
    if (!sasaran) return;
    const cocok = cariPengumuman(data, sasaran);
    if (!cocok) return;
    setPilih(cocok);
    document.querySelector('section[aria-label="Pengumuman terbaru"]')?.scrollIntoView({ block: "start" });
  }, [sasaran, data]);

  return (
    <section aria-label="Pengumuman terbaru">
      <JudulSeksi
        icon={<Icon name="megaphone" className={ikon} />}
        title="Pengumuman"
        subtitle="Kabar terbaru dari cabang"
        tone="gold"
      />

      <ul className="card-line divide-y divide-line overflow-hidden">
        {terbaru.map((p) => <li key={p.id}>
          <Button variant="ghost" onClick={() => {
            setPilih(p);
            void hitungDibacaPengumuman(p.id).then((n) => {
              if (n !== null) setPilih((k) => k?.id === p.id ? { ...k, views: n } : k);
            });
          }} aria-label={`Baca pengumuman: ${p.title}`} data-testid={p.pinned ? "pengumuman-baca" : undefined} className="flex h-auto w-full items-center gap-3 rounded-none px-3.5 py-3 text-left whitespace-normal hover:bg-mist">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink-700"><Icon name="megaphone" className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1"><span className="block line-clamp-2 text-[11.5px] leading-snug font-semibold text-ink-900">{p.title}</span><span className="mt-0.5 block text-[9.5px] text-ink-400"><span className="font-semibold text-gold-700">{p.category}</span> · {tanggalRelatif(p.date)}</span></span>
            <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          </Button>
        </li>)}
      </ul>

      <Popup
        open={pilih !== null}
        onClose={() => setPilih(null)}
        testId="popup-pengumuman"
        bagikan={pilih ? { judul: pilih.title, ringkasan: pilih.summary, jalur: `/#/beranda/pengumuman/${pilih.id}` } : undefined}
        title={pilih?.title ?? ""}
        icon={<Icon name="megaphone" className={ikon} />}
        keterangan={
          pilih ? `${pilih.category} · ${tanggalPanjang(pilih.date)} · ${angkaRingkas(pilih.views)} dibaca` : ""
        }
        detail={pilih?.detail ?? []}
      />
    </section>
  );
}

/* -------------------------------------- Agenda -------------------------------------- */

function BagianAgenda({ sasaran }: { sasaran?: string | null }) {
  const data = useAgenda();
  const [pilih, setPilih] = useState<AgendaTampil | null>(null);
  const items = agendaTerdekat(data, 1);
  const terdekat = items[0];
  const sisa = terdekat ? Math.max(0, Math.ceil((new Date(`${terdekat.date}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)) : 0;

  /* Jumlah dibaca bertambah setiap detail agenda dibuka, lalu angkanya diperbarui. */
  const buka = (a: AgendaTampil) => {
    setPilih(a);
    void hitungDibacaAgenda(a.id).then((n) => {
      if (n === null) return;
      setPilih((kini) => (kini && kini.id === a.id ? { ...kini, views: n } : kini));
    });
  };

  /* Notifikasi agenda membuka detailnya langsung. */
  useEffect(() => {
    if (!sasaran) return;
    const cocok = cariAgenda(data, sasaran);
    if (!cocok) return;
    buka(cocok);
    document.querySelector('section[aria-label="Agenda kegiatan"]')?.scrollIntoView({ block: "start" });
  }, [sasaran, data]);

  return (
    <section aria-label="Agenda kegiatan">
      {terdekat ? <Button variant="ghost" onClick={() => buka(terdekat)} aria-label={`Agenda terdekat: ${terdekat.title}`} data-testid="kartu-agenda" className="card-line flex h-auto w-full items-center gap-3 p-3.5 text-left whitespace-normal">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-100 text-persis-800"><Icon name="calendar" className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[8px] font-extrabold text-ink-400 uppercase">Agenda terdekat</span><span className="mt-1 block line-clamp-2 text-[12.5px] leading-snug font-extrabold text-ink-900">{terdekat.title}</span><span className="mt-1 block truncate text-[9.5px] text-ink-400">{tanggalPanjang(terdekat.date)} · {terdekat.time}</span></span>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[5px] border-leaf-600 bg-surface text-center"><span><span className="block text-[15px] leading-none font-extrabold text-ink-900">{sisa === 0 ? "Hari" : sisa}</span><span className="block text-[7px] font-bold text-ink-400 uppercase">{sisa === 0 ? "ini" : "hari"}</span></span></span>
      </Button> : null}

      <Popup
        open={pilih !== null}
        onClose={() => setPilih(null)}
        testId="popup-agenda"
        bagikan={pilih ? { judul: pilih.title, ringkasan: [pilih.date, pilih.time, pilih.place, pilih.detail[0] ? teksPolos(pilih.detail[0]) : ""].filter(Boolean).join(" · "), jalur: `/#/beranda/agenda/${pilih.id}` } : undefined}
        title={pilih?.title ?? ""}
        icon={<Icon name="calendar" className={ikon} />}
        keterangan={
          pilih
            ? `${pilih.tag} · ${tanggalPanjang(pilih.date)} · ${pilih.time} · ${pilih.place} · ${angkaRingkas(pilih.views)} dibaca`
            : ""
        }
        detail={pilih?.detail ?? []}
      />
    </section>
  );
}

/* -------------------------------------- Beranda ------------------------------------- */

export default function Beranda({
  onPilihMenu,
  onBukaBerita,
  pengumumanBuka,
  agendaBuka,
}: {
  onPilihMenu: (halaman: string) => void;
  onBukaBerita: (b: Berita) => void;
  /** Pengumuman/agenda yang dibuka dari notifikasi. */
  pengumumanBuka?: string | null;
  agendaBuka?: string | null;
}) {
  /* Sorotan berita di beranda memakai data dari database. */
  const dataBerita = useBerita();

  return (
    <main className="mx-auto w-full max-w-[620px] px-5 pt-0">
      <div className="space-y-6 pb-1">
        <Hero onPilih={onPilihMenu} />
        <KartuStatistik />
        <BagianAgenda sasaran={agendaBuka} />
        <GridMenu onSelect={onPilihMenu} />
        <BagianPengumumanTerbaru sasaran={pengumumanBuka} />
        <MomenKegiatan onBuka={() => onPilihMenu("galeri")} />
        <BagianTrending items={beritaTrending(dataBerita, 4)} total={terbitSaja(dataBerita).length} onOpen={onBukaBerita} />
      </div>
    </main>
  );
}
