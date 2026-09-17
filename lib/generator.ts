import type { Hero, HeroClass } from '../data/heroes';

export type TroopPreset = 'shooters' | '10-90';

export type Formation = {
  id: string;
  left: Hero;
  middle: Hero;
  right: Hero;
  troopText: string;
  warning?: string;
};

const classOrder: HeroClass[] = ['Shield', 'Bomber', 'Shooter'];

const leftTierScore = (hero: Hero) => {
  if (hero.leftTier === 'top') return 300;
  if (hero.leftTier === 'strong') return 200;
  if (hero.leftTier === 'filler') return 100;
  return 0;
};

const heroScore = (hero: Hero) => leftTierScore(hero) + (hero.leftValue ?? 0);
const isValuableLeft = (hero: Hero) => hero.leftTier === 'top' || hero.leftTier === 'strong';
const sortByLeftStrength = (a: Hero, b: Hero) => heroScore(b) - heroScore(a) || a.name.localeCompare(b.name);

const pickBestUnused = (heroes: Hero[], cls: HeroClass, used: Set<string>) =>
  heroes.filter(h => h.cls === cls && !used.has(h.name)).sort(sortByLeftStrength)[0];

/**
 * Choose the strongest set of LEFT leaders that can actually be completed
 * into legal 1 Shield + 1 Bomber + 1 Shooter marches without hero reuse.
 * We reserve valuable TOP/STRONG LEFT heroes globally before assigning any
 * filler slots.
 */
const chooseLeftLeaders = (eligible: Hero[], count: number) => {
  const candidates = eligible.filter(h => !!h.leftSkill).sort(sortByLeftStrength);
  const valuable = candidates.filter(isValuableLeft);
  const filler = candidates.filter(h => !isValuableLeft(h));

  // Prefer TOP/STRONG LEFT heroes. Filler LEFT heroes only enter when fewer
  // than the requested number of valuable leaders are available.
  return [...valuable, ...filler].slice(0, count);
};

const pickFiller = (
  eligible: Hero[],
  cls: HeroClass,
  used: Set<string>,
  protectedLeftNames: Set<string>
) => {
  const candidates = eligible.filter(h => h.cls === cls && !used.has(h.name));

  return candidates.sort((a, b) => {
    // Never consume a planned LEFT leader if any alternative exists.
    const aProtected = protectedLeftNames.has(a.name) ? 1 : 0;
    const bProtected = protectedLeftNames.has(b.name) ? 1 : 0;
    if (aProtected !== bProtected) return aProtected - bProtected;

    // Also protect every other TOP/STRONG LEFT hero, even if it missed the
    // initial leader cutoff. This prevents valuable LEFT skills being used
    // as MIDDLE/RIGHT simply because they ranked 7th or 8th overall.
    const aValuable = isValuableLeft(a) ? 1 : 0;
    const bValuable = isValuableLeft(b) ? 1 : 0;
    if (aValuable !== bValuable) return aValuable - bValuable;

    // Prefer heroes with no LEFT skill at all over filler LEFT heroes.
    const aHasLeft = a.leftSkill ? 1 : 0;
    const bHasLeft = b.leftSkill ? 1 : 0;
    if (aHasLeft !== bHasLeft) return aHasLeft - bHasLeft;

    // Filler positions do not need rally-skill strength, so use the least
    // valuable LEFT option first and preserve better options for later.
    return heroScore(a) - heroScore(b) || a.name.localeCompare(b.name);
  })[0];
};

export function generateJoinerFormations(
  availableHeroes: Hero[],
  count = 6,
  troopPreset: TroopPreset = 'shooters'
): Formation[] {
  const eligible = availableHeroes.filter(h => h.cageAllowed);
  const plannedLefts = chooseLeftLeaders(eligible, count);
  const protectedLeftNames = new Set(plannedLefts.map(h => h.name));

  const used = new Set<string>();
  const results: Formation[] = [];

  for (const left of plannedLefts) {
    if (results.length >= count) break;
    if (used.has(left.name)) continue;

    const missingClasses = classOrder.filter(cls => cls !== left.cls);
    const localUsed = new Set(used);
    localUsed.add(left.name);

    const middle = pickFiller(eligible, missingClasses[0], localUsed, protectedLeftNames);
    if (!middle) continue;
    localUsed.add(middle.name);

    const right = pickFiller(eligible, missingClasses[1], localUsed, protectedLeftNames);
    if (!right) continue;

    used.add(left.name);
    used.add(middle.name);
    used.add(right.name);

    results.push({
      id: `J${results.length + 1}`,
      left,
      middle,
      right,
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
    return {
      id: 'MAIN',
      left: baseline[0]!,
      middle: baseline[1]!,
      right: baseline[2]!,
      troopText: '0 / 10 / 90 — current controlled-test baseline',
    };
  }

  const shield = pickBestUnused(eligible, 'Shield', new Set());
  const bomber = pickBestUnused(eligible, 'Bomber', new Set());
  const shooter = pickBestUnused(eligible, 'Shooter', new Set());
  if (!shield || !bomber || !shooter) return null;

  return {
    id: 'MAIN',
    left: shooter,
    middle: bomber,
    right: shield,
    troopText: '0 / 10 / 90 — provisional legal formation; verify by controlled Cage testing',
  };
}
