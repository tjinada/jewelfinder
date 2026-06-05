import type { ReactNode } from 'react';
import { GlassSurface } from '@/components/ui';

interface AuthShellProps {
  children: ReactNode;
}

/** Centered glass card on the ivory canvas with ambient blooms (auth pages). */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <GlassSurface className="relative z-10 w-full max-w-sm rounded-3xl p-7">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/icons/icon-512.png" alt="" className="mb-3 h-14 w-14 rounded-2xl" />
          <h1 className="font-display text-2xl text-primary">Clasp</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Borrow theirs, Lend yours
          </p>
        </div>
        {children}
      </GlassSurface>
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface/80 px-4 py-3 text-sm text-ink outline-none ' +
  'placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20';

export const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted';
