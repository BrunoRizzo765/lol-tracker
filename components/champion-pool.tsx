import { Swords } from "lucide-react";
import type { Friend } from "/lib/types";
import { kdaColor, kdaLabel } from "/lib/format";
import { Card, CardHeader, ChampAvatar, Meter } from "/components/ui";

type Agg = { champion: string; games: number; wins: number; k: number; d: number; a: number; players: Set<string> };

export function ChampionPool({ friends, version }: { friends: Friend[]; version?: string | null }) {
  const map = new Map<string, Agg>();
  for (const f of friends) {
    for (const m of f.matches) {
      const cur = map.get(m.champion) || { champion: m.champion, games: 0, wins: 0, k: 0, d: 0, a: 0, players: new Set<string>() };
      cur.games += 1;
      cur.wins += m.win ? 1 : 0;
      cur.k += m.kills;
      cur.d += m.deaths;
      cur.a += m.assists;
      cur.players.add(f.name);
      map.set(m.champion, cur);
    }
  }
  const rows = [...map.values()].sort((x, y) => y.games - x.games || y.wins / y.games - x.wins / x.games).slice(0, 6);

  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader icon={<Swords size={16} />} title="Campeones del grupo" subtitle="Los más jugados en las últimas partidas cargadas." />
      <ul className="divide-y divide-white/[0.05]">
        {rows.map((r) => {
          const wr = Math.round((r.wins / r.games) * 100);
          const ratio = r.d ? (r.k + r.a) / r.d : r.k + r.a;
          return (
            <li key={r.champion} className="flex items-center gap-3 px-5 py-2.5">
              <ChampAvatar version={version} champion={r.champion} size={36} rounded="rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-fg">{r.champion}</p>
                  <p className="shrink-0 text-xs font-semibold text-fg-muted">{wr}%</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Meter value={wr} tone={wr >= 50 ? "win" : "loss"} className="max-w-[120px]" />
                  <p className="truncate text-[11px] text-fg-dim">
                    {r.games} {r.games === 1 ? "partida" : "partidas"} · <span className={kdaColor(ratio)}>KDA {kdaLabel(r.k, r.d, r.a)}</span>
                    {r.players.size > 1 ? ` · ${r.players.size} jugadores` : ` · ${[...r.players][0]}`}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
