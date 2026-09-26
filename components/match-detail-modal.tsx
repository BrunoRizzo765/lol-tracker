"use client";

import { useEffect, useState } from "react";
import { Coins, Swords, X } from "lucide-react";
import type { MatchDetail, MatchDetailParticipant } from "/lib/types";
import { itemIcon } from "/lib/ddragon";
import { compactNumber, formatDuration, kda, kdaColor, kdaLabel, queueName, timeAgo } from "/lib/format";
import { Button, ChampAvatar, Skeleton, cx } from "/components/ui";

export function MatchDetailModal({
  matchId,
  onClose,
  friendNames = [],
}: {
  matchId: string;
  onClose: () => void;
  friendNames?: string[];
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const version = data?.ddragonVersion;
  const friendSet = new Set(friendNames.map((n) => n.toLowerCase()));
  const maxGold = data ? Math.max(...data.teams.flatMap((t) => t.participants.map((p) => p.gold)), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de partida"
        className="card max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-b-none sm:rounded-b-[1.25rem] animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-900/90 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-400">Scoreboard</p>
            {data ? (
              <p className="truncate text-sm text-fg-muted">
                {queueName(data.queueId)} · {formatDuration(data.duration)} · {timeAgo(data.date)}
              </p>
            ) : (
              <Skeleton className="mt-1 h-4 w-48" />
            )}
          </div>
          <Button variant="subtle" size="sm" onClick={onClose} icon={<X size={14} />}>
            Cerrar
          </Button>
        </div>

        <div className="p-4 sm:p-5">
          {loading && (
            <div className="grid gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="grid gap-2">
                  <Skeleton className="h-10 w-full" />
                  {[0, 1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              ))}
            </div>
          )}
          {error && <p className="rounded-xl border border-loss/30 bg-loss-deep/50 p-4 text-sm text-fg">{error}</p>}
          {data && (
            <div className="grid gap-4">
              {data.teams.map((team) => {
                const blue = team.teamId === 100;
                return (
                  <div key={team.teamId} className="overflow-hidden rounded-xl border border-white/[0.07]">
                    <div
                      className={cx(
                        "flex flex-wrap items-center justify-between gap-2 px-4 py-2.5",
                        team.win ? "bg-win/[0.12]" : "bg-loss/[0.10]",
                      )}
                    >
                      <p className="flex items-center gap-2 text-sm">
                        <span className={cx("font-bold uppercase tracking-wider", team.win ? "text-win" : "text-loss")}>
                          {team.win ? "Victoria" : "Derrota"}
                        </span>
                        <span className="text-fg-dim">·</span>
                        <span className={cx("font-semibold", blue ? "text-sky-300" : "text-rose-300")}>Equipo {blue ? "Azul" : "Rojo"}</span>
                      </p>
                      <p className="flex items-center gap-3 text-xs text-fg-muted">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Swords size={12} /> {team.kills}/{team.deaths}/{team.assists}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Coins size={12} /> {compactNumber(team.gold)}
                        </span>
                      </p>
                    </div>
                    <ul className="divide-y divide-white/[0.05]">
                      {team.participants.map((p) => (
                        <ParticipantRow
                          key={p.puuid}
                          p={p}
                          version={version}
                          isFriend={friendSet.has((p.name || "").toLowerCase())}
                          goldShare={p.gold / maxGold}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticipantRow({
  p,
  version,
  isFriend,
  goldShare,
}: {
  p: MatchDetailParticipant;
  version?: string | null;
  isFriend: boolean;
  goldShare: number;
}) {
  const ratio = kda(p.kills, p.deaths, p.assists);
  return (
    <li className={cx("grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:px-4", isFriend && "bg-gold-500/[0.07]")}>
      <ChampAvatar version={version} champion={p.champion} size={38} level={p.level} rounded="rounded-lg" ring={isFriend ? "gold" : "none"} />
      <div className="min-w-0">
        <p className={cx("truncate text-sm font-semibold", isFriend ? "text-gold-300" : "text-fg")}>
          {p.name || p.champion}
          {p.tag ? <span className="text-fg-dim">#{p.tag}</span> : null}
        </p>
        <p className="truncate text-[11px] text-fg-dim">{p.champion}</p>
      </div>
      <div className="text-right sm:w-24">
        <p className="text-sm tabular-nums text-fg">
          {p.kills}<span className="text-fg-dim">/</span><span className="text-loss">{p.deaths}</span><span className="text-fg-dim">/</span>{p.assists}
        </p>
        <p className={cx("text-[11px] font-semibold", kdaColor(ratio))}>{kdaLabel(p.kills, p.deaths, p.assists)}</p>
      </div>
      <div className="col-span-3 flex gap-0.5 sm:col-span-1">
        {p.items.map((item, i) =>
          item && version ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${p.puuid}-item-${i}`} src={itemIcon(version, item)} alt="" width={24} height={24} className="rounded-md bg-ink-800 ring-1 ring-white/10" />
          ) : (
            <span key={`${p.puuid}-item-${i}`} className="h-6 w-6 rounded-md bg-ink-800/80 ring-1 ring-white/5" />
          ),
        )}
      </div>
      <div className="hidden w-24 text-right text-[11px] text-fg-dim sm:block">
        <p className="tabular-nums">{p.cs} CS</p>
        <div className="mt-1 flex items-center justify-end gap-1.5">
          <span className="h-1 w-12 overflow-hidden rounded-full bg-gold-500/15">
            <span className="block h-full rounded-full bg-gold-500" style={{ width: `${Math.round(goldShare * 100)}%` }} />
          </span>
          <span className="tabular-nums">{compactNumber(p.gold)}</span>
        </div>
      </div>
    </li>
  );
}
