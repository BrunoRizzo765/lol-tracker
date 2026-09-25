import type { Rank } from "/lib/types";

export const queueName = (id: number) =>
  (({ 420: "Ranked Solo", 440: "Ranked Flex", 450: "ARAM", 490: "Quickplay", 400: "Normal Draft", 430: "Normal Blind", 700: "Clash", 1700: "Arena", 1710: "Arena" }) as Record<number, string>)[id] || "League of Legends";

export const TIER_COLORS: Record<string, string> = {
  CHALLENGER: "text-amber-300",
  GRANDMASTER: "text-red-400",
  MASTER: "text-fuchsia-400",
  DIAMOND: "text-sky-300",
  EMERALD: "text-emerald-400",
  PLATINUM: "text-teal-300",
  GOLD: "text-yellow-400",
  SILVER: "text-slate-300",
  BRONZE: "text-orange-400",
  IRON: "text-slate-500",
};

export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export const rankLabel = (r: Rank | null) =>
  !r
    ? "Sin clasificar"
    : ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(r.tier?.toUpperCase())
      ? `${cap(r.tier)} ${r.lp} LP`
      : `${cap(r.tier)} ${r.division} · ${r.lp} LP`;

export const queueLabel = (q: string) => (q === "RANKED_SOLO_5x5" ? "Solo/Dúo" : q === "RANKED_FLEX_SR" ? "Flex" : q);

export const timeAgo = (timestamp: number) => {
  const diff = Math.max(0, Date.now() - timestamp);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

export const kda = (k: number, d: number, a: number) => (d ? (k + a) / d : k + a);

export const kdaLabel = (k: number, d: number, a: number) => (d ? ((k + a) / d).toFixed(2) : "Perfect");

export const kdaColor = (ratio: number) =>
  ratio >= 5 ? "text-amber-300" : ratio >= 3 ? "text-cyan-400" : ratio >= 2 ? "text-emerald-400" : "text-slate-300";

export const csPerMin = (cs: number, duration: number) => (duration ? cs / (duration / 60) : 0);
