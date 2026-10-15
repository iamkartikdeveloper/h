import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'gradient';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'secondary',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    outline: 'bg-white text-slate-700 border border-slate-300',
    gradient: 'bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 border border-indigo-200 font-medium',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 transition-colors', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
