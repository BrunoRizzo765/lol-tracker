"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { champIcon } from "/lib/ddragon";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Card ---------- */

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cx("card overflow-hidden", className)} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({
  icon,
  title,
  subtitle,
  right,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("card-header flex items-start justify-between gap-3 px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold-500/25 bg-gold-500/10 text-gold-400">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-tight text-fg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-fg-dim">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ---------- Button ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "ghost", size = "md", loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  const base =
    "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  const variants = {
    primary:
      "bg-gradient-to-b from-gold-400 to-gold-600 text-ink-950 shadow-[0_8px_24px_-10px_rgb(201_167_92/0.8)] hover:from-gold-300 hover:to-gold-500",
    ghost:
      "border border-ink-600/80 bg-ink-850/80 text-fg hover:border-gold-500/50 hover:bg-ink-800",
    subtle: "bg-white/[0.04] text-fg-muted hover:bg-white/[0.08] hover:text-fg",
    danger: "border border-loss/30 bg-loss/10 text-loss hover:bg-loss/20",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ---------- Chip / Pill ---------- */

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "win" | "loss" | "live" | "gold";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-ink-600/70 bg-ink-800/70 text-fg-muted",
    win: "border-win/30 bg-win/10 text-win",
    loss: "border-loss/30 bg-loss/10 text-loss",
    live: "border-live/40 bg-live/10 text-live",
    gold: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  accent = "gold",
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  accent?: "gold" | "neutral";
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-ink-600/60 bg-ink-900/70 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              "focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? accent === "gold"
                  ? "bg-gold-500 text-ink-950 shadow-[0_4px_14px_-6px_rgb(201_167_92/0.9)]"
                  : "bg-fg text-ink-950"
                : "text-fg-muted hover:bg-white/[0.05] hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}

/* ---------- Champion avatar ---------- */

export function ChampAvatar({
  version,
  champion,
  size = 40,
  level,
  ring,
  className,
  rounded = "rounded-xl",
}: {
  version?: string | null;
  champion: string;
  size?: number;
  level?: number;
  ring?: "win" | "loss" | "live" | "gold" | "none";
  className?: string;
  rounded?: string;
}) {
  const src = champIcon(version, champion);
  const rings = {
    win: "ring-2 ring-win/70",
    loss: "ring-2 ring-loss/70",
    live: "ring-2 ring-live/80",
    gold: "ring-2 ring-gold-500/80",
    none: "ring-1 ring-white/10",
  };
  return (
    <div className={cx("relative shrink-0", className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={champion}
          title={champion}
          width={size}
          height={size}
          loading="lazy"
          className={cx("h-full w-full object-cover bg-ink-800", rounded, rings[ring || "none"])}
        />
      ) : (
        <div
          className={cx("grid h-full w-full place-items-center bg-ink-700 font-display text-xs font-bold text-fg-muted", rounded, rings[ring || "none"])}
        >
          {champion.slice(0, 2).toUpperCase()}
        </div>
      )}
      {typeof level === "number" && (
        <span className="absolute -bottom-1 -right-1 rounded-md border border-ink-950 bg-ink-800 px-1 text-[10px] font-bold leading-4 text-fg">
          {level}
        </span>
      )}
    </div>
  );
}

/* ---------- Meter (same-hue track) ---------- */

export function Meter({
  value,
  tone = "win",
  className,
}: {
  value: number; // 0-100
  tone?: "win" | "loss" | "gold";
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const fills = { win: "bg-win", loss: "bg-loss", gold: "bg-gold-500" };
  const tracks = { win: "bg-win/15", loss: "bg-loss/15", gold: "bg-gold-500/15" };
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full", tracks[tone], className)} role="presentation">
      <div className={cx("h-full rounded-full transition-[width] duration-500", fills[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <span className="grid h-12 w-12 place-items-center rounded-2xl border border-ink-600/60 bg-ink-800/60 text-fg-dim">{icon}</span>}
      <p className="font-semibold text-fg-muted">{title}</p>
      {hint && <p className="max-w-sm text-sm text-fg-dim">{hint}</p>}
    </div>
  );
}
