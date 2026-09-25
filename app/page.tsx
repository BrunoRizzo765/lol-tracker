"use client";

import { useEffect, useMemo, useState } from "react";

type Match = { id: string; date: number; duration: number; queueId: number; mode: string; champion: string; kills: number; deaths: number; assists: number; win: boolean; cs: number; level: number; gold: number; friend: string };
type Rank = { queue: string; tier: string; division: string; lp: number; wins: number; losses: number; winRate: number; hotStreak: boolean };
type Friend = { id: string; name: string; tag: string; rank: Rank | null; matches: Match[]; error?: string };
type LadderEntry = { name: string; tag: string; rank: Rank | null; score: number };
type Dashboard = { friends: Friend[]; recent: Match[]; ranking: { name: string; tag: string; games: number; wins: number; losses: number; winRate: number; kda: number }[]; ladder: LadderEntry[] };

const queueName = (id: number) => ({ 420: "Ranked Solo", 440: "Ranked Flex", 450: "ARAM", 490: "Quickplay", 1700: "Arena", 1710: "Arena" } as Record<number, string>)[id] || "League of Legends";
const TIER_COLORS: Record<string, string> = { CHALLENGER: "text-amber-300", GRANDMASTER: "text-red-400", MASTER: "text-fuchsia-400", DIAMOND: "text-sky-300", EMERALD: "text-emerald-400", PLATINUM: "text-teal-300", GOLD: "text-yellow-400", SILVER: "text-slate-300", BRONZE: "text-orange-400", IRON: "text-slate-500" };
const rankLabel = (r: Rank | null) => !r ? "Sin clasificar" : ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(r.tier?.toUpperCase()) ? `${cap(r.tier)} ${r.lp} LP` : `${cap(r.tier)} ${r.division} · ${r.lp} LP`;
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const queueLabel = (q: string) => q === "RANKED_SOLO_5x5" ? "Solo/Dúo" : q === "RANKED_FLEX_SR" ? "Flex" : q;
const timeAgo = (timestamp: number) => { const diff = Math.max(0, Date.now() - timestamp); const m = Math.floor(diff / 60000); if (m < 60) return `hace ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`; return `hace ${Math.floor(h / 24)} d`; };

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Todos");

  async function load() {
    setLoading(true); setError("");
    try { const r = await fetch("/api/dashboard", { cache: "no-store" }); const json = await r.json(); if (!r.ok) throw new Error(json.error || "Error"); setData(json); }
    catch (e) { setError(e instanceof Error ? e.message : "Error cargando datos"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const matches = useMemo(() => data?.recent.filter((m) => filter === "Todos" || m.friend === filter) || [], [data, filter]);
  const total = data?.ranking.reduce((s, x) => s + x.games, 0) || 0;
  const wins = data?.ranking.reduce((s, x) => s + x.wins, 0) || 0;

  return <main className="min-h-screen px-5 py-8 md:px-10 lg:px-16">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">League of Legends</p><h1 className="text-4xl font-black tracking-tight md:text-6xl">Friends <span className="text-cyan-400">Tracker</span></h1><p className="mt-3 text-slate-400">Últimas partidas, estadísticas y ranking de tu grupo.</p></div>
        <button onClick={load} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold hover:border-cyan-500">↻ Actualizar</button>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">{error}. Revisá <code>RIOT_API_KEY</code> y <code>FRIENDS</code>.</div>}
      {loading && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">Cargando partidas…</div>}
      {!loading && data && <>
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <Stat title="Amigos" value={data.friends.length}/><Stat title="Partidas cargadas" value={total}/><Stat title="Win rate grupo" value={`${total ? Math.round(wins / total * 100) : 0}%`}/>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-5 py-4"><h2 className="text-lg font-bold">Ranking clasificatorio</h2><p className="text-sm text-slate-500">Elo actual de cada amigo (Solo/Dúo, o Flex si no juega Solo).</p></div>
          <div className="divide-y divide-slate-800">{data.ladder.map((x, i) => <div key={`${x.name}#${x.tag}`} className="grid grid-cols-[40px_1fr_auto] items-center gap-4 px-5 py-4"><span className="text-xl font-black text-slate-500">#{i + 1}</span><div className="min-w-0"><p className="flex items-center gap-2 font-bold">{x.name}{x.rank?.hotStreak && <span title="Racha de victorias" className="text-orange-400">🔥</span>}</p><p className={`text-sm font-semibold ${x.rank ? TIER_COLORS[x.rank.tier?.toUpperCase()] || "text-slate-300" : "text-slate-500"}`}>{rankLabel(x.rank)}</p></div><div className="text-right">{x.rank ? <><p className="font-bold text-cyan-400">{x.rank.winRate}%</p><p className="text-xs text-slate-500">{x.rank.wins}V {x.rank.losses}D · {queueLabel(x.rank.queue)}</p></> : <p className="text-xs text-slate-600">—</p>}</div></div>)}</div>
        </section>

        <section><div className="mb-4 flex flex-wrap items-center gap-2"><h2 className="mr-2 text-lg font-bold">Últimas partidas</h2><button onClick={() => setFilter("Todos")} className={`rounded-lg px-3 py-1.5 text-sm ${filter === "Todos" ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-400"}`}>Todos</button>{data.friends.map(f => <button key={f.id} onClick={() => setFilter(f.name)} className={`rounded-lg px-3 py-1.5 text-sm ${filter === f.name ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-400"}`}>{f.name}</button>)}</div>
          <div className="grid gap-3">{matches.map(m => <MatchCard key={`${m.id}-${m.friend}`} m={m}/>)}</div>
        </section>
      </>}
      <footer className="mt-12 border-t border-slate-900 pt-5 text-xs leading-5 text-slate-600">LoL Friends Tracker no está respaldado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.</footer>
    </div>
  </main>;
}

function Stat({ title, value }: { title: string; value: string | number }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-3xl font-black">{value}</p></div>; }
function MatchCard({ m }: { m: Match }) { return <article className={`grid gap-4 rounded-2xl border p-4 md:grid-cols-[90px_1fr_auto] md:items-center ${m.win ? "border-cyan-950 bg-cyan-950/20" : "border-red-950 bg-red-950/20"}`}><div><p className={`font-black ${m.win ? "text-cyan-400" : "text-red-400"}`}>{m.win ? "VICTORIA" : "DERROTA"}</p><p className="text-xs text-slate-500">{timeAgo(m.date)}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{m.friend}</span><span className="text-slate-600">·</span><span className="text-sm text-slate-400">{queueName(m.queueId)}</span><span className="text-slate-600">·</span><span className="text-sm text-slate-500">{Math.floor(m.duration / 60)}:{String(m.duration % 60).padStart(2,"0")}</span></div><p className="mt-2 text-slate-300"><b>{m.champion}</b> <span className="text-slate-500">·</span> {m.kills}/{m.deaths}/{m.assists} <span className="ml-2 text-slate-500">KDA {m.deaths ? ((m.kills + m.assists) / m.deaths).toFixed(2) : "Perfect"}</span></p></div><div className="text-left text-sm text-slate-400 md:text-right"><p>{m.cs} CS</p><p>{m.gold.toLocaleString()} gold</p></div></article>; }
