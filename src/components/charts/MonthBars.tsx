import { monthLabel } from '@/lib/format';

interface MonthBarsProps {
  data: { month: string; count: number }[];
  onSelect?: (month: string) => void;
  height?: number;
}

/** Modern floating bar chart: trackless vibrant bars, value labels, baseline. */
export function MonthBars({ data, onSelect, height = 210 }: MonthBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const plotH = height - 58;
  return (
    <div className="relative" style={{ height }}>
      <div className="flex h-full items-stretch gap-1 sm:gap-2">
        {data.map((d, i) => {
          const barH = Math.max(14, Math.round((d.count / max) * plotH));
          return (
            <button
              key={d.month}
              type="button"
              onClick={() => onSelect?.(d.month)}
              aria-label={`${monthLabel(d.month)}: ${d.count} completions`}
              className="group flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end pb-[26px]"
            >
              <span
                className="mb-2 text-[13px] font-bold tabular-nums text-ink transition-transform duration-200 group-hover:-translate-y-0.5"
                style={{ opacity: d.count ? 1 : 0.25 }}
              >
                {d.count}
              </span>
              <span
                className="block w-[36px] max-w-full origin-bottom animate-bar-grow rounded-[10px] transition-all duration-200 group-hover:-translate-y-1 group-hover:brightness-[1.07]"
                style={{
                  height: barH,
                  background: d.count
                    ? 'linear-gradient(180deg, #8ec2ff 0%, #3b82f6 55%, #1e56c8 100%)'
                    : 'rgba(45,141,254,.12)',
                  boxShadow: d.count
                    ? '0 10px 26px rgb(59 130 246 / 0.35), inset 0 2px 0 rgb(255 255 255 / 0.45), inset 0 -3px 6px rgb(0 0 0 / 0.08)'
                    : undefined,
                  animationDelay: `${120 + i * 90}ms`,
                }}
              />
            </button>
          );
        })}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[26px] h-px bg-[rgba(30,59,102,.12)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex gap-1 sm:gap-2">
        {data.map((d) => (
          <span
            key={d.month}
            className="min-w-0 flex-1 pt-2 text-center text-[10px] font-semibold uppercase tracking-[1.4px] text-faint"
          >
            {monthLabel(d.month)}
          </span>
        ))}
      </div>
    </div>
  );
}
