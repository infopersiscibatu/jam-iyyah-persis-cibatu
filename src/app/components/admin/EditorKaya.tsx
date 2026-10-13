import { lazy, Suspense, useEffect, useState } from "react";

const Jodit = lazy(() => import("./JoditDalam"));

export type PropsEditor = {
  label: string;
  nilai: string;
  onUbah: (html: string) => void;
  unggah?: (berkas: File) => Promise<string>;
  petunjuk?: string;
  testid?: string;
};

/** Editor teks kaya; Jodit hanya dimuat di peramban saat panel admin dibuka. */
export function EditorKaya(props: PropsEditor) {
  const [siap, setSiap] = useState(false);
  useEffect(() => setSiap(true), []);
  return (
    <div className="block" data-testid={props.testid}>
      <span className="field-label">{props.label}</span>
      {siap ? (
        <Suspense fallback={<div className="h-[260px] animate-pulse rounded-xl bg-black/[0.04]" />}>
          <Jodit {...props} />
        </Suspense>
      ) : (
        <div className="h-[260px] rounded-xl bg-black/[0.04]" />
      )}
      {props.petunjuk ? (
        <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{props.petunjuk}</span>
      ) : null}
    </div>
  );
}
