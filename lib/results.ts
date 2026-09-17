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
