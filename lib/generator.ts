import type { Felon, Hero } from "../data/heroes";
import {
  generateJoinerFormationsSmart,
  generateLeaderFormationSmart,
  type HeroStarLevels,
} from "./formation-generator";

export type TroopPreset = "shooters" | "10-90";
export type WarSkillLevels = Record<string, number>;
export type TroopClassKey = "shield" | "bomber" | "shooter";
export type TroopTier = `T${number}`;
export type TroopValues = Record<TroopClassKey, number>;
export type TroopTiers = Record<TroopClassKey, TroopTier>;
export type TroopConfig = { capacity: number; ratios: TroopValues; tiers: TroopTiers; available: TroopValues };
export type TroopPlan = { counts: TroopValues; ratioTotal: number; assignedTotal: number; text: string; warnings: string[] };
export type FormationAlert = { severity: "error" | "warning" | "info"; message: string };
export type FormationStatus = "blocked" | "review" | "ready";
export type Formation = {
  id: string; left: Hero; middle: Hero; right: Hero; troopText: string;
  robot?: string; leftSkillLevel?: number; leftSkillPercent?: number;
  alerts: FormationAlert[]; status: FormationStatus;
};
export type FelonPlan = { selected: Felon[]; preferredThird: "Rage Fist" | "Devil"; warning?: string };

const approvedNonSsr = new Set(["Lunarl", "Lofili", "Samir"]);
const troopClassLabels: Record<TroopClassKey, string> = {
  shield: "Shieldbearers", bomber: "Bombers", shooter: "Shooters",
};
const safeWhole = (value: number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const formatNumber = (value: number) => value.toLocaleString("en-US");

export function calculateTroopPlan(config: TroopConfig): TroopPlan {
  const capacity = safeWhole(config.capacity);
  const ratios: TroopValues = {
    shield: safeWhole(config.ratios.shield), bomber: safeWhole(config.ratios.bomber), shooter: safeWhole(config.ratios.shooter),
  };
  const ratioTotal = ratios.shield + ratios.bomber + ratios.shooter;
  const counts: TroopValues = {
    shield: Math.floor((capacity * ratios.shield) / 100),
    bomber: Math.floor((capacity * ratios.bomber) / 100),
    shooter: Math.floor((capacity * ratios.shooter) / 100),
  };
  if (ratioTotal === 100) counts.shooter = capacity - counts.shield - counts.bomber;
  const assignedTotal = counts.shield + counts.bomber + counts.shooter;
  const warnings: string[] = [];
  if (capacity < 1) warnings.push("March capacity must be at least 1.");
  if (ratioTotal !== 100) warnings.push(`Troop ratios total ${ratioTotal}%; they must total 100%.`);
  (Object.keys(counts) as TroopClassKey[]).forEach((key) => {
    const available = safeWhole(config.available[key]);
    if (counts[key] > available) warnings.push(`Need ${formatNumber(counts[key])} ${config.tiers[key]} ${troopClassLabels[key]}, but only ${formatNumber(available)} are available.`);
  });
  const parts = (Object.keys(counts) as TroopClassKey[])
    .filter((key) => counts[key] > 0)
    .map((key) => `${formatNumber(counts[key])} ${config.tiers[key]} ${troopClassLabels[key]}`);
  return { counts, ratioTotal, assignedTotal, text: `${ratios.shield} / ${ratios.bomber} / ${ratios.shooter} — ${parts.join(" + ") || "No troops assigned"}`, warnings };
}

export function validateFormation(
  formation: Omit<Formation, "alerts" | "status">,
  troopPlan: TroopPlan,
  mode: "leader" | "joiner",
): Pick<Formation, "alerts" | "status"> {
  const alerts: FormationAlert[] = troopPlan.warnings.map((message) => ({ severity: "error", message }));
  const formationHeroes = [formation.left, formation.middle, formation.right];
  if (new Set(formationHeroes.map((hero) => hero.cls)).size !== 3) alerts.push({ severity: "error", message: "Formation must contain exactly one Shield, one Bomber and one Shooter hero." });
  formationHeroes.forEach((hero) => {
    if (hero.rarity === "KOF") alerts.push({ severity: "error", message: `${hero.name} is a KOF hero and is excluded from Trial Cage.` });
    else if (hero.rarity !== "SSR" && !approvedNonSsr.has(hero.name)) alerts.push({ severity: "warning", message: `${hero.name} is ${hero.rarity}; CCW prefers SSR heroes for Cage formations.` });
  });
  if (!formation.robot) alerts.push({ severity: "warning", message: "No owned robot is assigned to this march." });
  if (mode === "joiner") {
    if (!formation.left.leftSkill) alerts.push({ severity: "error", message: "The LEFT hero has no confirmed first War skill for rally joining." });
    else {
      if (formation.left.leftTier === "filler") alerts.push({ severity: "warning", message: "Filler LEFT skill — use only after stronger LEFT heroes are exhausted." });
      if ((formation.leftSkillLevel ?? 5) < 5) alerts.push({ severity: "warning", message: `${formation.left.name}'s LEFT War skill is only Lv${formation.leftSkillLevel}.` });
      if (!formation.left.leftSkillVerified) alerts.push({ severity: "info", message: `${formation.left.name}'s exact War skill percentage progression is not yet verified.` });
    }
  }
  return {
    alerts,
    status: alerts.some((alert) => alert.severity === "error") ? "blocked" : alerts.some((alert) => alert.severity === "warning") ? "review" : "ready",
  };
}

function savedStarLevels(): HeroStarLevels {
  if (typeof window === "undefined") return {};
  try {
    const activeId = localStorage.getItem("loj-active-profile-v1");
    const profiles = JSON.parse(localStorage.getItem("loj-member-profiles-v1") ?? "[]");
    const active = Array.isArray(profiles) ? profiles.find((profile) => profile?.id === activeId) : null;
    return active?.heroStarLevels ?? {};
  } catch { return {}; }
}

function leaderNamesForRoster(availableHeroes: Hero[]): Set<string> {
  const eligible = availableHeroes.filter((hero) => hero.cageAllowed);
  const byName = new Map(eligible.map((hero) => [hero.name, hero]));
  const baseline = ["Ada", "Ryuichi", "Tyronn"].filter((name) => byName.has(name));
  if (baseline.length === 3) return new Set(baseline);
  const stars = savedStarLevels();
  const best = (cls: Hero["cls"]) => eligible.filter((hero) => hero.cls === cls).sort((a, b) => (stars[b.name] ?? 1) - (stars[a.name] ?? 1) || a.name.localeCompare(b.name))[0]?.name;
  return new Set([best("Shield"), best("Bomber"), best("Shooter")].filter((name): name is string => Boolean(name)));
}

export function generateJoinerFormations(
  availableHeroes: Hero[], count = 6, troopPlan: TroopPlan,
  warSkillLevels: WarSkillLevels = {}, ownedRobots: string[] = [], verifiedOnly = false,
): Formation[] {
  const reserved = leaderNamesForRoster(availableHeroes);
  const leaderHeroes = availableHeroes.filter((hero) => reserved.has(hero.name));
  const leaderFormation = leaderHeroes.length === 3
    ? ({ left: leaderHeroes[0], middle: leaderHeroes[1], right: leaderHeroes[2] } as Formation)
    : null;
  return generateJoinerFormationsSmart(availableHeroes, count, troopPlan, warSkillLevels, ownedRobots, verifiedOnly, savedStarLevels(), leaderFormation);
}

export function generateLeaderFormation(
  availableHeroes: Hero[], troopPlan: TroopPlan, ownedRobots: string[] = [],
): Formation | null {
  return generateLeaderFormationSmart(availableHeroes, troopPlan, ownedRobots, savedStarLevels());
}

export function optimizeFelons(felons: Felon[], ownedNames: string[], rallyFills: boolean): FelonPlan {
  const owned = felons.filter((felon) => ownedNames.includes(felon.name));
  const byName = new Map(owned.map((felon) => [felon.name, felon]));
  const preferredThird = rallyFills ? "Rage Fist" : "Devil";
  const alternateThird = rallyFills ? "Devil" : "Rage Fist";
  const order = ["Scorpion", "Cobra", preferredThird, alternateThird];
  const selected = order.map((name) => byName.get(name)).filter((felon): felon is Felon => Boolean(felon)).slice(0, 3);
  const missingCore = ["Scorpion", "Cobra"].filter((name) => !byName.has(name));
  const warnings: string[] = [];
  if (missingCore.length) warnings.push(`Missing core Yard Time felon${missingCore.length === 1 ? "" : "s"}: ${missingCore.join(" + ")}.`);
  if (!byName.has(preferredThird)) warnings.push(`${preferredThird} is preferred for this rally condition${byName.has(alternateThird) ? `; using ${alternateThird} instead` : ""}.`);
  if (selected.length < 3) warnings.push(`Only ${selected.length} owned Yard Time felon${selected.length === 1 ? " is" : "s are"} available.`);
  return { selected, preferredThird, warning: warnings.length ? warnings.join(" ") : undefined };
}
