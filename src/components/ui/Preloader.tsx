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
          src="/brand-mark.png"
          alt=""
          className="w-14 animate-[pulse_1.6s_ease-in-out_infinite]"
        />
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[2px] text-faint">
          Project Accountants
        </div>
        <div className="mt-4 h-[5px] w-44 overflow-hidden rounded-full bg-[rgba(45,141,254,.12)]">
          <div className="h-full w-1/2 animate-[loadslide_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#7db9ff] via-[#2d8dfe] to-[#1a5fc1]" />
        </div>
        <div className="mt-3 text-[12px] text-muted">{label}…</div>
      </div>
    </div>
  );
}
