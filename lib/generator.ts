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

const pickBestUnused = (heroes: Hero[], cls: HeroClass, used: Set<string>) =>
  heroes
    .filter(h => h.cls === cls && !used.has(h.name))
    .sort((a, b) => heroScore(b) - heroScore(a) || a.name.localeCompare(b.name))[0];

export function generateJoinerFormations(
  availableHeroes: Hero[],
  count = 6,
  troopPreset: TroopPreset = 'shooters'
): Formation[] {
  const eligible = availableHeroes.filter(h => h.cageAllowed);
  const leftCandidates = eligible
    .filter(h => !!h.leftSkill)
    .sort((a, b) => heroScore(b) - heroScore(a) || a.name.localeCompare(b.name));

  const used = new Set<string>();
  const results: Formation[] = [];

  for (const left of leftCandidates) {
    if (results.length >= count) break;
    if (used.has(left.name)) continue;

    const missingClasses = classOrder.filter(cls => cls !== left.cls);
    const localUsed = new Set(used);
    localUsed.add(left.name);

    const middle = pickBestUnused(eligible, missingClasses[0], localUsed);
    if (!middle) continue;
    localUsed.add(middle.name);

    const right = pickBestUnused(eligible, missingClasses[1], localUsed);
    if (!right) continue;

    used.add(left.name);
    used.add(middle.name);
    used.add(right.name);

    results.push({
      id: `J${results.length + 1}`,
      left,
      middle,
      right,
      troopText: troopPreset === 'shooters' ? '0 / 0 / 100 — 100k Shooters' : '0 / 10 / 90 — 10k Bombers + 90k Shooters',
      warning: left.leftTier === 'filler' ? 'Filler LEFT skill — use only after stronger LEFT heroes are exhausted.' : undefined,
    });
  }

  return results;
}

export function generateLeaderFormation(availableHeroes: Hero[]): Formation | null {
  const byName = new Map(availableHeroes.filter(h => h.cageAllowed).map(h => [h.name, h]));
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

  const shield = pickBestUnused(availableHeroes, 'Shield', new Set());
  const bomber = pickBestUnused(availableHeroes, 'Bomber', new Set());
  const shooter = pickBestUnused(availableHeroes, 'Shooter', new Set());
  if (!shield || !bomber || !shooter) return null;

  return {
    id: 'MAIN',
    left: shooter,
    middle: bomber,
    right: shield,
    troopText: '0 / 10 / 90 — provisional legal formation; verify by controlled Cage testing',
  };
}
