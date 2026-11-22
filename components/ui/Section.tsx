import type { ReactNode } from 'react';

/** A numbered step of the flow. The number is part of the heading because the steps are a real sequence. */
export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-line py-8 first:border-t-0">
      <h2 id={`${id}-title`} className="text-2xl font-extrabold tracking-tight text-ink">
        {title}
      </h2>
      {intro ? <p className="mt-1 max-w-prose text-muted">{intro}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-lg border-l-4 border-[#d32f2f] bg-white px-3 py-2 text-ink"
    >
      {children}
    </p>
  );
}

export const buttonPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-breath px-4 py-2 font-semibold text-white hover:bg-ink disabled:opacity-60';
export const buttonQuiet =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-paper px-4 py-2 font-semibold text-ink hover:border-breath';
export const inputClass =
  'min-h-11 w-full rounded-lg border border-[#8a9ba8] bg-paper px-3 py-2 text-lg text-ink placeholder:text-[#6b7c88]';
