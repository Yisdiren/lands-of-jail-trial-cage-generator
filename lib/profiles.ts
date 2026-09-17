import type {
  TroopPreset,
  TroopTiers,
  TroopValues,
  WarSkillLevels,
} from "./generator";

export type MemberRole = "leader" | "joiner";

export type MemberProfile = {
  id: string;
  playerName: string;
  server: string;
  role: MemberRole;
  season: number;
  ownedHeroes: string[];
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
  updatedAt: number;
};

export function createBlankProfile(id: string): MemberProfile {
  return {
    id,
    playerName: "New CCW Member",
    server: "",
    role: "joiner",
    season: 6,
    ownedHeroes: [],
    warSkillLevels: {},
    ownedRobots: [],
    ownedFelons: [],
    rallyFills: true,
    seatHolder: false,
    joinerCapacity: 100000,
    leaderCapacity: 100000,
    joinerRatios: { shield: 0, bomber: 0, shooter: 100 },
    leaderRatios: { shield: 0, bomber: 10, shooter: 90 },
    troopTiers: { shield: "T10", bomber: "T10", shooter: "T10" },
    availableTroops: { shield: 0, bomber: 0, shooter: 0 },
    troopPreset: "shooters",
    joinCount: 6,
    updatedAt: Date.now(),
  };
}
