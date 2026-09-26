"use client";

import { Database, Flame, Radio, Users } from "lucide-react";
import type { Friend, Match } from "/lib/types";
import { Meter, cx } from "/components/ui";
import { compactNumber, timeAgo } from "/lib/format";

/**
 * KPI row: headline numbers for the group. Each tile is label + value (+ hint).
 */
export function StatsStrip({
  friends,
  liveCount,
  matchTotal,
  recent,
  oldestSync,
}: {
  friends: Friend[];
  liveCount: number;
  matchTotal: number;
  recent: Match[];
  oldestSync?: number;
}) {
  const last = [...recent].sort((a, b) => b.date - a.date).slice(0, 20);
  const wins = last.filter((m) => m.win).length;
  const wr = last.length ? Math.round((wins / last.length) * 100) : 0;

  // Current streak across the group's most recent games.
  let streak = 0;
  if (last.length) {
    const first = last[0].win;
    for (const m of last) {
      if (m.win === first) streak += 1;
      else break;
    }
    streak = first ? streak : -streak;
  }

  const activeNow = friends.filter((f) => f.live).length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile icon={<Users size={16} />} label="Amigos" value={String(friends.length)} hint={activeNow ? `${activeNow} conectado${activeNow === 1 ? "" : "s"} ahora` : "Nadie en partida"} />
      <Tile
        icon={<Radio size={16} />}
        label="Partidas en curso"
        value={String(liveCount)}
        hint={liveCount ? "Lobby completo abajo" : "Esperando que alguien entre"}
        tone={liveCount ? "live" : undefined}
      />
      <Tile
        icon={<Database size={16} />}
        label="Partidas guardadas"
        value={compactNumber(matchTotal)}
        hint={oldestSync ? `Historial desde ${timeAgo(oldestSync)}` : "Sin historial todavía"}
      />
      <Tile
        icon={<Flame size={16} />}
        label="Winrate últimas 20"
        value={last.length ? `${wr}%` : "—"}
        hint={
          last.length
            ? `${wins}V ${last.length - wins}D · racha ${streak > 0 ? `+${streak}` : streak}`
            : "Sin partidas recientes"
        }
        meter={last.length ? wr : undefined}
      />
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  hint,
  meter,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  meter?: number;
  tone?: "live";
}) {
  return (
    <div className={cx("card flex flex-col gap-2 px-4 py-3.5 animate-fade-up", tone === "live" && "shadow-glow-live border-live/30")}>
      <div className="flex items-center justify-between text-fg-dim">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <span className={cx(tone === "live" ? "text-live" : "text-fg-dim")}>{icon}</span>
      </div>
      <p className="font-display text-3xl font-semibold leading-none tracking-tight text-fg">{value}</p>
      {typeof meter === "number" && <Meter value={meter} tone={meter >= 50 ? "win" : "loss"} className="mt-1" />}
      {hint && <p className="text-xs leading-snug text-fg-dim">{hint}</p>}
    </div>
  );
}
