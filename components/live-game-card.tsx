"use client";

import { useEffect, useState } from "react";
import { Ban, Timer } from "lucide-react";
import type { LiveGame } from "/lib/types";
import { champIcon, spellIcon } from "/lib/ddragon";
import { formatDuration, queueName } from "/lib/format";
import { ChampAvatar, Chip, cx } from "/components/ui";

export function LiveGameCard({ game }: { game: LiveGame }) {
  const version = game.ddragonVersion;
  const bansBlue = game.bans.filter((b) => b.teamId === 100);
  const bansRed = game.bans.filter((b) => b.teamId === 200);

  // Tick the timer locally so the clock keeps moving between refreshes.
  const [elapsed, setElapsed] = useState(game.length);
  useEffect(() => {
    setElapsed(game.length);
    const start = Date.now();
    const id = setInterval(() => setElapsed(game.length + Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [game.length, game.gameId]);

  const friendsLabel = game.friendsInGame.length ? game.friendsInGame.join(" · ") : `${game.friend}#${game.tag}`;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-live/30 bg-gradient-to-br from-live/[0.07] via-transparent to-transparent shadow-glow-live">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {game.championName && (
            <ChampAvatar version={version} champion={game.championName} size={44} ring="live" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="live">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse-ring" />
                En vivo
              </Chip>
              <span className="text-xs text-fg-dim">{queueName(game.queueId)}</span>
            </div>
            <p className="mt-1 truncate font-display text-lg font-semibold tracking-tight">{friendsLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-live/25 bg-ink-950/60 px-3 py-2 font-display text-lg font-semibold tabular-nums text-live">
          <Timer size={16} />
          {formatDuration(elapsed)}
        </div>
      </div>

      {(bansBlue.length > 0 || bansRed.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.05] px-5 py-3">
          <BanRow label="Bans azul" bans={bansBlue} version={version} tone="blue" />
          <BanRow label="Bans rojo" bans={bansRed} version={version} tone="red" />
        </div>
      )}

      <div className="grid gap-3 border-t border-white/[0.05] p-4 lg:grid-cols-2">
        {game.teams.map((team) => {
          const blue = team.teamId === 100;
          return (
            <div
              key={team.teamId}
              className={cx(
                "overflow-hidden rounded-xl border",
                blue ? "border-sky-500/20 bg-sky-500/[0.05]" : "border-rose-500/20 bg-rose-500/[0.05]",
              )}
            >
              <div className={cx("flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider", blue ? "text-sky-300" : "text-rose-300")}>
                <span>Equipo {blue ? "Azul" : "Rojo"}</span>
                <span className="text-fg-dim normal-case tracking-normal">{team.participants.filter((p) => p.isFriend).length ? "con amigos" : ""}</span>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {team.participants.map((p) => (
                  <li key={p.puuid} className={cx("flex items-center gap-3 px-3 py-2", p.isFriend && "bg-live/[0.08]")}>
                    <ChampAvatar version={version} champion={p.champion} size={34} rounded="rounded-lg" ring={p.isFriend ? "live" : "none"} />
                    <div className="min-w-0 flex-1">
                      <p className={cx("truncate text-sm font-semibold", p.isFriend ? "text-live" : "text-fg")}>
                        {p.name}
                        {p.tag ? <span className="text-fg-dim">#{p.tag}</span> : null}
                      </p>
                      <p className="text-[11px] text-fg-dim">{p.champion}</p>
                    </div>
                    <div className="flex gap-1">
                      {[p.spell1Image, p.spell2Image].map((img, i) =>
                        img && version ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={spellIcon(version, img)} alt="" width={20} height={20} className="rounded-md ring-1 ring-white/10" />
                        ) : (
                          <span key={i} className="h-5 w-5 rounded-md bg-ink-700" />
                        ),
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="border-t border-white/[0.05] px-5 py-2.5 text-[11px] text-fg-dim">
        Riot no publica KDA, CS ni oro en vivo. Esos datos aparecen en el historial cuando termina la partida.
      </p>
    </article>
  );
}

function BanRow({ label, bans, version, tone }: { label: string; bans: LiveGame["bans"]; version?: string | null; tone: "blue" | "red" }) {
  if (!bans.length) return null;
  return (
    <div className="flex items-center gap-2">
      <span className={cx("flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider", tone === "blue" ? "text-sky-300/80" : "text-rose-300/80")}>
        <Ban size={12} /> {label}
      </span>
      <div className="flex gap-1">
        {bans.map((b, i) =>
          version ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${b.champion}-${i}`}
              src={champIcon(version, b.champion)}
              alt={b.champion}
              title={b.champion}
              width={24}
              height={24}
              className="rounded-md opacity-60 grayscale ring-1 ring-white/10"
            />
          ) : (
            <span key={`${b.champion}-${i}`} className="text-xs text-fg-dim">
              {b.champion}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
