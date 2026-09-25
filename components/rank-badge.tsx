import type { Rank } from "/lib/types";
import { rankIcon } from "/lib/ddragon";
import { rankLabel, TIER_COLORS } from "/lib/format";

export function RankBadge({
  rank,
  size = 28,
  showLabel = true,
  align = "left",
}: {
  rank: Rank | null;
  size?: number;
  showLabel?: boolean;
  align?: "left" | "right";
}) {
  const tier = rank?.tier?.toUpperCase();
  const color = tier ? TIER_COLORS[tier] || "text-slate-300" : "text-slate-600";
  const src = rankIcon(rank?.tier);

  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
      <img
        src={src}
        alt={rank?.tier || "Unranked"}
        width={size}
        height={size}
        className="shrink-0"
        loading="lazy"
      />
      {showLabel && <span className={`text-sm font-semibold ${color}`}>{rankLabel(rank)}</span>}
    </div>
  );
}
