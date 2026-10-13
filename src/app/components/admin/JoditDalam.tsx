import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { useMemo, useRef } from "react";
import type { PropsEditor } from "./EditorKaya";

const TOMBOL = [
  "bold", "italic", "underline", "|",
  "paragraph", "ul", "ol", "|",
  "link", "gambarUnggah", "table", "hr", "|",
  "align", "undo", "redo",
];

export default function JoditDalam({ nilai, onUbah, unggah }: PropsEditor) {
  // Nilai awal hanya dipakai sekali agar kursor tidak melompat saat mengetik.
  const awal = useRef(nilai);
  const ubah = useRef(onUbah);
  ubah.current = onUbah;
  const unggahRef = useRef(unggah);
  unggahRef.current = unggah;

  const konfigurasi = useMemo(
    () => ({
      readonly: false,
      language: "id",
      height: 360,
      minHeight: 240,
      toolbarAdaptive: false,
      toolbarSticky: false,
      showCharsCounter: false,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html",
      placeholder: "Tulis isi di sini…",
      buttons: TOMBOL,
      buttonsMD: TOMBOL,
      buttonsSM: TOMBOL,
      buttonsXS: TOMBOL,
      uploader: { insertImageAsBase64URI: false },
      controls: {
        gambarUnggah: {
          icon: "image",
          tooltip: "Sisipkan gambar",
          exec: (editor: { s: { insertImage: (url: string) => void } }) => {
            const fn = unggahRef.current;
            if (!fn) return;
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
              const berkas = input.files?.[0];
              if (!berkas) return;
              try {
                editor.s.insertImage(await fn(berkas));
              } catch (e) {
                alert(e instanceof Error ? e.message : "Gambar gagal diunggah.");
              }
            };
            input.click();
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl text-[13px]">
      <JoditEditor
        value={awal.current}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config={konfigurasi as any}
        onChange={(v) => ubah.current(v)}
      />
    </div>
  );
}
