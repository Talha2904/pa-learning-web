import { useEffect, type ReactNode } from 'react';
import { Chip } from '@/components/ui/bits';
import { useMe } from '@/features/auth/AuthProvider';
import { useCycle } from '@/features/cycles/CycleProvider';
import { ROLE_COLOR, ROLE_LABEL } from '@/lib/palette';

interface PageProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Year switcher styled as the prototype's "YEAR 2026" chip. */
function CycleSwitcher() {
  const { cycles, cycle, setCycleId } = useCycle();
  if (cycles.length <= 1)
    return cycle ? (
      <Chip background="#f4f7fb" color="rgba(38,39,25,.5)">
        Year {cycle.year}
      </Chip>
    ) : null;
  return (
    <label className="relative">
      <span className="sr-only">Learning year</span>
      <select
        value={cycle?.id ?? ''}
        onChange={(e) => setCycleId(e.target.value)}
        className="cursor-pointer appearance-none bg-panel py-[7px] pl-3 pr-7 text-[11px] font-semibold uppercase tracking-[1.3px] text-faint focus:outline-none"
      >
        {cycles.map((c) => (
          <option key={c.id} value={c.id}>
            Year {c.year}
            {c.isCurrent ? ' (current)' : ''}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-faint"
      >
        ▼
      </span>
    </label>
  );
}

/** Sticky white page header (title, subtitle, year, role, actions) + padded content. */
export function Page({ title, subtitle, actions, children }: PageProps) {
  const { profile } = useMe();

  useEffect(() => {
    document.title = `${title} | Lumen`;
  }, [title]);

  return (
    <main className="pa-page flex min-w-0 flex-1 flex-col">
      <header className="pa-page-header sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-7">
        <div className="min-w-0">
          <h1 className="pa-page-title text-[21px] font-semibold tracking-[-0.45px] text-ink">{title}</h1>
          {subtitle ? <p className="pa-page-subtitle mt-1 text-[12px] text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <CycleSwitcher />
          <Chip background={ROLE_COLOR[profile.role]} className="hidden sm:inline-block">
            {ROLE_LABEL[profile.role]}
          </Chip>
          {actions}
        </div>
      </header>
      <div key={title} className="pa-page-content flex-1 px-4 pb-16 pt-6 sm:px-7">
        {children}
      </div>
    </main>
  );
}
