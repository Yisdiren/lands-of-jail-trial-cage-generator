import type { Hero } from "../data/heroes";
import { cageRecommendationEvidence } from "./evidence";
import { recommendationReason } from "./presentation-insights";

export type HeroComparison = {
  name: string;
  cls: Hero["cls"];
  rarity: Hero["rarity"];
  stars: number;
  skillLevel: number;
  reason: string;
  evidence: ReturnType<typeof cageRecommendationEvidence>;
};

export function compareHero(hero: Hero, stars: number, skillLevel: number): HeroComparison {
  return {
    name: hero.name,
    cls: hero.cls,
    rarity: hero.rarity,
    stars,
    skillLevel,
    reason: recommendationReason(hero, skillLevel),
    evidence: cageRecommendationEvidence(hero),
  };
}

export type PersonalBest = { id: string; date: string; damage: number };
export function personalBestProgression<T extends PersonalBest>(results: T[]): T[] {
  let best=0;
  return [...results].reverse().filter(result => {
    if (result.damage <= best) return false;
    best=result.damage;
    return true;
  });
}
