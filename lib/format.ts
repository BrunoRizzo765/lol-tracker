import type { Rank } from "/lib/types";

export const queueName = (id: number) =>
  (({ 420: "Ranked Solo", 440: "Ranked Flex", 450: "ARAM", 490: "Quickplay", 400: "Normal Draft", 430: "Normal Blind", 700: "Clash", 1700: "Arena", 1710: "Arena" }) as Record<number, string>)[id] || "League of Legends";

export const isRankedQueue = (id: number) => id === 420 || id === 440;

/** Short label for a platform shard, e.g. "euw1" → "EUW". */
export const platformLabel = (platform?: string | null) =>
  platform
    ? (
        ({
          la1: "LAN", la2: "LAS", br1: "BR", na1: "NA",
          euw1: "EUW", eun1: "EUNE", tr1: "TR", ru: "RU", me1: "ME",
          kr: "KR", jp1: "JP",
          oc1: "OCE", sg2: "SEA", tw2: "TW", vn2: "VN",
        }) as Record<string, string>
      )[platform.toLowerCase()] || platform.toUpperCase()
    : "";

/** Tailwind text classes per tier. */
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

/** Raw hex per tier, for glows and rings. */
export const TIER_HEX: Record<string, string> = {
  CHALLENGER: "#fcd34d",
  GRANDMASTER: "#f87171",
  MASTER: "#e879f9",
  DIAMOND: "#7dd3fc",
  EMERALD: "#34d399",
  PLATINUM: "#5eead4",
  GOLD: "#facc15",
  SILVER: "#cbd5e1",
  BRONZE: "#fb923c",
  IRON: "#64748b",
};

export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

const APEX = ["MASTER", "GRANDMASTER", "CHALLENGER"];

export const rankLabel = (r: Rank | null) =>
  !r
    ? "Sin clasificar"
    : APEX.includes(r.tier?.toUpperCase())
      ? `${cap(r.tier)} ${r.lp} LP`
      : `${cap(r.tier)} ${r.division} · ${r.lp} LP`;

/** Tier + division only, e.g. "Diamond II" or "Master". */
export const rankShort = (r: Rank | null) =>
  !r ? "Unranked" : APEX.includes(r.tier?.toUpperCase()) ? cap(r.tier) : `${cap(r.tier)} ${r.division}`;

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const queueLabel = (q: string) => (q === "RANKED_SOLO_5x5" ? "Solo/Dúo" : q === "RANKED_FLEX_SR" ? "Flex" : q);

export const timeAgo = (timestamp: number) => {
  const diff = Math.max(0, Date.now() - timestamp);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return `hace ${Math.floor(d / 30)} mes${Math.floor(d / 30) === 1 ? "" : "es"}`;
};

/** "Hoy", "Ayer" or "lun 22 sep" — for grouping the history by day. */
export const dayLabel = (timestamp: number) => {
  const d = new Date(timestamp);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  const label = d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  return label.replace(/\./g, "");
};

export const dayKey = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export const compactNumber = (n: number) =>
  n >= 10_000 ? `${(n / 1000).toFixed(0)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export const kda = (k: number, d: number, a: number) => (d ? (k + a) / d : k + a);

export const kdaLabel = (k: number, d: number, a: number) => (d ? ((k + a) / d).toFixed(2) : "Perfect");

export const kdaColor = (ratio: number) =>
  ratio >= 5 ? "text-amber-300" : ratio >= 3 ? "text-sky-300" : ratio >= 2 ? "text-emerald-400" : "text-fg-muted";

export const csPerMin = (cs: number, duration: number) => (duration ? cs / (duration / 60) : 0);
