"use client";

import { useState } from "react";
import type { Friend } from "/lib/types";
import { queueLabel, timeAgo } from "/lib/format";
import { RankBadge } from "/components/rank-badge";

export function PlayerCard({
  friend,
  onRemoved,
}: {
  friend: Friend;
  onRemoved?: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const last = [...friend.matches].sort((a, b) => b.date - a.date)[0];

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
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${
        friend.live ? "border-emerald-700/70 bg-emerald-950/20" : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">
            {friend.name}
            <span className="text-slate-500">#{friend.tag}</span>
          </p>
          {friend.live ? (
            <p className="mt-1 text-sm font-semibold text-emerald-400">
              Jugando ahora · {friend.live.championName || "en partida"}
            </p>
          ) : last ? (
            <p className="mt-1 text-sm text-slate-500">
              Última: {last.champion} · {timeAgo(last.date)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">Sin partidas recientes</p>
          )}
        </div>
        {friend.dbId != null && (
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            title="Quitar amigo"
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-500 hover:border-red-700 hover:text-red-300 disabled:opacity-50"
          >
            {removing ? "…" : "✕"}
          </button>
        )}
      </div>

      <div className="grid gap-2">
        <RankRow label="Solo/Dúo" rank={friend.solo} />
        <RankRow label="Flex" rank={friend.flex} />
      </div>

      {friend.rankError && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-2.5 py-1.5 text-xs text-amber-300">
          No se pudo cargar el rango ({friend.rankError})
        </p>
      )}
      {friend.error && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-2.5 py-1.5 text-xs text-amber-300">
          Error: {friend.error}
        </p>
      )}
    </article>
  );
}

function RankRow({ label, rank }: { label: string; rank: Friend["solo"] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
        {rank && (
          <p className="text-xs text-slate-500">
            {rank.wins}V {rank.losses}D · {rank.winRate}%
          </p>
        )}
      </div>
      <div className="mt-1">
        <RankBadge rank={rank} size={32} />
      </div>
      {rank && <p className="mt-0.5 text-[11px] text-slate-600">{queueLabel(rank.queue)}</p>}
    </div>
  );
}
