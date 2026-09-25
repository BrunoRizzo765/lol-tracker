"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dashboard } from "/lib/types";
import { rankLabel, TIER_COLORS, queueLabel, timeAgo } from "/lib/format";
import { MatchCard } from "/components/match-card";
import { PlayerCard } from "/components/player-card";
import { ChampionPool } from "/components/champion-pool";

type ResultFilter = "Todos" | "Victorias" | "Derrotas";

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [result, setResult] = useState<ResultFilter>("Todos");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Error");
      setData(json);
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const matches = useMemo(
    () =>
      (data?.recent || []).filter(
        (m) =>
          (filter === "Todos" || m.friend === filter) &&
          (result === "Todos" || (result === "Victorias" ? m.win : !m.win)),
      ),
    [data, filter, result],
  );

  const total = data?.ranking.reduce((s, x) => s + x.games, 0) || 0;
  const wins = data?.ranking.reduce((s, x) => s + x.wins, 0) || 0;
  const onFire = data?.ladder.filter((x) => x.rank?.hotStreak).length || 0;
  const bestKda = data?.ranking.slice().sort((a, b) => b.kda - a.kda)[0];

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">League of Legends</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Friends <span className="text-cyan-400">Tracker</span>
            </h1>
            <p className="mt-3 text-slate-400">Rankings, perfiles, campeones y últimas partidas de tu grupo.</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold hover:border-cyan-500 disabled:opacity-50"
            >
              {loading ? "Actualizando…" : "↻ Actualizar"}
            </button>
            {updatedAt && <span className="text-xs text-slate-600">Actualizado {timeAgo(updatedAt)}</span>}
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}. Revisá <code>RIOT_API_KEY</code> y <code>FRIENDS</code>.
          </div>
        )}
        {loading && !data && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
            Cargando partidas…
          </div>
        )}

        {data && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat title="Amigos" value={data.friends.length} />
              <Stat title="Win rate grupo" value={`${total ? Math.round((wins / total) * 100) : 0}%`} hint={`${total} partidas`} />
              <Stat title="En racha 🔥" value={onFire} hint="hot streak activo" />
              <Stat title="Mejor KDA" value={bestKda ? bestKda.kda.toFixed(2) : "—"} hint={bestKda?.name} />
            </section>

            <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-lg font-bold">Ranking clasificatorio</h2>
                <p className="text-sm text-slate-500">Elo actual de cada amigo (Solo/Dúo, o Flex si no juega Solo).</p>
              </div>
              <div className="divide-y divide-slate-800">
                {data.ladder.map((x, i) => (
                  <div
                    key={`${x.name}#${x.tag}`}
                    className="grid grid-cols-[40px_1fr_auto] items-center gap-4 px-5 py-4"
                  >
                    <span className={`text-xl font-black ${i === 0 ? "text-amber-300" : "text-slate-500"}`}>
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-bold">
                        {x.name}
                        {x.rank?.hotStreak && (
                          <span title="Racha de victorias" className="text-orange-400">
                            🔥
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          x.rank ? TIER_COLORS[x.rank.tier?.toUpperCase()] || "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {rankLabel(x.rank)}
                      </p>
                    </div>
                    <div className="text-right">
                      {x.rank ? (
                        <>
                          <p className="font-bold text-cyan-400">{x.rank.winRate}%</p>
                          <p className="text-xs text-slate-500">
                            {x.rank.wins}V {x.rank.losses}D · {queueLabel(x.rank.queue)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-600">—</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-lg font-bold">Perfiles</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.friends.map((f) => (
                  <PlayerCard key={f.id} friend={f} />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <ChampionPool friends={data.friends} />
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="mr-2 text-lg font-bold">Últimas partidas</h2>
                <button
                  onClick={() => setFilter("Todos")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${filter === "Todos" ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-400"}`}
                >
                  Todos
                </button>
                {data.friends.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.name)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${filter === f.name ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-400"}`}
                  >
                    {f.name}
                  </button>
                ))}
                <span className="mx-1 h-5 w-px bg-slate-800" />
                {(["Todos", "Victorias", "Derrotas"] as ResultFilter[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResult(r)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${result === r ? "bg-slate-200 text-slate-950" : "bg-slate-900 text-slate-400"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="grid gap-3">
                {matches.length ? (
                  matches.map((m) => <MatchCard key={`${m.id}-${m.friend}`} m={m} />)
                ) : (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
                    No hay partidas con estos filtros.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        <footer className="mt-12 border-t border-slate-900 pt-5 text-xs leading-5 text-slate-600">
          LoL Friends Tracker no está respaldado por Riot Games. League of Legends y Riot Games son marcas de Riot
          Games, Inc.
        </footer>
      </div>
    </main>
  );
}

function Stat({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-slate-600">{hint}</p>}
    </div>
  );
}
