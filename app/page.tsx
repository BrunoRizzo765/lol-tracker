"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Radio, Trophy } from "lucide-react";
import type { Dashboard, Match } from "/lib/types";
import { AddFriendForm } from "/components/add-friend-form";
import { ChampionPool } from "/components/champion-pool";
import { LiveGameCard } from "/components/live-game-card";
import { MatchDetailModal } from "/components/match-detail-modal";
import { MatchHistory } from "/components/match-history";
import { PlayerCard } from "/components/player-card";
import { StatsStrip } from "/components/stats-strip";
import { Toasts, type Toast } from "/components/toast";
import { TopBar } from "/components/top-bar";
import { Card, CardHeader, EmptyState, Skeleton } from "/components/ui";

const LIVE_REFRESH_MS = 60_000;

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [extraMatches, setExtraMatches] = useState<Match[]>([]);
  const [hasMoreDb, setHasMoreDb] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const pushToast = useCallback((tone: Toast["tone"], text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError("");
    try {
      const r = await fetch("/api/matches/sync", { method: "POST" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Error sincronizando");
      const hint =
        json.full > 0
          ? `carga completa para ${json.full} amigo${json.full === 1 ? "" : "s"}`
          : "solo partidas nuevas";
      pushToast("success", `Listo (${hint}): ${json.inserted} nuevas de ${json.fetched} encontradas.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error sincronizando");
    } finally {
      setSyncing(false);
    }
  }, [load, pushToast]);

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
      const incoming = (json.matches as Match[]).filter((m) => !all.some((x) => x.id === m.id && x.friend === m.friend));
      setExtraMatches((prev) => [...prev, ...incoming]);
      setHasMoreDb(Boolean(json.hasMore) && incoming.length > 0);
    } catch (e) {
      pushToast("error", e instanceof Error ? e.message : "Error cargando más");
    } finally {
      setLoadingMore(false);
    }
  }

  // Initial load; if the DB is empty, do the first full sync automatically.
  useEffect(() => {
    (async () => {
      const dash = await load();
      if (dash && !dash.demo && (dash.matchTotal ?? 0) === 0) await sync();
    })();
  }, [load, sync]);

  // Keep live games + ranks fresh while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && !syncing) load(true);
    }, LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, [load, syncing]);

  const allMatches = useMemo(() => [...(data?.recent || []), ...extraMatches], [data, extraMatches]);

  // Friends in ladder order (live first, then by rank).
  const orderedFriends = useMemo(() => {
    if (!data) return [];
    const byKey = new Map(data.friends.map((f) => [`${f.name}#${f.tag}`, f]));
    const ordered = data.ladder.map((l) => byKey.get(`${l.name}#${l.tag}`)).filter((f): f is NonNullable<typeof f> => Boolean(f));
    const seen = new Set(ordered.map((f) => f.id));
    return [...ordered, ...data.friends.filter((f) => !seen.has(f.id))];
  }, [data]);

  const liveCount = data?.live?.length ?? 0;
  const matchTotal = data?.matchTotal ?? allMatches.length;
  const oldestSync = data?.friends
    .map((f) => f.syncedOldest)
    .filter((x): x is number => typeof x === "number")
    .sort((a, b) => a - b)[0];
  const demoReason = data?.demo?.reason ?? null;

  return (
    <>
      <TopBar
        syncing={syncing}
        loading={loading}
        onSync={sync}
        onReload={() => load()}
        updatedAt={updatedAt}
        liveCount={liveCount}
        demo={demoReason}
      />

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-400">League of Legends</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              El grupo, <span className="text-gradient-gold">en una sola pantalla</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-fg-muted">
              Quién está en partida, el rango de cada uno y el historial guardado del grupo.
            </p>
          </div>
        </div>

        {demoReason && (
          <div className="mb-6 flex flex-col gap-1 rounded-2xl border border-gold-500/30 bg-gold-500/[0.07] px-5 py-4 text-sm animate-fade-up sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gold-300">Modo demo · estás viendo datos de ejemplo</p>
              <p className="mt-0.5 text-fg-muted">
                {demoReason}. Copiá <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-fg">.env.example</code> a{" "}
                <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-fg">.env.local</code>, completá tu key de{" "}
                <a className="underline decoration-gold-500/50 underline-offset-2 hover:text-gold-300" href="https://developer.riotgames.com" target="_blank" rel="noreferrer">
                  developer.riotgames.com
                </a>{" "}
                y levantá Postgres con <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-fg">docker compose up -d</code>.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-loss/30 bg-loss-deep/50 px-5 py-4 text-sm animate-fade-up">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-loss" />
            <div>
              <p className="font-semibold text-fg">{error}</p>
              {error.includes("RIOT_API_KEY") && (
                <p className="mt-1 text-fg-muted">
                  Abrí <code>.env.local</code>, poné tu key de{" "}
                  <a className="underline" href="https://developer.riotgames.com" target="_blank" rel="noreferrer">
                    developer.riotgames.com
                  </a>{" "}
                  y reiniciá el servidor.
                </p>
              )}
            </div>
          </div>
        )}

        {loading && !data ? (
          <LoadingSkeleton />
        ) : data ? (
          <div className="grid gap-6">
            <StatsStrip friends={data.friends} liveCount={liveCount} matchTotal={matchTotal} recent={allMatches} oldestSync={oldestSync} />

            {/* Live games — full width, only when someone is playing */}
            {liveCount > 0 && (
              <section className="grid gap-4 animate-fade-up">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h2 className="flex items-center gap-2 whitespace-nowrap font-display text-base font-semibold tracking-tight">
                    <Radio size={16} className="text-live" />
                    Jugando ahora
                  </h2>
                  <span className="text-sm text-fg-dim">
                    {liveCount} partida{liveCount === 1 ? "" : "s"} en curso · equipos, bans y hechizos
                  </span>
                </div>
                {data.live.map((g) => (
                  <LiveGameCard key={g.gameId} game={g} />
                ))}
              </section>
            )}

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Sidebar: players + add + champions */}
              <aside className="grid content-start gap-6 lg:col-span-5 xl:col-span-4">
                <Card className="animate-fade-up">
                  <CardHeader
                    icon={<Trophy size={16} />}
                    title="Jugadores"
                    subtitle="Ordenados por rango. Los que están en partida van primero."
                  />
                  {orderedFriends.length ? (
                    <div className="divide-y divide-white/[0.05]">
                      {orderedFriends.map((f, i) => (
                        <PlayerCard key={f.id} friend={f} position={i + 1} version={data.ddragonVersion} onRemoved={() => load()} canRemove={!demoReason} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Todavía no hay amigos" hint="Agregá el primero con su Riot ID." />
                  )}
                  <div className="border-t border-white/[0.06] bg-ink-950/30">
                    <AddFriendForm
                      disabled={Boolean(demoReason)}
                      disabledHint="Configurá la API key y la base para agregar amigos reales."
                      onAdded={async () => {
                        await load();
                        await sync();
                      }}
                    />
                  </div>
                </Card>

                <div className="animate-fade-up">
                  <ChampionPool friends={data.friends} version={data.ddragonVersion} />
                </div>
              </aside>

              {/* Main: history */}
              <div className="lg:col-span-7 xl:col-span-8 animate-fade-up">
                <MatchHistory
                  matches={allMatches}
                  friends={orderedFriends}
                  version={data.ddragonVersion}
                  matchTotal={matchTotal}
                  oldestSync={oldestSync}
                  hasMore={hasMoreDb || allMatches.length < matchTotal}
                  loadingMore={loadingMore}
                  onLoadMore={loadMoreFromDb}
                  onOpen={setSelectedMatch}
                  demo={Boolean(demoReason)}
                />
              </div>
            </div>
          </div>
        ) : null}

        <footer className="mt-14 border-t border-white/[0.06] pt-5 text-xs leading-5 text-fg-dim">
          LoL Friends Tracker no está respaldado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.
        </footer>
      </main>

      {selectedMatch && (
        <MatchDetailModal
          matchId={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          friendNames={data?.friends.map((f) => f.name) ?? []}
        />
      )}
      <Toasts items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6" aria-busy>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[92px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="grid gap-6 lg:col-span-5 xl:col-span-4">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[260px]" />
        </div>
        <div className="lg:col-span-7 xl:col-span-8">
          <Skeleton className="h-[820px]" />
        </div>
      </div>
    </div>
  );
}
