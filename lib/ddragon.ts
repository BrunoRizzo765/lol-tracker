const CDN = "https://ddragon.leagueoflegends.com/cdn";
const CDRAGON =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-mini-crests";

export const champIcon = (version: string | null | undefined, championId: string) =>
  version && championId ? `${CDN}/${version}/img/champion/${championId}.png` : "";

export const itemIcon = (version: string | null | undefined, itemId: number) =>
  version && itemId ? `${CDN}/${version}/img/item/${itemId}.png` : "";

export const spellIcon = (version: string | null | undefined, spellImage: string) =>
  version && spellImage ? `${CDN}/${version}/img/spell/${spellImage}` : "";

/** Ranked crest icon (Community Dragon). Tier e.g. GOLD, EMERALD, unranked. */
export const rankIcon = (tier?: string | null) => {
  const key = (tier || "unranked").toLowerCase();
  const safe = [
    "iron",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "emerald",
    "diamond",
    "master",
    "grandmaster",
    "challenger",
    "unranked",
  ].includes(key)
    ? key
    : "unranked";
  // SVG covers all tiers including emerald (no PNG for emerald on CDragon).
  return `${CDRAGON}/${safe}.svg`;
};
