import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Coloured 3px left border (plan cards, banners). */
  accentLeft?: string;
  padded?: boolean;
  /** Frosted-glass card: translucent white, backdrop blur, hairline border. */
  glass?: boolean;
}

/** White card with the prototype's single soft shadow and square corners. */
export function Panel({ accentLeft, padded = true, glass = true, className, style, children, ...rest }: PanelProps) {
  return (
    <div
      className={cn('pa-panel bg-white shadow-card', glass && 'pa-glass', padded && 'p-5 sm:p-6', className)}
      style={{ ...(accentLeft ? { borderLeft: `3px solid ${accentLeft}` } : {}), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, subtitle, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
