"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dashboard, Match } from "/lib/types";
import { timeAgo } from "/lib/format";
import { MatchCard } from "/components/match-card";
import { PlayerCard } from "/components/player-card";
import { AddFriendForm } from "/components/add-friend-form";
import { MatchDetailModal } from "/components/match-detail-modal";
import { LiveGameCard } from "/components/live-game-card";
import { RankBadge } from "/components/rank-badge";

type ResultFilter = "Todos" | "Victorias" | "Derrotas";

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<"refresh" | "backfill" | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [result, setResult] = useState<ResultFilter>("Todos");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [extraMatches, setExtraMatches] = useState<Match[]>([]);
  const [hasMoreDb, setHasMoreDb] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/dashboard?matchLimit=40", { cache: "no-store" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Error");
      setData(json);
      setExtraMatches([]);
      setHasMoreDb(Boolean(json.hasMoreMatches));
      setUpdatedAt(Date.now());
      return json as Dashboard;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando datos");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function sync(mode: "refresh" | "backfill") {
    setSyncing(mode);
    setSyncMsg("");
    setError("");
    try {
      const r = await fetch("/api/matches/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Error sincronizando");
      const days = mode === "backfill" ? "+5 días atrás" : "desde el último refresh";
      setSyncMsg(
        `Listo (${days}): ${json.inserted} nuevas de ${json.fetched} encontradas en Riot.`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error sincronizando");
    } finally {
      setSyncing(null);
    }
  }

  async function loadMoreFromDb() {
    if (!data) return;
    setLoadingMore(true);
    try {
      const all = [...(data.recent || []), ...extraMatches];
      const before = all.length ? Math.min(...all.map((m) => m.date)) : undefined;
      const qs = new URLSearchParams({ limit: "40" });
      if (before) qs.set("before", String(before));
      const r = await fetch(`/api/matches?${qs}`, { cache: "no-store" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Error");
      const incoming = (json.matches as Match[]).filter(
        (m) => !all.some((x) => x.id === m.id && x.friend === m.friend),
      );
      setExtraMatches((prev) => [...prev, ...incoming]);
      setHasMoreDb(Boolean(json.hasMore) && incoming.length > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando más");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    (async () => {
      const dash = await load();
      // Primera visita sin historial: trae los últimos 5 días solo.
      if (dash && (dash.matchTotal ?? 0) === 0) {
        await sync("refresh");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMatches = useMemo(
    () => [...(data?.recent || []), ...extraMatches],
    [data, extraMatches],
  );

  const matches = useMemo(
    () =>
      allMatches.filter(
        (m) =>
          (filter === "Todos" || m.friend === filter) &&
          (result === "Todos" || (result === "Victorias" ? m.win : !m.win)),
      ),
    [allMatches, filter, result],
  );

  const liveCount = data?.live?.length ?? 0;
  const matchTotal = data?.matchTotal ?? allMatches.length;
  const oldestSync = data?.friends
    .map((f) => f.syncedOldest)
    .filter((x): x is number => typeof x === "number")
    .sort((a, b) => a - b)[0];

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">League of Legends</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Friends <span className="text-cyan-400">Tracker</span>
            </h1>
            <p className="mt-3 text-slate-400">Quién está en partida, el rango de cada uno y el historial guardado.</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => sync("refresh")}
                disabled={loading || Boolean(syncing)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold hover:border-cyan-500 disabled:opacity-50"
              >
                {syncing === "refresh" ? "Sincronizando…" : "↻ Actualizar partidas"}
              </button>
              <button
                onClick={load}
                disabled={loading || Boolean(syncing)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold hover:border-cyan-500 disabled:opacity-50"
              >
                {loading ? "Cargando…" : "Rangos / live"}
              </button>
            </div>
            {updatedAt && <span className="text-xs text-slate-600">UI {timeAgo(updatedAt)}</span>}
          </div>
        </header>

        <section className="mb-8">
          <AddFriendForm
            onAdded={async () => {
              await load();
              await sync("refresh");
            }}
          />
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
            {error.includes("RIOT_API_KEY") && (
              <p className="mt-2 text-sm text-red-200/80">
                Abrí <code>.env.local</code>, poné tu key de{" "}
                <a className="underline" href="https://developer.riotgames.com" target="_blank" rel="noreferrer">
                  developer.riotgames.com
                </a>{" "}
                y reiniciá <code>pnpm dev</code>.
              </p>
            )}
          </div>
        )}
        {syncMsg && (
          <div className="mb-6 rounded-xl border border-cyan-900/50 bg-cyan-950/30 p-4 text-cyan-200">{syncMsg}</div>
        )}
        {loading && !data && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
            Cargando amigos…
          </div>
        )}

        {data && (
          <>
            <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-lg font-bold">Jugando ahora</h2>
                <p className="text-sm text-slate-500">
                  {liveCount
                    ? `${liveCount} partida${liveCount === 1 ? "" : "s"} en curso · equipos, bans y hechizos`
                    : "Nadie del grupo está en una partida ahora"}
                </p>
              </div>
              {liveCount ? (
                data.live.map((g) => <LiveGameCard key={g.gameId} game={g} />)
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-600">
                  Cuando alguien entre a una partida, aparece acá el lobby completo.
                </p>
              )}
            </section>

            <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-lg font-bold">Rangos</h2>
                <p className="text-sm text-slate-500">Solo/Dúo y Flex de cada amigo. Los que están en partida van primero.</p>
              </div>
              <div className="divide-y divide-slate-800">
                {data.ladder.map((x, i) => (
                  <div
                    key={`${x.name}#${x.tag}`}
                    className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[32px_1fr_1fr_auto] sm:items-center sm:gap-4"
                  >
                    <span
                      className={`text-lg font-black ${x.live ? "text-emerald-400" : i === 0 ? "text-amber-300" : "text-slate-500"}`}
                    >
                      {x.live ? "●" : `#${i + 1}`}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">
                        {x.name}
                        <span className="text-slate-500">#{x.tag}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {x.live
                          ? "En partida"
                          : x.lastMatchAt
                            ? `Última partida ${timeAgo(x.lastMatchAt)}`
                            : "Sin partidas recientes"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Solo/Dúo</p>
                      <RankBadge rank={x.solo} size={26} />
                    </div>
                    <div className="sm:text-right">
                      <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Flex</p>
                      <RankBadge rank={x.flex} size={26} align="right" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-lg font-bold">Amigos</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.friends.map((f) => (
                  <PlayerCard key={f.id} friend={f} onRemoved={load} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <h2 className="mr-2 text-lg font-bold">Historial de partidas</h2>
                <p className="text-sm text-slate-500">
                  {matchTotal} guardadas
                  {oldestSync ? ` · historial hasta ${timeAgo(oldestSync)}` : ""}
                </p>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <button
                    onClick={() => sync("backfill")}
                    disabled={Boolean(syncing) || loading}
                    className="rounded-xl border border-cyan-800 bg-cyan-950/40 px-4 py-2 text-sm font-semibold text-cyan-300 hover:border-cyan-500 disabled:opacity-50"
                  >
                    {syncing === "backfill" ? "Trayendo…" : "Traer +5 días"}
                  </button>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
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
                  matches.map((m) => (
                    <MatchCard key={`${m.id}-${m.friend}`} m={m} onOpen={setSelectedMatch} />
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
                    No hay partidas guardadas. Tocá <b>Actualizar partidas</b> o <b>Traer +5 días</b>.
                  </p>
                )}
              </div>

              {(hasMoreDb || allMatches.length < matchTotal) && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={loadMoreFromDb}
                    disabled={loadingMore}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold hover:border-cyan-500 disabled:opacity-50"
                  >
                    {loadingMore ? "Cargando…" : "Mostrar más del historial"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-12 border-t border-slate-900 pt-5 text-xs leading-5 text-slate-600">
          LoL Friends Tracker no está respaldado por Riot Games. League of Legends y Riot Games son marcas de Riot
          Games, Inc.
        </footer>
      </div>

      {selectedMatch && <MatchDetailModal matchId={selectedMatch} onClose={() => setSelectedMatch(null)} />}
    </main>
  );
}
