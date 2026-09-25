import type { Friend } from "/lib/types";
import { kdaColor, kdaLabel } from "/lib/format";

type Agg = { champion: string; games: number; wins: number; k: number; d: number; a: number };

export function ChampionPool({ friends }: { friends: Friend[] }) {
  const map = new Map<string, Agg>();
  for (const f of friends) {
    for (const m of f.matches) {
      const cur = map.get(m.champion) || { champion: m.champion, games: 0, wins: 0, k: 0, d: 0, a: 0 };
      cur.games += 1;
      cur.wins += m.win ? 1 : 0;
      cur.k += m.kills;
      cur.d += m.deaths;
      cur.a += m.assists;
      map.set(m.champion, cur);
    }
  }
  const rows = [...map.values()].sort((x, y) => y.games - x.games || y.wins / y.games - x.wins / x.games).slice(0, 8);

  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-lg font-bold">Campeones más jugados</h2>
        <p className="text-sm text-slate-500">Del grupo, en las partidas recientes cargadas.</p>
      </div>
      <div className="divide-y divide-slate-800">
        {rows.map((r) => {
          const wr = Math.round((r.wins / r.games) * 100);
          const ratio = r.d ? (r.k + r.a) / r.d : r.k + r.a;
          return (
            <div key={r.champion} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-200">{r.champion}</p>
                <p className="text-xs text-slate-500">
                  {r.games} {r.games === 1 ? "partida" : "partidas"} ·{" "}
                  <span className={kdaColor(ratio)}>KDA {kdaLabel(r.k, r.d, r.a)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-800 sm:block">
                  <div className={wr >= 50 ? "h-full bg-cyan-400" : "h-full bg-red-400"} style={{ width: `${wr}%` }} />
                </div>
                <span className={`w-10 font-bold ${wr >= 50 ? "text-cyan-400" : "text-red-400"}`}>{wr}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
