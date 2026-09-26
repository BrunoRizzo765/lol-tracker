"use client";

import { useState } from "react";
import { Crown, Trash2 } from "lucide-react";
import type { Friend } from "/lib/types";
import { TIER_HEX, timeAgo } from "/lib/format";
import { RankBadge } from "/components/rank-badge";
import { ChampAvatar, Meter, cx } from "/components/ui";

/**
 * One row per friend: ladder position, rank crests (Solo + Flex), live status,
 * last games form and a remove action. Replaces the old separate ladder + cards.
 */
export function PlayerCard({
  friend,
  position,
  version,
  onRemoved,
  canRemove = true,
}: {
  friend: Friend;
  position: number;
  version?: string | null;
  onRemoved?: () => void;
  canRemove?: boolean;
}) {
  const [removing, setRemoving] = useState(false);
  const recent = [...friend.matches].sort((a, b) => b.date - a.date).slice(0, 6);
  const last = recent[0];
  const tierHex = friend.rank ? TIER_HEX[friend.rank.tier?.toUpperCase()] : undefined;
  const wins = recent.filter((m) => m.win).length;

  async function remove() {
    if (!friend.dbId || !confirm(`¿Quitar a ${friend.name}#${friend.tag}?`)) return;
    setRemoving(true);
    try {
      const r = await fetch(`/api/friends/${friend.dbId}`, { method: "DELETE" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Error");
      onRemoved?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article
      className={cx(
        "group relative px-5 py-4 transition-colors hover:bg-white/[0.02]",
        friend.live && "bg-live/[0.05]",
      )}
      style={tierHex ? { boxShadow: `inset 3px 0 0 0 ${tierHex}${friend.live ? "" : "99"}` } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Position */}
        <div className="grid w-7 shrink-0 place-items-center pt-0.5">
          {friend.live ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-live animate-pulse-ring" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
            </span>
          ) : position === 1 ? (
            <Crown size={16} className="text-gold-400" />
          ) : (
            <span className="font-display text-sm font-bold tabular-nums text-fg-dim">{position}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold tracking-tight">
                {friend.name}
                <span className="text-fg-dim">#{friend.tag}</span>
              </p>
              {friend.live ? (
                <p className="mt-0.5 text-xs font-semibold text-live">
                  Jugando ahora{friend.live.championName ? ` · ${friend.live.championName}` : ""}
                </p>
              ) : last ? (
                <p className="mt-0.5 text-xs text-fg-dim">
                  Última: <span className="text-fg-muted">{last.champion}</span> · {timeAgo(last.date)}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-fg-dim">Sin partidas recientes</p>
              )}
            </div>
            {friend.dbId != null && canRemove && (
              <button
                type="button"
                onClick={remove}
                disabled={removing}
                title="Quitar amigo"
                aria-label={`Quitar a ${friend.name}`}
                className="focus-ring -mr-1 -mt-1 rounded-lg p-1.5 text-fg-dim opacity-0 transition-all hover:bg-loss/10 hover:text-loss group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Ranks */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <RankBlock label="Solo/Dúo" rank={friend.solo} glow={position === 1} />
            <RankBlock label="Flex" rank={friend.flex} />
          </div>

          {/* Recent form */}
          {recent.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {recent.map((m) => (
                  <ChampAvatar
                    key={`${m.id}-${m.friend}`}
                    version={version}
                    champion={m.champion}
                    size={24}
                    rounded="rounded-md"
                    ring={m.win ? "win" : "loss"}
                  />
                ))}
              </div>
              <p className="shrink-0 text-[11px] text-fg-dim">
                <span className="text-win">{wins}V</span> <span className="text-loss">{recent.length - wins}D</span> recientes
              </p>
            </div>
          )}

          {(friend.rankError || friend.error) && (
            <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
              {friend.error ? `Error: ${friend.error}` : `No se pudo cargar el rango (${friend.rankError})`}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function RankBlock({ label, rank, glow }: { label: string; rank: Friend["solo"]; glow?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-950/50 px-3 py-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-dim">{label}</p>
      <RankBadge rank={rank} size={30} variant="stacked" glow={glow && Boolean(rank)} />
      {rank && <Meter value={rank.winRate} tone={rank.winRate >= 50 ? "win" : "loss"} className="mt-2" />}
    </div>
  );
}
