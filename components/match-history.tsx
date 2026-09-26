"use client";

import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import type { Friend, Match } from "/lib/types";
import { dayKey, dayLabel, timeAgo } from "/lib/format";
import { MatchCard } from "/components/match-card";
import { Button, Card, CardHeader, EmptyState, SegmentedControl, cx } from "/components/ui";

type ResultFilter = "all" | "win" | "loss";
type QueueFilter = "all" | "ranked" | "other";

export function MatchHistory({
  matches,
  friends,
  version,
  matchTotal,
  oldestSync,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpen,
  demo,
}: {
  matches: Match[];
  friends: Friend[];
  version?: string | null;
  matchTotal: number;
  oldestSync?: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onOpen: (id: string) => void;
  demo?: boolean;
}) {
  const [friend, setFriend] = useState<string>("all");
  const [result, setResult] = useState<ResultFilter>("all");
  const [queue, setQueue] = useState<QueueFilter>("all");

  const filtered = useMemo(
    () =>
      matches.filter(
        (m) =>
          (friend === "all" || m.friend === friend) &&
          (result === "all" || (result === "win" ? m.win : !m.win)) &&
          (queue === "all" || (queue === "ranked" ? m.queueId === 420 || m.queueId === 440 : m.queueId !== 420 && m.queueId !== 440)),
      ),
    [matches, friend, result, queue],
  );

  // Group by calendar day, preserving newest-first order.
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Match[]; wins: number }[] = [];
    for (const m of filtered) {
      const key = dayKey(m.date);
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        g = { key, label: dayLabel(m.date), items: [], wins: 0 };
        out.push(g);
      }
      g.items.push(m);
      if (m.win) g.wins += 1;
    }
    return out;
  }, [filtered]);

  const wins = filtered.filter((m) => m.win).length;
  const filtersActive = friend !== "all" || result !== "all" || queue !== "all";

  return (
    <Card>
      <CardHeader
        icon={<History size={16} />}
        title="Historial de partidas"
        subtitle={
          <>
            {matchTotal} guardadas{oldestSync ? ` · desde ${timeAgo(oldestSync)}` : ""}
            {filtersActive && (
              <>
                {" "}· mostrando {filtered.length} (<span className="text-win">{wins}V</span> <span className="text-loss">{filtered.length - wins}D</span>)
              </>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-white/[0.05] px-5 py-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          <FilterPill active={friend === "all"} onClick={() => setFriend("all")}>
            Todos
          </FilterPill>
          {friends.map((f) => (
            <FilterPill key={f.id} active={friend === f.name} onClick={() => setFriend(f.name)} live={Boolean(f.live)}>
              {f.name}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <SegmentedControl
            value={queue}
            onChange={setQueue}
            accent="neutral"
            options={[
              { value: "all", label: "Todas" },
              { value: "ranked", label: "Ranked" },
              { value: "other", label: "Normal / ARAM" },
            ]}
          />
          <SegmentedControl
            value={result}
            onChange={setResult}
            accent="neutral"
            options={[
              { value: "all", label: "V + D" },
              { value: "win", label: <span className="text-win">Victorias</span> },
              { value: "loss", label: <span className="text-loss">Derrotas</span> },
            ]}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {groups.length ? (
          <div className="grid gap-5">
            {groups.map((g) => (
              <section key={g.key}>
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="font-display text-sm font-semibold text-fg-muted">{g.label}</h3>
                  <span className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[11px] tabular-nums text-fg-dim">
                    <span className="text-win">{g.wins}V</span> <span className="text-loss">{g.items.length - g.wins}D</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {g.items.map((m) => (
                    <MatchCard key={`${m.id}-${m.friend}`} m={m} version={version} onOpen={onOpen} showFriend={friend === "all"} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search size={20} />}
            title={filtersActive ? "Nada con esos filtros" : "No hay partidas guardadas"}
            hint={
              filtersActive
                ? "Probá con otro amigo o resultado."
                : demo
                  ? "En modo demo el historial es de ejemplo."
                  : "Tocá “Actualizar partidas” arriba para la carga inicial desde Riot."
            }
          />
        )}

        {hasMore && (
          <div className="mt-5 flex justify-center">
            <Button variant="ghost" onClick={onLoadMore} loading={loadingMore}>
              Mostrar más del historial
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function FilterPill({
  active,
  live,
  onClick,
  children,
}: {
  active: boolean;
  live?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
        active
          ? "border-gold-500/60 bg-gold-500/15 text-gold-300"
          : "border-ink-600/60 bg-ink-900/60 text-fg-muted hover:border-ink-500 hover:text-fg",
      )}
    >
      {live && <span className="h-1.5 w-1.5 rounded-full bg-live" />}
      {children}
    </button>
  );
}
