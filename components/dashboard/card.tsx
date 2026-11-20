"use client";

/** The white panel every dashboard section sits in. */

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`animate-rise min-w-0 rounded-[1.75rem] border border-line bg-card p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
