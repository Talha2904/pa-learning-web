/** Branded full-screen preloader: glass card, pulsing logo, shimmer bar. */
export function Preloader({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-panel p-6"
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      <div className="pa-glass flex flex-col items-center rounded-[24px] px-12 py-10 shadow-card">
        <img
          src="/brand/lumen-mark-colour.svg"
          alt=""
          className="w-14 animate-[pulse_1.6s_ease-in-out_infinite]"
        />
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[2px] text-faint">
          Lumen
        </div>
        <div className="mt-4 h-[5px] w-44 overflow-hidden rounded-full bg-[#e7edf3]">
          <div className="h-full w-1/2 animate-[loadslide_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#73ceea] via-[#6d9fd5] to-[#a9cf37]" />
        </div>
        <div className="mt-3 text-[12px] text-muted">{label}…</div>
      </div>
    </div>
  );
}
