import type { Felon, Hero, HeroClass } from "../data/heroes";
export type TroopPreset = "shooters" | "10-90";
export type WarSkillLevels = Record<string, number>;
export type TroopClassKey = "shield" | "bomber" | "shooter";
export type TroopTier = `T${number}`;
export type TroopValues = Record<TroopClassKey, number>;
export type TroopTiers = Record<TroopClassKey, TroopTier>;
export type TroopConfig = {
  capacity: number;
  ratios: TroopValues;
  tiers: TroopTiers;
  available: TroopValues;
};
export type TroopPlan = {
  counts: TroopValues;
  ratioTotal: number;
  assignedTotal: number;
  text: string;
  warnings: string[];
};
export type FormationAlert = {
  severity: "error" | "warning" | "info";
  message: string;
};
export type FormationStatus = "blocked" | "review" | "ready";
export type Formation = {
  id: string;
  left: Hero;
  middle: Hero;
  right: Hero;
  troopText: string;
  robot?: string;
  leftSkillLevel?: number;
  leftSkillPercent?: number;
  alerts: FormationAlert[];
  status: FormationStatus;
};
export type FelonPlan = {
  selected: Felon[];
  preferredThird: "Rage Fist" | "Devil";
  warning?: string;
};
const classOrder: HeroClass[] = ["Shield", "Bomber", "Shooter"];
// CCW joiners are SSR-only except these three proven first-War-skill exceptions.
const approvedNonSsr = new Set(["Lunarl", "Lofili", "Samir"]);
// The controlled rally-leader baseline is reserved and must never be reused in J1-J6.
const reservedLeaderHeroes = new Set(["Ada", "Ryuichi", "Tyronn"]);
const isJoinerEligible = (hero: Hero) =>
  hero.cageAllowed &&
  !reservedLeaderHeroes.has(hero.name) &&
  (hero.rarity === "SSR" || approvedNonSsr.has(hero.name));
const troopClassLabels: Record<TroopClassKey, string> = {
  shield: "Shieldbearers",
  bomber: "Bombers",
  shooter: "Shooters",
};
const safeWhole = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const formatNumber = (value: number) => value.toLocaleString("en-US");

export function calculateTroopPlan(config: TroopConfig): TroopPlan {
  const capacity = safeWhole(config.capacity);
  const ratios: TroopValues = {
    shield: safeWhole(config.ratios.shield),
    bomber: safeWhole(config.ratios.bomber),
    shooter: safeWhole(config.ratios.shooter),
  };
  const ratioTotal = ratios.shield + ratios.bomber + ratios.shooter;
  const counts: TroopValues = {
    shield: Math.floor((capacity * ratios.shield) / 100),
    bomber: Math.floor((capacity * ratios.bomber) / 100),
    shooter: Math.floor((capacity * ratios.shooter) / 100),
  };
  if (ratioTotal === 100) {
    counts.shooter = capacity - counts.shield - counts.bomber;
  }
  const assignedTotal = counts.shield + counts.bomber + counts.shooter;
  const warnings: string[] = [];

  if (capacity < 1) warnings.push("March capacity must be at least 1.");
  if (ratioTotal !== 100)
    warnings.push(`Troop ratios total ${ratioTotal}%; they must total 100%.`);
  (Object.keys(counts) as TroopClassKey[]).forEach((key) => {
    const available = safeWhole(config.available[key]);
    if (counts[key] > available) {
      warnings.push(
        `Need ${formatNumber(counts[key])} ${config.tiers[key]} ${troopClassLabels[key]}, but only ${formatNumber(available)} are available.`,
      );
    }
  });

  const parts = (Object.keys(counts) as TroopClassKey[])
    .filter((key) => counts[key] > 0)
    .map(
      (key) =>
        `${formatNumber(counts[key])} ${config.tiers[key]} ${troopClassLabels[key]}`,
    );
  return {
    counts,
    ratioTotal,
    assignedTotal,
    text: `${ratios.shield} / ${ratios.bomber} / ${ratios.shooter} — ${parts.join(" + ") || "No troops assigned"}`,
    warnings,
  };
}

export function validateFormation(
  formation: Omit<Formation, "alerts" | "status">,
  troopPlan: TroopPlan,
  mode: "leader" | "joiner",
): Pick<Formation, "alerts" | "status"> {
  const alerts: FormationAlert[] = troopPlan.warnings.map((message) => ({
    severity: "error",
    message,
  }));
  const formationHeroes = [formation.left, formation.middle, formation.right];
  const classes = new Set(formationHeroes.map((hero) => hero.cls));

  if (classes.size !== 3) {
    alerts.push({
      severity: "error",
      message:
        "Formation must contain exactly one Shield, one Bomber and one Shooter hero.",
    });
  }
  formationHeroes.forEach((hero) => {
    if (hero.rarity === "KOF") {
      alerts.push({
        severity: "error",
        message: `${hero.name} is a KOF hero and is excluded from Trial Cage.`,
      });
    } else if (hero.rarity !== "SSR" && !approvedNonSsr.has(hero.name)) {
      alerts.push({
        severity: "warning",
        message: `${hero.name} is ${hero.rarity}; CCW prefers SSR heroes for Cage formations.`,
      });
    }
  });
  if (!formation.robot) {
    alerts.push({
      severity: "warning",
      message: "No owned robot is assigned to this march.",
    });
  }
  if (mode === "joiner") {
    if (!formation.left.leftSkill) {
      alerts.push({
        severity: "error",
        message:
          "The LEFT hero has no confirmed first War skill for rally joining.",
      });
    } else {
      if (formation.left.leftTier === "filler") {
        alerts.push({
          severity: "warning",
          message:
            "Filler LEFT skill — use only after stronger LEFT heroes are exhausted.",
        });
      }
      if ((formation.leftSkillLevel ?? 5) < 5) {
        alerts.push({
          severity: "warning",
          message: `${formation.left.name}'s LEFT War skill is only Lv${formation.leftSkillLevel}.`,
        });
      }
      if (!formation.left.leftSkillVerified) {
        alerts.push({
          severity: "info",
          message: `${formation.left.name}'s exact War skill percentage progression is not yet verified.`,
        });
      }
    }
  }

  return {
    alerts,
    status: alerts.some((alert) => alert.severity === "error")
      ? "blocked"
      : alerts.some((alert) => alert.severity === "warning")
        ? "review"
        : "ready",
  };
}
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
const chooseLeft = (
  e: Hero[],
  n: number,
  l: WarSkillLevels,
  verifiedOnly = false,
) =>
  e
    .filter((h) => !!h.leftSkill && (!verifiedOnly || h.leftSkillVerified))
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
  troopPlan: TroopPlan,
  warSkillLevels: WarSkillLevels = {},
  ownedRobots: string[] = [],
  verifiedOnly = false,
): Formation[] {
  const eligible = availableHeroes.filter(isJoinerEligible),
    planned = chooseLeft(eligible, count, warSkillLevels, verifiedOnly),
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
    const formationBase: Omit<Formation, "alerts" | "status"> = {
      id: `J${results.length + 1}`,
      left,
      middle,
      right,
      robot,
      leftSkillLevel: lv,
      leftSkillPercent: left.leftSkillValues?.[lv - 1],
      troopText: troopPlan.text,
    };
    results.push({
      ...formationBase,
      ...validateFormation(formationBase, troopPlan, "joiner"),
    });
  }
  return results;
}
export function generateLeaderFormation(
  availableHeroes: Hero[],
  troopPlan: TroopPlan,
  ownedRobots: string[] = [],
): Formation | null {
  const eligible = availableHeroes.filter((h) => h.cageAllowed),
    byName = new Map(eligible.map((h) => [h.name, h])),
    baseline = ["Ada", "Ryuichi", "Tyronn"].map((n) => byName.get(n)),
    robot = ownedRobots[0];
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
  const shield = pickBest(eligible, "Shield", new Set()),
    bomber = pickBest(eligible, "Bomber", new Set()),
    shooter = pickBest(eligible, "Shooter", new Set());
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