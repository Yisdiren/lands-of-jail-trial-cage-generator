import type { CageResult } from "./results";
import { parseProfileExport, type MemberProfile } from "./profiles";

export type AllianceBackupData = {
  profiles: MemberProfile[];
  results: Record<string, CageResult[]>;
};

type AllianceBackupFile = {
  format: "loj-alliance-backup";
  version: 1;
  exportedAt: string;
  profiles: MemberProfile[];
  results: Record<string, CageResult[]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cageResult = (value: unknown): CageResult | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.cage !== "Cage 1" && value.cage !== "Cage 2") ||
    typeof value.date !== "string" ||
    typeof value.testName !== "string" ||
    (value.variant !== "A" && value.variant !== "B") ||
    typeof value.leftHero !== "string" ||
    typeof value.damage !== "number" ||
    !Number.isFinite(value.damage)
  ) {
    return null;
  }
  return {
    id: value.id,
    cage: value.cage,
    date: value.date,
    testName: value.testName,
    variant: value.variant,
    leftHero: value.leftHero,
    damage: value.damage,
    notes: typeof value.notes === "string" ? value.notes : "",
    createdAt:
      typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
        ? value.createdAt
        : Date.now(),
  };
};

export function serializeAllianceBackup(
  profiles: MemberProfile[],
  results: Record<string, CageResult[]>,
): string {
  const payload: AllianceBackupFile = {
    format: "loj-alliance-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles,
    results,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseAllianceBackup(
  contents: string,
  createId: (sourceId: string, index: number) => string,
): AllianceBackupData {
  const payload: unknown = JSON.parse(contents);
  if (
    !isRecord(payload) ||
    payload.format !== "loj-alliance-backup" ||
    payload.version !== 1 ||
    !Array.isArray(payload.profiles) ||
    !payload.profiles.length ||
    !isRecord(payload.results)
  ) {
    throw new Error("This is not a supported Lands of Jail alliance backup.");
  }

  const results: Record<string, CageResult[]> = {};
  const sourceResultsByProfile = payload.results;
  const profiles = payload.profiles.map((source, index) => {
    if (!isRecord(source) || typeof source.id !== "string") {
      throw new Error(
        "The alliance backup contains an invalid member profile.",
      );
    }
    const id = createId(source.id, index);
    const profile = parseProfileExport(
      JSON.stringify({
        format: "loj-member-profile",
        version: 1,
        exportedAt: new Date().toISOString(),
        profile: source,
      }),
      id,
    );
    const sourceResults = sourceResultsByProfile[source.id];
    results[id] = Array.isArray(sourceResults)
      ? sourceResults
          .map(cageResult)
          .filter((result): result is CageResult => result !== null)
      : [];
    return profile;
  });

  return { profiles, results };
}
