import { heroes } from "../data/heroes";

export const simpleSetupKey = "loj-trial-cage-simple-setup-v1";
export const normalizeStars = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const known = new Set(heroes.map(hero => hero.name));
  return Object.fromEntries(Object.entries(value).filter(([name, stars]) =>
    known.has(name) && typeof stars === "number" && Number.isInteger(stars) && stars >= 1 && stars <= 5));
};

export const normalizeRobotPriority = (value: unknown, robotNames: readonly string[]): string[] => {
  const known = new Set(robotNames);
  const requested = Array.isArray(value) ? value.filter((name): name is string => typeof name === "string" && known.has(name)) : [];
  const unique = [...new Set(requested)];
  return [...unique, ...robotNames.filter(name => !unique.includes(name))];
};

export const normalizeSimpleSetup = (value: unknown) => {
  const saved = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const valid = new Set(heroes.filter(hero => hero.cageAllowed && hero.rarity !== "R" &&
    (hero.rarity !== "SR" || ["Lofili", "Lunarl", "Flameborne", "Samir", "Gerd", "Iwado", "Vesaryon"].includes(hero.name))).map(hero => hero.name));
  const season = Number(saved.season), joinCount = Number(saved.joinCount);
  return {
    season: Number.isInteger(season) ? Math.max(1, Math.min(7, season)) : 6,
    joinCount: Number.isInteger(joinCount) ? Math.max(1, Math.min(6, joinCount)) : 6,
    owned: Array.isArray(saved.owned) ? [...new Set(saved.owned.filter((name): name is string => typeof name === "string" && valid.has(name)))] : [],
    heroStarLevels: normalizeStars(saved.heroStarLevels),
  };
};

export type HeroListImport = { matched: string[]; unmatched: string[]; duplicates: string[]; stars: Record<string, number> };
export const parseHeroListText = (text: string): HeroListImport => {
  const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidates = heroes.filter(hero => hero.cageAllowed && hero.rarity !== "R");
  const matched: string[] = [], unmatched: string[] = [], duplicates: string[] = [];
  const stars: Record<string, number> = {}, seen = new Set<string>();
  text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
    const normalizedLine = normalized(line);
    const hero = candidates.slice().sort((a,b)=>b.name.length-a.name.length).find(candidate => normalizedLine.includes(normalized(candidate.name)));
    if (!hero) { unmatched.push(line); return; }
    if (seen.has(hero.name)) { duplicates.push(line); return; }
    seen.add(hero.name);
    const nameIndex = normalizedLine.indexOf(normalized(hero.name));
    const sourceAfterName = nameIndex >= 0 ? line : "";
    const starSymbols = sourceAfterName.match(/★/g)?.length ?? 0;
    const numericStar = sourceAfterName.match(/★\s*([1-5])|\b([1-5])\s*(?:star|stars)\b/i);
    const level = Math.max(1, Math.min(5, starSymbols > 1 ? starSymbols : Number(numericStar?.[1] || numericStar?.[2] || starSymbols || 1)));
    matched.push(hero.name); stars[hero.name] = level;
  });
  return { matched, unmatched, duplicates, stars };
};
