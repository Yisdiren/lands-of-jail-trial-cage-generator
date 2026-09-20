import { heroes } from "../data/heroes";

export const simpleSetupKey = "loj-trial-cage-simple-setup-v1";
export const normalizeStars = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const known = new Set(heroes.map(hero => hero.name));
  return Object.fromEntries(Object.entries(value).filter(([name, stars]) =>
    known.has(name) && typeof stars === "number" && Number.isInteger(stars) && stars >= 1 && stars <= 5));
};

export const normalizeSimpleSetup = (value: unknown) => {
  const saved = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const valid = new Set(heroes.filter(hero => hero.cageAllowed && hero.rarity !== "R" &&
    (hero.rarity !== "SR" || ["Lofili", "Lunarl", "Flameborne", "Samir", "Gerd", "Iwado", "Vesaryon"].includes(hero.name))).map(hero => hero.name));
  const season = Number(saved.season), joinCount = Number(saved.joinCount);
  return {
    season: Number.isInteger(season) ? Math.max(1, Math.min(7, season)) : 1,
    joinCount: Number.isInteger(joinCount) ? Math.max(1, Math.min(6, joinCount)) : 6,
    owned: Array.isArray(saved.owned) ? [...new Set(saved.owned.filter((name): name is string => typeof name === "string" && valid.has(name)))] : [],
    heroStarLevels: normalizeStars(saved.heroStarLevels),
  };
};
