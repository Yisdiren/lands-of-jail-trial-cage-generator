import type { Hero, HeroClass } from "../data/heroes";
import { calculateTroopPlan, type FormationStatus } from "./generator";
import type { MemberProfile } from "./profiles";

export type MemberReadiness = {
  status: FormationStatus;
  issues: string[];
  classCounts: Record<HeroClass, number>;
  possibleMarches: number;
  requestedMarches: number;
  capacity: number;
};

const classNames: HeroClass[] = ["Shield", "Bomber", "Shooter"];

export function evaluateMemberReadiness(
  profile: MemberProfile,
  heroes: Hero[],
): MemberReadiness {
  const owned = new Set(profile.ownedHeroes);
  const eligible = heroes.filter(
    (hero) =>
      owned.has(hero.name) &&
      hero.cageAllowed &&
      (hero.season === 0 || hero.season <= profile.season),
  );
  const classCounts = Object.fromEntries(
    classNames.map((heroClass) => [
      heroClass,
      eligible.filter((hero) => hero.cls === heroClass).length,
    ]),
  ) as Record<HeroClass, number>;
  const requestedMarches = profile.role === "leader" ? 1 : profile.joinCount;
  const possibleMarches = Math.min(
    requestedMarches,
    ...classNames.map((heroClass) => classCounts[heroClass]),
  );
  const capacity =
    profile.role === "leader" ? profile.leaderCapacity : 100000;
  const ratios =
    profile.role === "leader" ? profile.leaderRatios : profile.joinerRatios;
  const troopPlan = calculateTroopPlan({
    capacity,
    ratios,
    tiers: profile.troopTiers,
    available: profile.availableTroops,
  });
  const blockers: string[] = [];
  const reviews: string[] = [];

  classNames.forEach((heroClass) => {
    if (classCounts[heroClass] === 0) {
      blockers.push(`No eligible ${heroClass} hero`);
    }
  });
  if (capacity < 1) blockers.push("March capacity is not set");
  if (troopPlan.ratioTotal !== 100)
    blockers.push("Troop ratios do not total 100%");

  if (!profile.server) reviews.push("Server is not set");
  if (possibleMarches < requestedMarches && !blockers.length) {
    const shortages = classNames
      .map((heroClass) => {
        const missing = requestedMarches - classCounts[heroClass];
        return missing > 0 ? `${missing} more ${heroClass} hero${missing === 1 ? "" : "es"}` : "";
      })
      .filter(Boolean);
    reviews.push(
      `Can build ${possibleMarches} of ${requestedMarches} marches${shortages.length ? `; needs ${shortages.join(", ")}` : ""}`,
    );
  }
  if (profile.role === "joiner") {
    const leftCount = eligible.filter((hero) => hero.leftSkill).length;
    if (leftCount < requestedMarches) {
      reviews.push(
        `Needs ${requestedMarches - leftCount} more eligible LEFT-skill hero${requestedMarches - leftCount === 1 ? "" : "es"} for ${requestedMarches} joiners`,
      );
    }
  }
  if (!profile.ownedRobots.length) reviews.push("No owned robot selected");
  if (
    profile.role === "leader" &&
    (!profile.ownedFelons.includes("Scorpion") ||
      !profile.ownedFelons.includes("Cobra"))
  ) {
    reviews.push("Scorpion/Cobra leader core is incomplete");
  }
  troopPlan.warnings
    .filter(
      (warning) =>
        !warning.includes("capacity must") && !warning.includes("must total"),
    )
    .forEach((warning) => reviews.push(warning));

  const issues = [...blockers, ...reviews];
  return {
    status: blockers.length ? "blocked" : reviews.length ? "review" : "ready",
    issues,
    classCounts,
    possibleMarches,
    requestedMarches,
    capacity,
  };
}
