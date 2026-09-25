const CDN = "https://ddragon.leagueoflegends.com/cdn";

export const champIcon = (version: string | null | undefined, championId: string) =>
  version && championId ? `${CDN}/${version}/img/champion/${championId}.png` : "";

export const itemIcon = (version: string | null | undefined, itemId: number) =>
  version && itemId ? `${CDN}/${version}/img/item/${itemId}.png` : "";

export const spellIcon = (version: string | null | undefined, spellImage: string) =>
  version && spellImage ? `${CDN}/${version}/img/spell/${spellImage}` : "";
