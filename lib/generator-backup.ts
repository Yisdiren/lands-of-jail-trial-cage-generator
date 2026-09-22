import { felons, heroes, robots, type HeroClass } from "../data/heroes";
import { cageBuffs, prisonerArmorSetting, type PrisonerArmorSettings } from "./cage-buffs";
import { normalizeRobotPriority, normalizeStars } from "./simple-setup";

export const generatorBackupFormat = "loj-trial-cage-backup" as const;
export const generatorBackupVersion = 1 as const;

export type GeneratorBackup = {
  format: typeof generatorBackupFormat;
  version: typeof generatorBackupVersion;
  season: number;
  joinCount: number;
  owned: string[];
  heroStarLevels: Record<string, number>;
  ownedRobots: string[];
  robotPriority: string[];
  ownedFelons: string[];
  rallyFills: boolean;
  seatHolder: boolean;
  verifiedOnly: boolean;
  hideFillerLeft: boolean;
  leftClassFilter: HeroClass | "all";
  selectedBuffIds: string[];
  armorSettings: PrisonerArmorSettings;
  activationLeadMinutes: number;
};

const uniqueKnownStrings = (value: unknown, known: ReadonlySet<string>) => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === "string" && known.has(item)))]
  : [];

export function normalizeGeneratorBackup(value: unknown): GeneratorBackup {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("That file is not a Trial Cage generator backup.");
  const source = value as Record<string, unknown>;
  if (source.format !== generatorBackupFormat) throw new Error("That file is not a Trial Cage generator backup.");
  const version = Number(source.version ?? 1);
  if (!Number.isInteger(version) || version < 1 || version > generatorBackupVersion) throw new Error(`Backup version ${String(source.version)} is not supported.`);

  const heroNames = new Set(heroes.map(hero => hero.name));
  const robotNames = new Set(robots);
  const felonNames = new Set(felons.map(felon => felon.name));
  const buffIds = new Set(cageBuffs.map(buff => buff.id));
  const season = Number(source.season);
  const joinCount = Number(source.joinCount);
  const rawArmor = source.armorSettings && typeof source.armorSettings === "object" && !Array.isArray(source.armorSettings)
    ? source.armorSettings as Record<string, unknown>
    : {};
  const armorSettings = Object.fromEntries(cageBuffs.filter(buff => buff.source === "prisoner-armor" && rawArmor[buff.id]).map(buff => {
    const raw = rawArmor[buff.id];
    return [buff.id, prisonerArmorSetting(buff, raw && typeof raw === "object" && !Array.isArray(raw) ? { [buff.id]: raw as { level: number; value: number } } : {})];
  }));

  return {
    format: generatorBackupFormat,
    version: generatorBackupVersion,
    season: Number.isInteger(season) ? Math.max(1, Math.min(7, season)) : 6,
    joinCount: Number.isInteger(joinCount) ? Math.max(1, Math.min(6, joinCount)) : 6,
    owned: uniqueKnownStrings(source.owned, heroNames),
    heroStarLevels: normalizeStars(source.heroStarLevels),
    ownedRobots: uniqueKnownStrings(source.ownedRobots, robotNames),
    robotPriority: normalizeRobotPriority(source.robotPriority, robots),
    ownedFelons: uniqueKnownStrings(source.ownedFelons, felonNames),
    rallyFills: source.rallyFills !== false,
    seatHolder: source.seatHolder === true,
    verifiedOnly: source.verifiedOnly === true,
    hideFillerLeft: source.hideFillerLeft === true,
    leftClassFilter: source.leftClassFilter === "Shield" || source.leftClassFilter === "Bomber" || source.leftClassFilter === "Shooter" ? source.leftClassFilter : "all",
    selectedBuffIds: uniqueKnownStrings(source.selectedBuffIds, buffIds),
    armorSettings,
    activationLeadMinutes: Number.isFinite(Number(source.activationLeadMinutes)) ? Math.max(0, Math.min(120, Number(source.activationLeadMinutes))) : 5,
  };
}
