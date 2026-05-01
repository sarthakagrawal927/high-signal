import type { ReactNode } from "react";

export interface ProductArea {
  href: string;
  title: string;
  kicker: string;
  body: string;
}

export interface StatItem {
  label: string;
  value: string;
  sub: string;
}

export interface NavItem {
  href: string;
  title: string;
  sub: string;
}

export function PageShell({
  max = "max-w-5xl",
  children,
}: {
  max?: "max-w-4xl" | "max-w-5xl";
  children: ReactNode;
}) {
  return <main className={`mx-auto ${max} px-6 py-20`}>{children}</main>;
}

export function BackLink({ href = "/", children = "back to high signal" }) {
  return (
    <a
      href={href}
      className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
    >
      {children}
    </a>
  );
}

export function HeroHeader({
  eyebrow,
  title,
  children,
  size = "lg",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <header className="border-b border-[var(--color-line)] pb-8">
      <div className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
        <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
        <span>{eyebrow}</span>
      </div>
      <h1
        className={`mt-4 font-medium tracking-tight ${size === "lg" ? "text-5xl" : "text-4xl"}`}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--color-muted)]">{children}</p>
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="mt-8 border-b border-[var(--color-line)] pb-8">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {eyebrow}
      </div>
      <h1 className="mt-4 text-4xl font-medium tracking-tight">{title}</h1>
      <p className="mt-4 max-w-2xl text-[var(--color-muted)]">{children}</p>
    </header>
  );
}

export function ProductAreaGrid({ items }: { items: ProductArea[] }) {
  return (
    <section className="mt-10 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="group min-h-48 bg-[var(--color-bg)] p-5 transition-colors hover:bg-white/[0.025]"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] group-hover:text-[var(--color-accent)]">
            {item.kicker}
          </div>
          <h2 className="mt-8 text-xl font-medium tracking-tight">{item.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{item.body}</p>
        </a>
      ))}
    </section>
  );
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <section className="mt-10 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="bg-[var(--color-bg)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {item.label}
          </div>
          <div className="mt-5 text-xl font-medium">{item.value}</div>
          <div className="mt-2 text-sm text-[var(--color-muted)]">{item.sub}</div>
        </div>
      ))}
    </section>
  );
}

export function RouteList({ items }: { items: NavItem[] }) {
  return (
    <nav className="mt-12 flex flex-col divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] font-mono text-sm">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="group flex items-center justify-between gap-6 py-4 transition-colors hover:bg-white/[0.02]"
        >
          <span className="flex items-baseline gap-4">
            <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)]">
              {item.href}
            </span>
            <span className="text-[var(--color-fg)]">{item.title}</span>
          </span>
          <span className="text-right text-[var(--color-muted)]">{item.sub}</span>
        </a>
      ))}
    </nav>
  );
}
