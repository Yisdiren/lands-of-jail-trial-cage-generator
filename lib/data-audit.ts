import { heroes, robots } from "../data/heroes";
import { cageRecommendationEvidence } from "./evidence";

export type DataCheck = { level: "error" | "warning" | "info"; code: string; message: string };
export type DataAudit = { checks: DataCheck[]; errors: number; warnings: number; info: number };

export function auditGeneratorData(): DataAudit {
  const checks: DataCheck[] = [];
  const seen = new Set<string>();
  for (const hero of heroes) {
    if (seen.has(hero.name)) checks.push({ level: "error", code: "duplicate-hero", message: `Duplicate hero name: ${hero.name}` });
    seen.add(hero.name);
    if (!Number.isInteger(hero.season) || hero.season < 0 || hero.season > 7) checks.push({ level: "error", code: "hero-season", message: `${hero.name} has invalid season ${hero.season}.` });
    if (hero.leftSkillVerified && !hero.leftSkill) checks.push({ level: "error", code: "verified-without-skill", message: `${hero.name} is marked verified without LEFT skill text.` });
    if (hero.leftSkillValues && (!hero.leftSkill || hero.leftSkillValues.length !== 5 || hero.leftSkillValues.some(value => !Number.isFinite(value)))) checks.push({ level: "error", code: "skill-values", message: `${hero.name} has invalid LEFT skill progression.` });
    if (hero.leftSkillVerified && !hero.leftSkillValues) checks.push({ level: "warning", code: "verified-no-progression", message: `${hero.name} is verified but has no Lv1-Lv5 progression entered.` });
    const evidence = cageRecommendationEvidence(hero);
    if (evidence.recommendationBasis !== "not-ranked" && !hero.leftSkill) checks.push({ level: "warning", code: "rank-without-skill", message: `${hero.name} has Cage priority data but no LEFT skill text.` });
  }
  const robotNames = new Set<string>();
  for (const robot of robots) {
    if (robotNames.has(robot.name)) checks.push({ level: "error", code: "duplicate-robot", message: `Duplicate robot name: ${robot.name}` });
    robotNames.add(robot.name);
  }
  for (let season=1; season<=6; season++) {
    const pool=heroes.filter(hero=>hero.season<=season&&hero.cageAllowed&&hero.rarity!=="KOF");
    for (const cls of ["Shield","Bomber","Shooter"] as const) if (!pool.some(hero=>hero.cls===cls)) checks.push({ level:"error", code:"missing-class", message:`Season ${season} has no eligible ${cls} hero.` });
    const lefts=pool.filter(hero=>Boolean(hero.leftSkill));
    if (lefts.length<6) checks.push({ level:"info", code:"left-depth", message:`Season ${season} has only ${lefts.length} eligible LEFT-skill heroes before Main reservations.` });
  }
  return {
    checks,
    errors: checks.filter(check=>check.level==="error").length,
    warnings: checks.filter(check=>check.level==="warning").length,
    info: checks.filter(check=>check.level==="info").length,
  };
}
