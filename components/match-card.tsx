"use client";

import { ChevronRight } from "lucide-react";
import type { Match } from "/lib/types";
import { csPerMin, compactNumber, formatDuration, isRankedQueue, kda, kdaColor, kdaLabel, queueName, timeAgo } from "/lib/format";
import { ChampAvatar, cx } from "/components/ui";

export function MatchCard({
  m,
  version,
  onOpen,
  showFriend = true,
}: {
  m: Match;
  version?: string | null;
  onOpen?: (id: string) => void;
  showFriend?: boolean;
}) {
  const ratio = kda(m.kills, m.deaths, m.assists);
  const cpm = csPerMin(m.cs, m.duration);
  const interactive = Boolean(onOpen);

  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpen?.(m.id) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.(m.id);
              }
            }
          : undefined
      }
      className={cx(
        "focus-ring group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-2xl border py-3 pl-4 pr-3 transition-all duration-200 sm:gap-4 sm:pl-5",
        m.win
          ? "border-win/20 bg-gradient-to-r from-win/[0.10] via-ink-900/60 to-ink-900/60"
          : "border-loss/20 bg-gradient-to-r from-loss/[0.10] via-ink-900/60 to-ink-900/60",
        interactive && "cursor-pointer hover:-translate-y-px hover:border-gold-500/40 hover:shadow-card",
      )}
    >
      {/* Result stripe */}
      <span className={cx("absolute inset-y-0 left-0 w-1", m.win ? "bg-win" : "bg-loss")} aria-hidden />

      <ChampAvatar version={version} champion={m.champion} size={48} level={m.level} ring={m.win ? "win" : "loss"} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-dim">
          <span className={cx("font-bold uppercase tracking-wider", m.win ? "text-win" : "text-loss")}>{m.win ? "Victoria" : "Derrota"}</span>
          {showFriend && m.friend && (
            <>
              <span className="text-ink-500">·</span>
              <span className="font-semibold text-fg">{m.friend}</span>
            </>
          )}
          <span className="text-ink-500">·</span>
          <span className={cx(isRankedQueue(m.queueId) && "text-gold-400/90")}>{queueName(m.queueId)}</span>
          <span className="hidden text-ink-500 sm:inline">·</span>
          <span className="hidden sm:inline">{formatDuration(m.duration)}</span>
          <span className="text-ink-500">·</span>
          <span>{timeAgo(m.date)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <p className="font-display text-base font-semibold tracking-tight text-fg">{m.champion}</p>
          <p className="text-sm tabular-nums text-fg">
            <span className="font-semibold">{m.kills}</span>
            <span className="text-fg-dim"> / </span>
            <span className="font-semibold text-loss">{m.deaths}</span>
            <span className="text-fg-dim"> / </span>
            <span className="font-semibold">{m.assists}</span>
          </p>
          <p className={cx("text-xs font-semibold", kdaColor(ratio))}>{kdaLabel(m.kills, m.deaths, m.assists)} KDA</p>
        </div>
        <p className="mt-0.5 text-xs text-fg-dim sm:hidden">
          {m.cs} CS · {compactNumber(m.gold)} oro · {formatDuration(m.duration)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <dl className="hidden grid-cols-2 gap-x-5 text-right text-xs sm:grid">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-fg-dim">CS</dt>
            <dd className="tabular-nums text-fg">
              {m.cs} <span className="text-fg-dim">({cpm.toFixed(1)})</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-fg-dim">Oro</dt>
            <dd className="tabular-nums text-fg">{compactNumber(m.gold)}</dd>
          </div>
        </dl>
        {interactive && (
          <ChevronRight size={18} className="text-fg-dim transition-all group-hover:translate-x-0.5 group-hover:text-gold-400" />
        )}
      </div>
    </article>
  );
}
