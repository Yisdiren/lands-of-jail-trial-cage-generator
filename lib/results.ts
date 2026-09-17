export type CageName = "Cage 1" | "Cage 2";
export type TestVariant = "A" | "B";

export type CageResult = {
  id: string;
  cage: CageName;
  date: string;
  testName: string;
  variant: TestVariant;
  leftHero: string;
  damage: number;
  notes: string;
  createdAt: number;
};

export type VariantStats = {
  hits: number;
  average: number;
  best: number;
};

export type Comparison = {
  a: VariantStats;
  b: VariantStats;
  differencePercent: number | null;
  leader: TestVariant | "tie" | null;
  warning?: string;
};

export type HeroEvidence = VariantStats & {
  hero: string;
  confidence: "testing" | "usable";
};

export type HeroRanking = {
  entries: HeroEvidence[];
  recommendation: string | null;
  warning: string;
};

const stats = (results: CageResult[], variant: TestVariant): VariantStats => {
  const damage = results
    .filter((result) => result.variant === variant)
    .map((result) => result.damage)
    .filter((value) => Number.isFinite(value) && value >= 0);
  return {
    hits: damage.length,
    average: damage.length
      ? damage.reduce((total, value) => total + value, 0) / damage.length
      : 0,
    best: damage.length ? Math.max(...damage) : 0,
  };
};

export function compareResults(
  results: CageResult[],
  testName: string,
): Comparison {
  const testResults = results.filter((result) => result.testName === testName);
  const a = stats(testResults, "A");
  const b = stats(testResults, "B");
  const differencePercent =
    a.hits && b.hits && a.average > 0
      ? ((b.average - a.average) / a.average) * 100
      : null;
  const leader =
    differencePercent === null
      ? null
      : differencePercent > 0
        ? "B"
        : differencePercent < 0
          ? "A"
          : "tie";
  const lowSamples = [
    ...(a.hits < 3 ? [`A has ${a.hits}`] : []),
    ...(b.hits < 3 ? [`B has ${b.hits}`] : []),
  ];

  return {
    a,
    b,
    differencePercent,
    leader,
    warning: lowSamples.length
      ? `${lowSamples.join(" and ")} recorded hit${a.hits + b.hits === 1 ? "" : "s"}. Use at least 3 hits per variant before choosing a winner because Cage damage has RNG.`
      : undefined,
  };
}

export function rankLeftHeroes(
  results: CageResult[],
  cage: CageName,
  testName: string,
): HeroRanking {
  const groups = new Map<string, { hero: string; damage: number[] }>();
  results
    .filter(
      (result) =>
        result.cage === cage &&
        result.testName === testName &&
        Number.isFinite(result.damage) &&
        result.damage >= 0,
    )
    .forEach((result) => {
      const hero = result.leftHero.trim();
      if (!hero) return;
      const key = hero.toLocaleLowerCase("en-US");
      const group = groups.get(key) ?? { hero, damage: [] };
      group.damage.push(result.damage);
      groups.set(key, group);
    });

  const entries = [...groups.values()]
    .map(({ hero, damage }): HeroEvidence => ({
      hero,
      hits: damage.length,
      average:
        damage.reduce((total, value) => total + value, 0) / damage.length,
      best: Math.max(...damage),
      confidence: damage.length >= 3 ? "usable" : "testing",
    }))
    .sort((a, b) => b.average - a.average || b.best - a.best);
  const usable = entries.filter((entry) => entry.confidence === "usable");
  const recommendation = usable.length >= 2 ? usable[0].hero : null;
  const warning = !entries.length
    ? "No LEFT-hero evidence exists for this Cage and test yet."
    : usable.length < 2
      ? "Record at least 3 controlled hits for two LEFT heroes before the optimizer recommends a winner."
      : "Ranking uses average damage from this exact Cage and test name. Keep troops, robot, buffs and the other heroes unchanged.";

  return { entries, recommendation, warning };
}
