import type { Rank } from "/lib/types";
import { rankIcon } from "/lib/ddragon";
import { rankLabel, rankShort, TIER_COLORS, TIER_HEX } from "/lib/format";

/**
 * Ranked crest + label. `variant="stacked"` shows tier on one line and LP/record
 * underneath; `variant="inline"` keeps everything on a single line.
 */
export function RankBadge({
  rank,
  size = 28,
  showLabel = true,
  align = "left",
  variant = "inline",
  glow = false,
}: {
  rank: Rank | null;
  size?: number;
  showLabel?: boolean;
  align?: "left" | "right";
  variant?: "inline" | "stacked";
  glow?: boolean;
}) {
  const tier = rank?.tier?.toUpperCase();
  const color = tier ? TIER_COLORS[tier] || "text-fg" : "text-fg-dim";
  const hex = tier ? TIER_HEX[tier] : undefined;
  const src = rankIcon(rank?.tier);

  return (
    <div className={`flex items-center gap-2.5 ${align === "right" ? "justify-end text-right" : ""}`}>
      <span
        className="relative grid shrink-0 place-items-center rounded-full"
        style={{
          width: size + 10,
          height: size + 10,
          background: hex ? `radial-gradient(circle, ${hex}22 0%, transparent 70%)` : undefined,
          boxShadow: glow && hex ? `0 0 18px -4px ${hex}aa` : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={rank?.tier || "Unranked"} width={size} height={size} loading="lazy" className="shrink-0 drop-shadow" />
      </span>
      {showLabel &&
        (variant === "stacked" ? (
          <div className="min-w-0 leading-tight">
            <p className={`truncate text-sm font-bold ${color}`}>{rankShort(rank)}</p>
            <p className="truncate text-[11px] text-fg-dim">
              {rank ? (
                <>
                  <span className="font-semibold text-fg-muted">{rank.lp} LP</span>
                  <span className="mx-1">·</span>
                  <span className="whitespace-nowrap">
                    {rank.wins}V {rank.losses}D
                  </span>
                </>
              ) : (
                "Sin partidas ranked"
              )}
            </p>
          </div>
        ) : (
          <span className={`text-sm font-semibold ${color}`}>{rankLabel(rank)}</span>
        ))}
    </div>
  );
}
