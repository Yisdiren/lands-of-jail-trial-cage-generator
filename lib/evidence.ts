import type { Hero } from "../data/heroes";

export type CageRecommendationEvidence = {
  gameEvidence: "verified" | "unverified" | "not-entered";
  recommendationBasis: "tested-priority" | "heuristic-only" | "not-ranked";
};

export function cageRecommendationEvidence(hero: Hero): CageRecommendationEvidence {
  return {
    gameEvidence: hero.leftSkill ? (hero.leftSkillVerified ? "verified" : "unverified") : "not-entered",
    recommendationBasis: hero.leftTier || hero.leftValue !== undefined
      ? (hero.priorityNote?.toLowerCase().includes("tested cage priority") ? "tested-priority" : "heuristic-only")
      : "not-ranked",
  };
}
