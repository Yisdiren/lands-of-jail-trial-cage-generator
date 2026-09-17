import type { Hero, HeroClass } from "../data/heroes";
import type {
  Formation,
  TroopPlan,
  WarSkillLevels,
} from "./generator";
import { validateFormation } from "./generator";

export type HeroStarLevels = Record<string, number>;

const classOrder: HeroClass[] = ["Shield", "Bomber", "Shooter"];
const approvedNonSsr = new Set(["Lunarl", "Lofili", "Samir"]);

const isBaseJoinerEligible = (hero: Hero) =>
  hero.cageAllowed &&
  (hero.rarity === "SSR" || approvedNonSsr.has(hero.name));

const tier = (hero: Hero) =>
  hero.leftTier === "top"
    ? 300
    : hero.leftTier === "strong"
      ? 200
      : hero.leftTier === "filler"
        ? 100
        : 0;

const levelOf = (hero: Hero, levels: WarSkillLevels) =>
  Math.min(5, Math.max(1, levels[hero.name] ?? 5));

const starOf = (hero: Hero, stars: HeroStarLevels) =>
  Math.min(5, Math.max(1, stars[hero.name] ?? 1));

const skillMultiplier = (hero: Hero, levels: WarSkillLevels) => {
  if (!hero.leftSkill) return 0;
  const level = levelOf(hero, levels);
  if (hero.leftSkillValues) {
    const actual = hero.leftSkillValues[level - 1];
    const max = hero.leftSkillValues[4];
    return max > 0 ? actual / max : 0;
  }
  return level / 5;
};

// First War skill is deliberately dominant. Stars are a modest secondary
// development bonus so a high-star filler cannot leapfrog a much better skill.
const leftScore = (
  hero: Hero,
  levels: WarSkillLevels,
  stars: HeroStarLevels,
) => {
  const skillScore = (tier(hero) + (hero.leftValue ?? 0)) * skillMultiplier(hero, levels);
  const starBonus = (starOf(hero, stars) - 1) * 3;
  return skillScore + starBonus;
};

const valuable = (hero: Hero) =>
  hero.leftTier === "top" || hero.leftTier === "strong";

const leftSorter = (levels: WarSkillLevels, stars: HeroStarLevels) =>
  (a: Hero, b: Hero) =>
    leftScore(b, levels, stars) - leftScore(a, levels, stars) ||
    starOf(b, stars) - starOf(a, stars) ||
    a.name.localeCompare(b.name);

const pickBest = (
  heroes: Hero[],
  cls: HeroClass,
  used: Set<string>,
  stars: HeroStarLevels,
) =>
  heroes
    .filter((hero) => hero.cls === cls && !used.has(hero.name))
    .sort(
      (a, b) =>
        starOf(b, stars) - starOf(a, stars) || a.name.localeCompare(b.name),
    )[0];

const chooseLeft = (
  eligible: Hero[],
  count: number,
  levels: WarSkillLevels,
  stars: HeroStarLevels,
  verifiedOnly: boolean,
) =>
  eligible
    .filter(
      (hero) =>
        !!hero.leftSkill && (!verifiedOnly || hero.leftSkillVerified),
    )
    .sort(leftSorter(levels, stars))
    .slice(0, count);

const pickFiller = (
  eligible: Hero[],
  cls: HeroClass,
  used: Set<string>,
  protectedNames: Set<string>,
  levels: WarSkillLevels,
  stars: HeroStarLevels,
) =>
  eligible
    .filter((hero) => hero.cls === cls && !used.has(hero.name))
    .sort((a, b) => {
      const ap = protectedNames.has(a.name) ? 1 : 0;
      const bp = protectedNames.has(b.name) ? 1 : 0;
      if (ap !== bp) return ap - bp;
      const av = valuable(a) ? 1 : 0;
      const bv = valuable(b) ? 1 : 0;
      if (av !== bv) return av - bv;
      const al = a.leftSkill ? 1 : 0;
      const bl = b.leftSkill ? 1 : 0;
      if (al !== bl) return al - bl;
      // For expendable filler, use lower-star heroes first and preserve the
      // more developed heroes for stronger march positions.
      return (
        starOf(a, stars) - starOf(b, stars) ||
        leftScore(a, levels, stars) - leftScore(b, levels, stars) ||
        a.name.localeCompare(b.name)
      );
    })[0];

export function generateLeaderFormationSmart(
  availableHeroes: Hero[],
  troopPlan: TroopPlan,
  ownedRobots: string[] = [],
  heroStarLevels: HeroStarLevels = {},
): Formation | null {
  const eligible = availableHeroes.filter((hero) => hero.cageAllowed);
  const byName = new Map(eligible.map((hero) => [hero.name, hero]));
  const baseline = ["Ada", "Ryuichi", "Tyronn"].map((name) => byName.get(name));
  const robot = ownedRobots[0];

  if (baseline.every(Boolean)) {
    const formationBase: Omit<Formation, "alerts" | "status"> = {
      id: "MAIN",
      left: baseline[0]!,
      middle: baseline[1]!,
      right: baseline[2]!,
      robot,
      troopText: troopPlan.text,
    };
    return {
      ...formationBase,
      ...validateFormation(formationBase, troopPlan, "leader"),
    };
  }

  const used = new Set<string>();
  const shield = pickBest(eligible, "Shield", used, heroStarLevels);
  if (shield) used.add(shield.name);
  const bomber = pickBest(eligible, "Bomber", used, heroStarLevels);
  if (bomber) used.add(bomber.name);
  const shooter = pickBest(eligible, "Shooter", used, heroStarLevels);
  if (!shield || !bomber || !shooter) return null;

  const formationBase: Omit<Formation, "alerts" | "status"> = {
    id: "MAIN",
    left: shooter,
    middle: bomber,
    right: shield,
    robot,
    troopText: troopPlan.text,
  };
  return {
    ...formationBase,
    ...validateFormation(formationBase, troopPlan, "leader"),
  };
}

export function generateJoinerFormationsSmart(
  availableHeroes: Hero[],
  count: number,
  troopPlan: TroopPlan,
  warSkillLevels: WarSkillLevels = {},
  ownedRobots: string[] = [],
  verifiedOnly = false,
  heroStarLevels: HeroStarLevels = {},
  leaderFormation: Formation | null = null,
): Formation[] {
  // Dynamic reservation: whatever the leader generator actually selected is
  // unavailable to every joiner march.
  const reservedLeaderNames = new Set(
    leaderFormation
      ? [leaderFormation.left.name, leaderFormation.middle.name, leaderFormation.right.name]
      : [],
  );
  const eligible = availableHeroes.filter(
    (hero) => isBaseJoinerEligible(hero) && !reservedLeaderNames.has(hero.name),
  );
  const planned = chooseLeft(
    eligible,
    count,
    warSkillLevels,
    heroStarLevels,
    verifiedOnly,
  );
  const protectedNames = new Set(planned.map((hero) => hero.name));
  const used = new Set<string>();
  const results: Formation[] = [];

  for (const left of planned) {
    if (results.length >= count) break;
    if (used.has(left.name)) continue;
    const missing = classOrder.filter((cls) => cls !== left.cls);
    const local = new Set(used);
    local.add(left.name);
    const middle = pickFiller(
      eligible,
      missing[0],
      local,
      protectedNames,
      warSkillLevels,
      heroStarLevels,
    );
    if (!middle) continue;
    local.add(middle.name);
    const right = pickFiller(
      eligible,
      missing[1],
      local,
      protectedNames,
      warSkillLevels,
      heroStarLevels,
    );
    if (!right) continue;

    used.add(left.name);
    used.add(middle.name);
    used.add(right.name);
    const level = levelOf(left, warSkillLevels);
    const robot = ownedRobots[results.length];
    const formationBase: Omit<Formation, "alerts" | "status"> = {
      id: `J${results.length + 1}`,
      left,
      middle,
      right,
      robot,
      leftSkillLevel: level,
      leftSkillPercent: left.leftSkillValues?.[level - 1],
      troopText: troopPlan.text,
    };
    results.push({
      ...formationBase,
      ...validateFormation(formationBase, troopPlan, "joiner"),
    });
  }

  return results;
}
