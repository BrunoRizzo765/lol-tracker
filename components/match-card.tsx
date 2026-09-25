"use client";

import type { Match } from "/lib/types";
import { csPerMin, kda, kdaColor, kdaLabel, queueName, timeAgo } from "/lib/format";

export function MatchCard({ m, onOpen }: { m: Match; onOpen?: (id: string) => void }) {
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
      className={`grid gap-4 rounded-2xl border p-4 md:grid-cols-[96px_1fr_auto] md:items-center ${
        m.win ? "border-cyan-900/60 bg-cyan-950/20" : "border-red-900/60 bg-red-950/20"
      } ${interactive ? "cursor-pointer transition hover:border-cyan-600/80" : ""}`}
    >
      <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1">
        <span className={`h-2 w-2 rounded-full ${m.win ? "bg-cyan-400" : "bg-red-400"}`} />
        <div>
          <p className={`font-black ${m.win ? "text-cyan-400" : "text-red-400"}`}>{m.win ? "VICTORIA" : "DERROTA"}</p>
          <p className="text-xs text-slate-500">{timeAgo(m.date)}</p>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {m.friend && <span className="font-bold">{m.friend}</span>}
          {m.friend && <span className="text-slate-600">·</span>}
          <span className="text-sm text-slate-400">{queueName(m.queueId)}</span>
          <span className="text-slate-600">·</span>
          <span className="text-sm text-slate-500">
            {Math.floor(m.duration / 60)}:{String(m.duration % 60).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-2 text-slate-300">
          <b>{m.champion}</b> <span className="text-slate-500">·</span> {m.kills}/{m.deaths}/{m.assists}
          <span className={`ml-2 font-semibold ${kdaColor(ratio)}`}>KDA {kdaLabel(m.kills, m.deaths, m.assists)}</span>
        </p>
        {interactive && <p className="mt-1 text-xs text-slate-600">Click para ver scoreboard</p>}
      </div>
      <div className="grid grid-cols-3 gap-4 text-left text-sm text-slate-400 md:grid-cols-1 md:gap-0.5 md:text-right">
        <p>
          <span className="text-slate-200">{m.cs}</span> CS <span className="text-slate-600">({cpm.toFixed(1)}/min)</span>
        </p>
        <p>
          <span className="text-slate-200">{m.gold.toLocaleString()}</span> gold
        </p>
        <p>
          Nivel <span className="text-slate-200">{m.level}</span>
        </p>
      </div>
    </article>
  );
}
