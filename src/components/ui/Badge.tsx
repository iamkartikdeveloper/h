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
    primary: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
    secondary: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    outline: 'bg-transparent text-slate-300 border border-slate-700',
    gradient: 'bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-sky-300 border border-sky-500/30 font-medium',
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
