import type { Friend } from "/lib/types";
import { kdaColor, kdaLabel, rankLabel, TIER_COLORS } from "/lib/format";

export function PlayerCard({ friend }: { friend: Friend }) {
  const matches = [...friend.matches].sort((a, b) => b.date - a.date);
  const games = matches.length;
  const wins = matches.filter((m) => m.win).length;
  const winRate = games ? Math.round((wins / games) * 100) : 0;
  const k = matches.reduce((s, m) => s + m.kills, 0);
  const d = matches.reduce((s, m) => s + m.deaths, 0);
  const a = matches.reduce((s, m) => s + m.assists, 0);
  const ratio = d ? (k + a) / d : k + a;

  const champCount = new Map<string, number>();
  for (const m of matches) champCount.set(m.champion, (champCount.get(m.champion) || 0) + 1);
  const fav = [...champCount.entries()].sort((x, y) => y[1] - x[1])[0];

  const form = matches.slice(0, 5);
  const tierColor = friend.rank ? TIER_COLORS[friend.rank.tier?.toUpperCase()] || "text-slate-300" : "text-slate-500";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-lg font-bold">
            {friend.name}
            {friend.rank?.hotStreak && (
              <span title="Racha de victorias" className="text-orange-400">
                🔥
              </span>
            )}
          </p>
          <p className="truncate text-xs text-slate-500">#{friend.tag}</p>
        </div>
        <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-sm font-bold text-cyan-400">{winRate}%</span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Clasificatoria</p>
        <p className={`font-semibold ${tierColor}`}>{rankLabel(friend.rank)}</p>
        {friend.rank && (
          <p className="text-xs text-slate-500">
            {friend.rank.wins}V {friend.rank.losses}D · {friend.rank.winRate}% WR
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">KDA reciente</p>
          <p className={`font-bold ${kdaColor(ratio)}`}>{kdaLabel(k, d, a)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Main reciente</p>
          <p className="truncate font-semibold text-slate-200">{fav ? `${fav[0]} (${fav[1]})` : "—"}</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-500">Forma ({form.length} últimas)</p>
        <div className="flex gap-1.5">
          {form.length ? (
            form.map((m, i) => (
              <span
                key={`${m.id}-${i}`}
                title={`${m.champion} · ${m.win ? "Victoria" : "Derrota"}`}
                className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
                  m.win ? "bg-cyan-500/20 text-cyan-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {m.win ? "V" : "D"}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-600">Sin partidas recientes</span>
          )}
        </div>
      </div>

      {friend.error && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-2.5 py-1.5 text-xs text-amber-300">
          No se pudieron cargar datos ({friend.error})
        </p>
      )}
    </article>
  );
}
