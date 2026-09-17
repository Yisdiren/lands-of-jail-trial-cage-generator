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

const sortByLeftStrength = (a: Hero, b: Hero) =>
  heroScore(b) - heroScore(a) || a.name.localeCompare(b.name);

/**
 * Pick a filler for MIDDLE/RIGHT without wasting a hero reserved for a
 * future LEFT slot. Non-LEFT heroes are preferred, then unreserved LEFT
 * heroes, and reserved LEFT heroes are used only as a last resort.
 */
const pickFiller = (
  heroes: Hero[],
  cls: HeroClass,
  used: Set<string>,
  reservedLeftNames: Set<string>
) => {
  const candidates = heroes.filter(h => h.cls === cls && !used.has(h.name));

  return candidates.sort((a, b) => {
    const aReserved = reservedLeftNames.has(a.name) ? 1 : 0;
    const bReserved = reservedLeftNames.has(b.name) ? 1 : 0;
    if (aReserved !== bReserved) return aReserved - bReserved;

    // For filler positions, preserve valuable LEFT skills where possible.
    const aHasLeft = a.leftSkill ? 1 : 0;
    const bHasLeft = b.leftSkill ? 1 : 0;
    if (aHasLeft !== bHasLeft) return aHasLeft - bHasLeft;

    return heroScore(a) - heroScore(b) || a.name.localeCompare(b.name);
  })[0];
};

const pickBestUnused = (heroes: Hero[], cls: HeroClass, used: Set<string>) =>
  heroes
    .filter(h => h.cls === cls && !used.has(h.name))
    .sort(sortByLeftStrength)[0];

export function generateJoinerFormations(
  availableHeroes: Hero[],
  count = 6,
  troopPreset: TroopPreset = 'shooters'
): Formation[] {
  const eligible = availableHeroes.filter(h => h.cageAllowed);
  const leftCandidates = eligible.filter(h => !!h.leftSkill).sort(sortByLeftStrength);

  // Reserve the strongest LEFT candidates up front. This prevents, for
  // example, Phoenix or Veronica being consumed as filler before they can
  // lead a later joiner march.
  const reservedLefts = leftCandidates.slice(0, count);
  const reservedLeftNames = new Set(reservedLefts.map(h => h.name));

  const used = new Set<string>();
  const results: Formation[] = [];

  for (const left of reservedLefts) {
    if (results.length >= count) break;
    if (used.has(left.name)) continue;

    const missingClasses = classOrder.filter(cls => cls !== left.cls);
    const localUsed = new Set(used);
    localUsed.add(left.name);

    const middle = pickFiller(eligible, missingClasses[0], localUsed, reservedLeftNames);
    if (!middle) continue;
    localUsed.add(middle.name);

    const right = pickFiller(eligible, missingClasses[1], localUsed, reservedLeftNames);
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
