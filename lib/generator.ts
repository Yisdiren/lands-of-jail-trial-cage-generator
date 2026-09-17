import type { Hero, HeroClass } from '../data/heroes';

export type TroopPreset = 'shooters' | '10-90';
export type WarSkillLevels = Record<string, number>;

export type Formation = {
  id: string;
  left: Hero;
  middle: Hero;
  right: Hero;
  troopText: string;
  leftSkillLevel?: number;
  warning?: string;
};

const classOrder: HeroClass[] = ['Shield', 'Bomber', 'Shooter'];

const leftTierScore = (hero: Hero) => {
  if (hero.leftTier === 'top') return 300;
  if (hero.leftTier === 'strong') return 200;
  if (hero.leftTier === 'filler') return 100;
  return 0;
};

const skillMultiplier = (hero: Hero, levels: WarSkillLevels) => {
  if (!hero.leftSkill) return 0;
  const level = Math.min(5, Math.max(1, levels[hero.name] ?? 5));
  return level / 5;
};

const heroScore = (hero: Hero, levels: WarSkillLevels = {}) =>
  leftTierScore(hero) * skillMultiplier(hero, levels) + (hero.leftValue ?? 0) * skillMultiplier(hero, levels);

const isValuableLeft = (hero: Hero) => hero.leftTier === 'top' || hero.leftTier === 'strong';
const sortByLeftStrength = (levels: WarSkillLevels) => (a: Hero, b: Hero) =>
  heroScore(b, levels) - heroScore(a, levels) || a.name.localeCompare(b.name);

const pickBestUnused = (heroes: Hero[], cls: HeroClass, used: Set<string>) =>
  heroes.filter(h => h.cls === cls && !used.has(h.name)).sort(sortByLeftStrength({}))[0];

const chooseLeftLeaders = (eligible: Hero[], count: number, levels: WarSkillLevels) => {
  const candidates = eligible.filter(h => !!h.leftSkill).sort(sortByLeftStrength(levels));
  return candidates.slice(0, count);
};

const pickFiller = (
  eligible: Hero[],
  cls: HeroClass,
  used: Set<string>,
  protectedLeftNames: Set<string>,
  levels: WarSkillLevels
) => {
  const candidates = eligible.filter(h => h.cls === cls && !used.has(h.name));

  return candidates.sort((a, b) => {
    const aProtected = protectedLeftNames.has(a.name) ? 1 : 0;
    const bProtected = protectedLeftNames.has(b.name) ? 1 : 0;
    if (aProtected !== bProtected) return aProtected - bProtected;

    const aValuable = isValuableLeft(a) ? 1 : 0;
    const bValuable = isValuableLeft(b) ? 1 : 0;
    if (aValuable !== bValuable) return aValuable - bValuable;

    const aHasLeft = a.leftSkill ? 1 : 0;
    const bHasLeft = b.leftSkill ? 1 : 0;
    if (aHasLeft !== bHasLeft) return aHasLeft - bHasLeft;

    return heroScore(a, levels) - heroScore(b, levels) || a.name.localeCompare(b.name);
  })[0];
};

export function generateJoinerFormations(
  availableHeroes: Hero[],
  count = 6,
  troopPreset: TroopPreset = 'shooters',
  warSkillLevels: WarSkillLevels = {}
): Formation[] {
  const eligible = availableHeroes.filter(h => h.cageAllowed);
  const plannedLefts = chooseLeftLeaders(eligible, count, warSkillLevels);
  const protectedLeftNames = new Set(plannedLefts.map(h => h.name));

  const used = new Set<string>();
  const results: Formation[] = [];

  for (const left of plannedLefts) {
    if (results.length >= count) break;
    if (used.has(left.name)) continue;

    const missingClasses = classOrder.filter(cls => cls !== left.cls);
    const localUsed = new Set(used);
    localUsed.add(left.name);

    const middle = pickFiller(eligible, missingClasses[0], localUsed, protectedLeftNames, warSkillLevels);
    if (!middle) continue;
    localUsed.add(middle.name);

    const right = pickFiller(eligible, missingClasses[1], localUsed, protectedLeftNames, warSkillLevels);
    if (!right) continue;

    used.add(left.name);
    used.add(middle.name);
    used.add(right.name);

    const leftSkillLevel = Math.min(5, Math.max(1, warSkillLevels[left.name] ?? 5));
    results.push({
      id: `J${results.length + 1}`,
      left,
      middle,
      right,
      leftSkillLevel,
      troopText:
        troopPreset === 'shooters'
          ? '0 / 0 / 100 — 100k Shooters'
          : '0 / 10 / 90 — 10k Bombers + 90k Shooters',
      warning:
        left.leftTier === 'filler'
          ? 'Filler LEFT skill — use only after stronger LEFT heroes are exhausted.'
          : undefined,
    });
  }

  return results;
}

export function generateLeaderFormation(availableHeroes: Hero[]): Formation | null {
  const eligible = availableHeroes.filter(h => h.cageAllowed);
  const byName = new Map(eligible.map(h => [h.name, h]));
  const baseline = ['Ada', 'Ryuichi', 'Tyronn'].map(name => byName.get(name));

  if (baseline.every(Boolean)) {
    return { id: 'MAIN', left: baseline[0]!, middle: baseline[1]!, right: baseline[2]!, troopText: '0 / 10 / 90 — current controlled-test baseline' };
  }

  const shield = pickBestUnused(eligible, 'Shield', new Set());
  const bomber = pickBestUnused(eligible, 'Bomber', new Set());
  const shooter = pickBestUnused(eligible, 'Shooter', new Set());
  if (!shield || !bomber || !shooter) return null;

  return { id: 'MAIN', left: shooter, middle: bomber, right: shield, troopText: '0 / 10 / 90 — provisional legal formation; verify by controlled Cage testing' };
}
