import type {
  TroopPreset,
  TroopTiers,
  TroopValues,
  WarSkillLevels,
} from "./generator";
import { defaultCageBuffProfile, sanitizeCageBuffProfile, type CageBuffProfile } from "./cage-buffs";

export type MemberRole = "leader" | "joiner";

export type MemberProfile = {
  id: string;
  playerName: string;
  server: string;
  role: MemberRole;
  season: number;
  ownedHeroes: string[];
  heroStarLevels: Record<string, number>;
  warSkillLevels: WarSkillLevels;
  ownedRobots: string[];
  ownedFelons: string[];
  rallyFills: boolean;
  seatHolder: boolean;
  joinerCapacity: number;
  leaderCapacity: number;
  joinerRatios: TroopValues;
  leaderRatios: TroopValues;
  troopTiers: TroopTiers;
  availableTroops: TroopValues;
  troopPreset: TroopPreset;
  joinCount: number;
  verifiedOnly?: boolean;
  cageBuffProfile?: CageBuffProfile;
  updatedAt: number;
};

type ProfileExport = { format: "loj-member-profile"; version: 1; exportedAt: string; profile: MemberProfile };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
const finiteNumber = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const troopValues = (value: unknown, fallback: TroopValues): TroopValues => !isRecord(value) ? fallback : ({ shield: finiteNumber(value.shield, fallback.shield), bomber: finiteNumber(value.bomber, fallback.bomber), shooter: finiteNumber(value.shooter, fallback.shooter) });
const troopTiers = (value: unknown, fallback: TroopTiers): TroopTiers => {
  if (!isRecord(value)) return fallback;
  const tier = (entry: unknown, defaultTier: TroopTiers["shield"]) => typeof entry === "string" && /^T(?:[1-9]|1[01])$/.test(entry) ? (entry as TroopTiers["shield"]) : defaultTier;
  return { shield: tier(value.shield, fallback.shield), bomber: tier(value.bomber, fallback.bomber), shooter: tier(value.shooter, fallback.shooter) };
};

export function serializeProfile(profile: MemberProfile): string {
  const payload: ProfileExport = { format: "loj-member-profile", version: 1, exportedAt: new Date().toISOString(), profile };
  return JSON.stringify(payload, null, 2);
}

export function parseProfileExport(contents: string, id: string): MemberProfile {
  const payload: unknown = JSON.parse(contents);
  if (!isRecord(payload) || payload.format !== "loj-member-profile" || payload.version !== 1 || !isRecord(payload.profile)) throw new Error("This is not a supported Lands of Jail member profile.");
  const source = payload.profile;
  const fallback = createBlankProfile(id);
  if (typeof source.playerName !== "string" || !source.playerName.trim()) throw new Error("The imported profile is missing a player name.");
  const warSkillLevels: WarSkillLevels = {};
  if (isRecord(source.warSkillLevels)) Object.entries(source.warSkillLevels).forEach(([name, level]) => { if (name && typeof level === "number" && Number.isFinite(level)) warSkillLevels[name] = level; });
  const heroStarLevels: Record<string, number> = {};
  if (isRecord(source.heroStarLevels)) Object.entries(source.heroStarLevels).forEach(([name, level]) => { if (name && typeof level === "number" && Number.isFinite(level)) heroStarLevels[name] = Math.min(5, Math.max(1, Math.floor(level))); });
  return {
    id,
    playerName: source.playerName.trim(),
    server: typeof source.server === "string" ? source.server.trim() : "",
    role: source.role === "leader" ? "leader" : "joiner",
    season: finiteNumber(source.season, fallback.season),
    ownedHeroes: stringArray(source.ownedHeroes), heroStarLevels, warSkillLevels,
    ownedRobots: stringArray(source.ownedRobots), ownedFelons: stringArray(source.ownedFelons),
    rallyFills: typeof source.rallyFills === "boolean" ? source.rallyFills : fallback.rallyFills,
    seatHolder: typeof source.seatHolder === "boolean" ? source.seatHolder : fallback.seatHolder,
    joinerCapacity: finiteNumber(source.joinerCapacity, fallback.joinerCapacity), leaderCapacity: finiteNumber(source.leaderCapacity, fallback.leaderCapacity),
    joinerRatios: troopValues(source.joinerRatios, fallback.joinerRatios), leaderRatios: troopValues(source.leaderRatios, fallback.leaderRatios),
    troopTiers: troopTiers(source.troopTiers, fallback.troopTiers), availableTroops: troopValues(source.availableTroops, fallback.availableTroops),
    troopPreset: source.troopPreset === "10-90" || source.troopPreset === "shooters" ? source.troopPreset : fallback.troopPreset,
    joinCount: finiteNumber(source.joinCount, fallback.joinCount), verifiedOnly: typeof source.verifiedOnly === "boolean" ? source.verifiedOnly : fallback.verifiedOnly,
    cageBuffProfile: sanitizeCageBuffProfile(isRecord(source.cageBuffProfile) ? source.cageBuffProfile as Partial<CageBuffProfile> : fallback.cageBuffProfile),
    updatedAt: Date.now(),
  };
}

export function createBlankProfile(id: string): MemberProfile {
  return {
    id, playerName: "New Player", server: "", role: "joiner", season: 1,
    ownedHeroes: [], heroStarLevels: {}, warSkillLevels: {}, ownedRobots: [], ownedFelons: [],
    rallyFills: true, seatHolder: false, joinerCapacity: 100000, leaderCapacity: 100000,
    joinerRatios: { shield: 0, bomber: 0, shooter: 100 }, leaderRatios: { shield: 0, bomber: 10, shooter: 90 },
    troopTiers: { shield: "T10", bomber: "T10", shooter: "T10" }, availableTroops: { shield: 0, bomber: 0, shooter: 0 },
    troopPreset: "shooters", joinCount: 6, verifiedOnly: false, cageBuffProfile: defaultCageBuffProfile, updatedAt: Date.now(),
  };
}
