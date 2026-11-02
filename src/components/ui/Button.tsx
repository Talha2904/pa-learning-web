import { CircularProgress } from '@mui/material';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** One button language for the whole app:
 *  - dark: THE primary action style (Add, Save, Upload, Confirm, Sign in)
 *  - outline: secondary actions (Cancel, Edit, Export)
 *  - danger: destructive actions (Delete, Remove)
 *  - link: inline text links. Do not add new color variants. */
type Variant = 'dark' | 'outline' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  dark: 'bg-ink text-white border border-ink hover:bg-[#1c1c1c] shadow-[0_2px_10px_rgb(0_0_0/0.18)]',
  outline: 'bg-white text-body border border-line-strong hover:border-ink hover:shadow-[0_2px_8px_rgb(30_59_102/0.08)]',
  danger: 'bg-white text-pa-red border border-line-strong hover:border-pa-red',
  link: 'bg-transparent border-0 text-pa-blue hover:text-pa-blue-dark normal-case tracking-normal font-medium px-0',
};

const SIZES: Record<Size, string> = {
  sm: 'px-[11px] py-[5px] text-[11px] font-medium normal-case tracking-normal',
  md: 'px-4 py-[9px] text-[11px] font-semibold uppercase tracking-[1.2px]',
  lg: 'px-[18px] py-[11px] text-[11px] font-semibold uppercase tracking-[1.2px]',
};

/** Class list for a button look - also used for links styled as buttons. */
export function buttonClasses(
  variant: Variant = 'outline',
  size: Size = 'md',
  block = false,
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-[background-color,border-color,color,box-shadow,transform] duration-150 cursor-pointer',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variant !== 'link' && 'active:scale-[0.98]',
    VARIANTS[variant],
    variant !== 'link' && SIZES[size],
    variant === 'link' && 'text-[12px]',
    block && 'w-full',
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  icon?: ReactNode;
}

/** The prototype's square, uppercase, tracked buttons. */
export function Button({
  variant = 'outline',
  size = 'md',
  loading,
  block,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, block, className)}
      {...rest}
    >
      {loading ? <CircularProgress size={12} color="inherit" thickness={5} /> : icon}
      {children}
    </button>
  );
}
