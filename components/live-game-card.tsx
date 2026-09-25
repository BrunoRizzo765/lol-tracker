"use client";

import type { LiveGame } from "/lib/types";
import { champIcon, spellIcon } from "/lib/ddragon";
import { formatDuration, queueName } from "/lib/format";

export function LiveGameCard({ game }: { game: LiveGame }) {
  const version = game.ddragonVersion;
  const bansBlue = game.bans.filter((b) => b.teamId === 100);
  const bansRed = game.bans.filter((b) => b.teamId === 200);

  return (
    <article className="border-b border-slate-800 px-5 py-5 last:border-b-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-400">En partida</p>
          <p className="mt-1 text-lg font-bold">
            {game.friendsInGame.length
              ? game.friendsInGame.join(" · ")
              : `${game.friend}#${game.tag}`}
          </p>
          <p className="text-sm text-slate-400">
            {queueName(game.queueId)} · {game.championName || "—"}
          </p>
        </div>
        <p className="rounded-lg bg-emerald-950/50 px-3 py-1.5 text-sm font-bold text-emerald-300">
          {formatDuration(game.length)}
        </p>
      </div>

      {(bansBlue.length > 0 || bansRed.length > 0) && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <BanRow label="Bans azul" bans={bansBlue} version={version} />
          <BanRow label="Bans rojo" bans={bansRed} version={version} />
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {game.teams.map((team) => (
          <div
            key={team.teamId}
            className={`overflow-hidden rounded-xl border ${
              team.teamId === 100 ? "border-sky-900/60 bg-sky-950/20" : "border-red-900/60 bg-red-950/20"
            }`}
          >
            <div
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                team.teamId === 100 ? "text-sky-300" : "text-red-300"
              }`}
            >
              Equipo {team.teamId === 100 ? "Azul" : "Rojo"}
            </div>
            <div className="divide-y divide-slate-800/80">
              {team.participants.map((p) => (
                <div
                  key={p.puuid}
                  className={`flex items-center gap-3 px-3 py-2 ${p.isFriend ? "bg-emerald-500/10" : ""}`}
                >
                  {version ? (
                    <img
                      src={champIcon(version, p.champion)}
                      alt={p.champion}
                      width={36}
                      height={36}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-slate-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${p.isFriend ? "text-emerald-300" : ""}`}>
                      {p.name}
                      {p.tag ? <span className="text-slate-500">#{p.tag}</span> : null}
                      {p.isFriend && <span className="ml-2 text-[10px] uppercase text-emerald-500">amigo</span>}
                    </p>
                    <p className="text-xs text-slate-500">{p.champion}</p>
                  </div>
                  <div className="flex gap-1">
                    {p.spell1Image && version && (
                      <img
                        src={spellIcon(version, p.spell1Image)}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-sm"
                      />
                    )}
                    {p.spell2Image && version && (
                      <img
                        src={spellIcon(version, p.spell2Image)}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-600">
        Riot no publica KDA/CS/oro en vivo por Spectator. Eso solo aparece al terminar la partida.
      </p>
    </article>
  );
}

function BanRow({
  label,
  bans,
  version,
}: {
  label: string;
  bans: LiveGame["bans"];
  version?: string | null;
}) {
  if (!bans.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      {bans.map((b, i) =>
        version ? (
          <img
            key={`${b.champion}-${i}`}
            src={champIcon(version, b.champion)}
            alt={b.champion}
            title={b.champion}
            width={24}
            height={24}
            className="rounded-sm opacity-70 grayscale"
          />
        ) : (
          <span key={`${b.champion}-${i}`} className="text-xs text-slate-500">
            {b.champion}
          </span>
        ),
      )}
    </div>
  );
}
