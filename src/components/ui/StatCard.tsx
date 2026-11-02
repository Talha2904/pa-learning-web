import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  noteColor?: string;
  color: string;
  onClick?: () => void;
  /** Larger figure (44px) used on personal dashboards. */
  large?: boolean;
  children?: ReactNode;
}

/** KPI tile: uppercase label, big figure, note. Clickable tiles lift on hover. */
export function StatCard({ label, value, note, noteColor, color, onClick, large, children }: StatCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'pa-stat-card pa-glass relative block w-full overflow-hidden text-left shadow-card px-6 pt-[22px] pb-6',
        onClick && 'cursor-pointer transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-card-hover',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 100% 0%, ${color}14 0%, transparent 55%)` }}
      />
      <span className="relative block">
        <div className="micro-label flex items-center gap-2">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
          {label}
        </div>
        <div className={cn('mt-2.5 font-semibold leading-[1.1] tracking-[-0.5px] text-ink', large ? 'text-[44px]' : 'text-[38px]')}>{value}</div>
        {note ? (
          <div className="mt-1 text-[12px]" style={{ color: noteColor ?? 'rgba(38,39,25,.55)' }}>
            {note}
          </div>
        ) : null}
        {children}
      </span>
    </Tag>
  );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-5', className)}>{children}</div>;
}
