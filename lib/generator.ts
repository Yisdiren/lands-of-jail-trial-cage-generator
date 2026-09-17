import type { Felon, Hero, HeroClass } from "../data/heroes";
export type TroopPreset = "shooters" | "10-90";
export type WarSkillLevels = Record<string, number>;
export type Formation = {
  id: string;
  left: Hero;
  middle: Hero;
  right: Hero;
  troopText: string;
  robot?: string;
  leftSkillLevel?: number;
  leftSkillPercent?: number;
  warning?: string;
};
export type FelonPlan = {
  selected: Felon[];
  preferredThird: "Rage Fist" | "Devil";
  warning?: string;
};
const classOrder: HeroClass[] = ["Shield", "Bomber", "Shooter"];
const tier = (h: Hero) =>
  h.leftTier === "top"
    ? 300
    : h.leftTier === "strong"
      ? 200
      : h.leftTier === "filler"
        ? 100
        : 0;
const levelOf = (h: Hero, l: WarSkillLevels) =>
  Math.min(5, Math.max(1, l[h.name] ?? 5));
const multiplier = (h: Hero, l: WarSkillLevels) => {
  if (!h.leftSkill) return 0;
  const level = levelOf(h, l);
  if (h.leftSkillValues) {
    const actual = h.leftSkillValues[level - 1],
      max = h.leftSkillValues[4];
    return max > 0 ? actual / max : 0;
  }
  return level / 5;
};
const score = (h: Hero, l: WarSkillLevels = {}) =>
  (tier(h) + (h.leftValue ?? 0)) * multiplier(h, l);
const valuable = (h: Hero) => h.leftTier === "top" || h.leftTier === "strong";
const sorter = (l: WarSkillLevels) => (a: Hero, b: Hero) =>
  score(b, l) - score(a, l) || a.name.localeCompare(b.name);
const pickBest = (hs: Hero[], c: HeroClass, u: Set<string>) =>
  hs.filter((h) => h.cls === c && !u.has(h.name)).sort(sorter({}))[0];
const chooseLeft = (e: Hero[], n: number, l: WarSkillLevels) =>
  e
    .filter((h) => !!h.leftSkill)
    .sort(sorter(l))
    .slice(0, n);
const pickFiller = (
  e: Hero[],
  c: HeroClass,
  u: Set<string>,
  p: Set<string>,
  l: WarSkillLevels,
) =>
  e
    .filter((h) => h.cls === c && !u.has(h.name))
    .sort((a, b) => {
      const ap = p.has(a.name) ? 1 : 0,
        bp = p.has(b.name) ? 1 : 0;
      if (ap !== bp) return ap - bp;
      const av = valuable(a) ? 1 : 0,
        bv = valuable(b) ? 1 : 0;
      if (av !== bv) return av - bv;
      const al = a.leftSkill ? 1 : 0,
        bl = b.leftSkill ? 1 : 0;
      if (al !== bl) return al - bl;
      return score(a, l) - score(b, l) || a.name.localeCompare(b.name);
    })[0];
export function generateJoinerFormations(
  availableHeroes: Hero[],
  count = 6,
  troopPreset: TroopPreset = "shooters",
  warSkillLevels: WarSkillLevels = {},
  ownedRobots: string[] = [],
): Formation[] {
  const eligible = availableHeroes.filter((h) => h.cageAllowed),
    planned = chooseLeft(eligible, count, warSkillLevels),
    protectedNames = new Set(planned.map((h) => h.name)),
    used = new Set<string>(),
    results: Formation[] = [];
  for (const left of planned) {
    if (results.length >= count) break;
    if (used.has(left.name)) continue;
    const missing = classOrder.filter((c) => c !== left.cls),
      local = new Set(used);
    local.add(left.name);
    const middle = pickFiller(
      eligible,
      missing[0],
      local,
      protectedNames,
      warSkillLevels,
    );
    if (!middle) continue;
    local.add(middle.name);
    const right = pickFiller(
      eligible,
      missing[1],
      local,
      protectedNames,
      warSkillLevels,
    );
    if (!right) continue;
    used.add(left.name);
    used.add(middle.name);
    used.add(right.name);
    const lv = levelOf(left, warSkillLevels),
      robot = ownedRobots[results.length];
    results.push({
      id: `J${results.length + 1}`,
      left,
      middle,
      right,
      robot,
      leftSkillLevel: lv,
      leftSkillPercent: left.leftSkillValues?.[lv - 1],
      troopText:
        troopPreset === "shooters"
          ? "0 / 0 / 100 — 100k Shooters"
          : "0 / 10 / 90 — 10k Bombers + 90k Shooters",
      warning:
        left.leftTier === "filler"
          ? "Filler LEFT skill — use only after stronger LEFT heroes are exhausted."
          : undefined,
    });
  }
  return results;
}
export function generateLeaderFormation(
  availableHeroes: Hero[],
  ownedRobots: string[] = [],
): Formation | null {
  const eligible = availableHeroes.filter((h) => h.cageAllowed),
    byName = new Map(eligible.map((h) => [h.name, h])),
    baseline = ["Ada", "Ryuichi", "Tyronn"].map((n) => byName.get(n)),
    robot = ownedRobots[0];
  if (baseline.every(Boolean))
    return {
      id: "MAIN",
      left: baseline[0]!,
      middle: baseline[1]!,
      right: baseline[2]!,
      robot,
      troopText: "0 / 10 / 90 — current controlled-test baseline",
    };
  const shield = pickBest(eligible, "Shield", new Set()),
    bomber = pickBest(eligible, "Bomber", new Set()),
    shooter = pickBest(eligible, "Shooter", new Set());
  if (!shield || !bomber || !shooter) return null;
  return {
    id: "MAIN",
    left: shooter,
    middle: bomber,
    right: shield,
    robot,
    troopText:
      "0 / 10 / 90 — provisional legal formation; verify by controlled Cage testing",
  };
}

export function optimizeFelons(
  felons: Felon[],
  ownedNames: string[],
  rallyFills: boolean,
): FelonPlan {
  const owned = felons.filter((felon) => ownedNames.includes(felon.name));
  const byName = new Map(owned.map((felon) => [felon.name, felon]));
  const preferredThird = rallyFills ? "Rage Fist" : "Devil";
  const alternateThird = rallyFills ? "Devil" : "Rage Fist";
  const order = ["Scorpion", "Cobra", preferredThird, alternateThird];
  const selected = order
    .map((name) => byName.get(name))
    .filter((felon): felon is Felon => Boolean(felon))
    .slice(0, 3);
  const missingCore = ["Scorpion", "Cobra"].filter((name) => !byName.has(name));
  const warnings: string[] = [];

  if (missingCore.length) {
    warnings.push(
      `Missing core Yard Time felon${missingCore.length === 1 ? "" : "s"}: ${missingCore.join(" + ")}.`,
    );
  }
  if (!byName.has(preferredThird)) {
    warnings.push(
      `${preferredThird} is preferred for this rally condition${byName.has(alternateThird) ? `; using ${alternateThird} instead` : ""}.`,
    );
  }
  if (selected.length < 3) {
    warnings.push(
      `Only ${selected.length} owned Yard Time felon${selected.length === 1 ? " is" : "s are"} available.`,
    );
  }

  return {
    selected,
    preferredThird,
    warning: warnings.length ? warnings.join(" ") : undefined,
  };
}
