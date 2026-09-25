"use client";

import { useEffect, useState } from "react";
import type { MatchDetail } from "/lib/types";
import { champIcon, itemIcon } from "/lib/ddragon";
import { kdaLabel, queueName, timeAgo } from "/lib/format";

export function MatchDetailModal({
  matchId,
  onClose,
}: {
  matchId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<MatchDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = await fetch(`/api/matches/${encodeURIComponent(matchId)}`, { cache: "force-cache" });
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Error");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const version = data?.ddragonVersion;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de partida"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-950 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-cyan-400">Detalle de partida</p>
            {data && (
              <p className="text-sm text-slate-400">
                {queueName(data.queueId)} · {Math.floor(data.duration / 60)}:{String(data.duration % 60).padStart(2, "0")} ·{" "}
                {timeAgo(data.date)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
          {loading && <p className="py-10 text-center text-slate-500">Cargando scoreboard…</p>}
          {error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">{error}</p>}
          {data && (
            <div className="grid gap-6">
              {data.teams.map((team) => (
                <div key={team.teamId} className="overflow-hidden rounded-xl border border-slate-800">
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${
                      team.win ? "bg-cyan-950/40" : "bg-red-950/30"
                    }`}
                  >
                    <p className={`font-black ${team.win ? "text-cyan-300" : "text-red-300"}`}>
                      {team.win ? "VICTORIA" : "DERROTA"} · Equipo {team.teamId === 100 ? "Azul" : "Rojo"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {team.kills}/{team.deaths}/{team.assists} · {team.gold.toLocaleString()} gold
                    </p>
                  </div>
                  <div className="divide-y divide-slate-800/80">
                    {team.participants.map((p) => (
                      <div
                        key={p.puuid}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 sm:grid-cols-[auto_1fr_auto_auto]"
                      >
                        <div className="flex items-center gap-2">
                          {version ? (
                            <img
                              src={champIcon(version, p.champion)}
                              alt={p.champion}
                              width={36}
                              height={36}
                              className="rounded-md"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-slate-800" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {p.name || p.champion}
                              {p.tag ? <span className="text-slate-500">#{p.tag}</span> : null}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.champion} · Nv {p.level}
                            </p>
                          </div>
                        </div>
                        <p className="hidden text-sm text-slate-300 sm:block">
                          {p.kills}/{p.deaths}/{p.assists}{" "}
                          <span className="text-slate-500">({kdaLabel(p.kills, p.deaths, p.assists)})</span>
                        </p>
                        <div className="flex gap-0.5">
                          {p.items.map((item, i) =>
                            item && version ? (
                              <img
                                key={`${p.puuid}-item-${i}`}
                                src={itemIcon(version, item)}
                                alt=""
                                width={22}
                                height={22}
                                className="rounded-sm bg-slate-900"
                              />
                            ) : (
                              <span key={`${p.puuid}-item-${i}`} className="h-[22px] w-[22px] rounded-sm bg-slate-900" />
                            ),
                          )}
                        </div>
                        <div className="hidden text-right text-xs text-slate-500 sm:block">
                          <p>{p.cs} CS</p>
                          <p>{p.gold.toLocaleString()} g</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
